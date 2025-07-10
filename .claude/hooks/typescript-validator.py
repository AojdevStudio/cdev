#!/usr/bin/env -S uv run --script

# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///

import json
import sys
import os
import subprocess
import hashlib
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

# Validation cache to prevent redundant work
validation_cache = {}
CACHE_TTL = timedelta(minutes=5)

# Configuration
DEBUG_MODE = os.environ.get('CLAUDE_HOOKS_DEBUG') == '1'
FAST_MODE = '--fast' in sys.argv
ZERO_TOLERANCE = os.environ.get('CLAUDE_HOOKS_ZERO_TOLERANCE', 'true').lower() != 'false'


class TypeScriptValidator:
    def __init__(self, hook_input: Dict[str, Any]):
        self.hook_input = hook_input
        self.errors = []
        self.warnings = []
        self.violations = []
        self.blockers = []
        self.results = {
            'biome': None,
            'typecheck': None,
            'codeStandards': None
        }

    async def validate(self) -> Dict[str, Any]:
        """Main validation entry point"""
        tool_name = self.hook_input.get('tool_name')
        tool_input = self.hook_input.get('tool_input')
        phase = self.hook_input.get('phase')
        
        # Extract file path and determine if we should validate
        file_path = self.extract_file_path(tool_input)
        if not file_path or not self.should_validate_file(file_path):
            return self.approve('File skipped - not a TypeScript/JavaScript file')

        # Check cache first
        cached = self.get_cached_result(file_path)
        if cached and not FAST_MODE:
            if DEBUG_MODE:
                print(f"Using cached TypeScript validation for: {file_path}", file=sys.stderr)
            return cached

        # Determine validation mode based on phase and context
        validation_mode = self.determine_validation_mode(tool_input, phase)
        if DEBUG_MODE:
            print(f"TypeScript validation mode: {validation_mode['type']} ({validation_mode['reason']})", file=sys.stderr)

        # Run validation steps
        await self.validate_biome(file_path, validation_mode)
        await self.validate_typecheck(validation_mode)
        await self.validate_coding_standards(tool_input, file_path)

        # Determine final result
        final_result = self.get_final_result()
        
        # Cache result
        self.cache_result(file_path, final_result)
        
        return final_result

    def extract_file_path(self, tool_input: Any) -> Optional[str]:
        """Extract file path from tool input"""
        if isinstance(tool_input, dict):
            return tool_input.get('file_path')
        return None

    def should_validate_file(self, file_path: str) -> bool:
        """Check if file should be validated"""
        if not file_path:
            return False
        
        ext = Path(file_path).suffix
        return ext in ['.ts', '.tsx', '.js', '.jsx']

    def get_cached_result(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get cached validation result"""
        try:
            if not Path(file_path).exists():
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            mtime = Path(file_path).stat().st_mtime
            cache_key = hashlib.md5(f"{content}{mtime}".encode()).hexdigest()
            
            cached = validation_cache.get(f"{file_path}:{cache_key}")
            if cached and datetime.now() - cached['timestamp'] < CACHE_TTL:
                return cached['result']
        except Exception:
            pass
        
        return None

    def cache_result(self, file_path: str, result: Dict[str, Any]):
        """Cache validation result"""
        try:
            if not Path(file_path).exists():
                return
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            mtime = Path(file_path).stat().st_mtime
            cache_key = hashlib.md5(f"{content}{mtime}".encode()).hexdigest()
            
            validation_cache[f"{file_path}:{cache_key}"] = {
                'result': result,
                'timestamp': datetime.now()
            }
        except Exception:
            pass

    def determine_validation_mode(self, tool_input: Any, phase: str) -> Dict[str, str]:
        """Determine validation mode based on phase and context"""
        if phase == 'Stop':
            return {'type': 'full', 'reason': 'Stop phase requires full validation'}
        
        if isinstance(tool_input, dict) and tool_input.get('file_path'):
            return {'type': 'file-specific', 'reason': 'File-specific validation'}
        
        return {'type': 'incremental', 'reason': 'Incremental validation'}

    async def validate_biome(self, file_path: str, validation_mode: Dict[str, str]):
        """Run Biome validation (formatting, linting, imports)"""
        try:
            biome_command = self.build_biome_command(file_path, validation_mode)
            if DEBUG_MODE:
                print(f"Running: {biome_command}", file=sys.stderr)
            
            subprocess.run(biome_command, shell=True, check=True, capture_output=True, text=True)
            
            self.results['biome'] = {'success': True, 'message': 'Biome validation passed'}
            
        except subprocess.CalledProcessError as error:
            error_output = error.stdout or error.stderr or str(error)
            
            # Parse Biome error types
            biome_errors = []
            if 'Format' in error_output:
                biome_errors.append(f'Biome formatting issues in {file_path}')
            if 'Lint' in error_output:
                biome_errors.append(f'Biome linting issues in {file_path}')
            if 'Organize imports' in error_output:
                biome_errors.append(f'Import organization issues in {file_path}')
            
            if not biome_errors:
                biome_errors.append(f'Biome check failed for {file_path}: {error_output[:200]}')
            
            self.errors.extend(biome_errors)
            self.results['biome'] = {
                'success': False,
                'errors': biome_errors,
                'fix': ("Run 'pnpm biome:check --apply' on changed files" if validation_mode['type'] == 'incremental'
                       else "Run 'pnpm biome:check --apply' and fix all remaining issues")
            }

    async def validate_typecheck(self, validation_mode: Dict[str, str]):
        """Run TypeScript type checking"""
        try:
            typecheck_command = self.build_typecheck_command(validation_mode)
            if DEBUG_MODE:
                print(f"Running: {typecheck_command}", file=sys.stderr)
            
            subprocess.run(typecheck_command, shell=True, check=True, capture_output=True, text=True)
            
            self.results['typecheck'] = {'success': True, 'message': 'TypeScript check passed'}
            
        except subprocess.CalledProcessError as error:
            error_output = error.stdout or error.stderr or str(error)
            
            self.errors.append(f'TypeScript type errors: {error_output[:300]}')
            self.results['typecheck'] = {
                'success': False,
                'error': error_output,
                'fix': ("Fix TypeScript errors in modified files" if validation_mode['type'] == 'incremental'
                       else "Fix all TypeScript errors before completing task")
            }

    async def validate_coding_standards(self, tool_input: Any, file_path: str):
        """Run coding standards validation"""
        try:
            content = tool_input.get('content') if isinstance(tool_input, dict) else None
            if not content:
                self.results['codeStandards'] = {'success': True, 'message': 'No content to validate'}
                return

            # Run all coding standards checks
            self.validate_no_any_type(content)
            self.validate_no_var(content)
            self.validate_null_safety(content)
            self.validate_implicit_globals(content)
            self.validate_empty_catch(content)
            self.validate_magic_numbers(content)
            self.validate_component_structure(content, file_path)
            self.validate_api_route_structure(content, file_path)
            self.validate_file_name(file_path)

            self.results['codeStandards'] = {
                'success': len(self.blockers) == 0,
                'violations': len(self.violations),
                'blockers': len(self.blockers)
            }

        except Exception as error:
            self.warnings.append(f'Coding standards validation error: {error}')
            self.results['codeStandards'] = {'success': True, 'message': 'Coding standards check skipped due to error'}

    def build_biome_command(self, file_path: str, validation_mode: Dict[str, str]) -> str:
        """Build Biome command based on validation mode"""
        if validation_mode['type'] == 'full':
            return 'pnpm biome:check --apply'
        
        if validation_mode['type'] == 'file-specific':
            return f'pnpm biome check "{file_path}" --apply'
        
        # For incremental validation, check changed files
        try:
            changed_files = subprocess.run(['git', 'diff', '--name-only', 'HEAD'], 
                                         capture_output=True, text=True, check=True).stdout.strip()
            staged_files = subprocess.run(['git', 'diff', '--cached', '--name-only'], 
                                        capture_output=True, text=True, check=True).stdout.strip()
            
            if not changed_files and not staged_files:
                return f'pnpm biome check "{file_path}" --apply'
            
            # Build command for changed files
            all_files = []
            if changed_files:
                all_files.extend(changed_files.split('\n'))
            if staged_files:
                all_files.extend(staged_files.split('\n'))
            
            # Filter for TypeScript/JavaScript files
            ts_files = [f for f in all_files if Path(f).suffix in ['.ts', '.tsx', '.js', '.jsx']]
            
            if ts_files:
                files_str = ' '.join(f'"{f}"' for f in ts_files)
                return f'pnpm biome check {files_str} --apply'
            else:
                return f'pnpm biome check "{file_path}" --apply'
                
        except subprocess.CalledProcessError:
            return f'pnpm biome check "{file_path}" --apply'

    def build_typecheck_command(self, validation_mode: Dict[str, str]) -> str:
        """Build TypeScript check command"""
        if validation_mode['type'] == 'full':
            return 'pnpm typecheck'
        else:
            return 'pnpm typecheck --noEmit'

    def validate_no_any_type(self, content: str):
        """Check for 'any' type usage"""
        any_pattern = r'\b:\s*any\b'
        matches = re.findall(any_pattern, content)
        if matches:
            self.violations.append({
                'rule': 'No Any Type',
                'message': f'Found {len(matches)} usage(s) of "any" type',
                'severity': 'error'
            })
            self.blockers.append('Use "unknown" or specific types instead of "any"')

    def validate_no_var(self, content: str):
        """Check for 'var' declarations"""
        var_pattern = r'\bvar\s+\w+'
        matches = re.findall(var_pattern, content)
        if matches:
            self.violations.append({
                'rule': 'No Var',
                'message': f'Found {len(matches)} usage(s) of "var" declaration',
                'severity': 'error'
            })
            self.blockers.append('Use "const" or "let" instead of "var"')

    def validate_null_safety(self, content: str):
        """Check for null safety issues"""
        null_access_pattern = r'\.\w+\s*\('
        if re.search(null_access_pattern, content):
            if '?.' not in content:
                self.violations.append({
                    'rule': 'Null Safety',
                    'message': 'Potential null reference access without optional chaining',
                    'severity': 'warning'
                })

    def validate_implicit_globals(self, content: str):
        """Check for implicit global variables"""
        # Simple check for undeclared variables
        if re.search(r'\b\w+\s*=\s*[^=]', content) and 'let ' not in content and 'const ' not in content and 'var ' not in content:
            self.violations.append({
                'rule': 'Implicit Globals',
                'message': 'Potential implicit global variable usage',
                'severity': 'warning'
            })

    def validate_empty_catch(self, content: str):
        """Check for empty catch blocks"""
        empty_catch_pattern = r'catch\s*\(\s*\w*\s*\)\s*\{\s*\}'
        if re.search(empty_catch_pattern, content):
            self.violations.append({
                'rule': 'Empty Catch',
                'message': 'Empty catch block detected',
                'severity': 'warning'
            })

    def validate_magic_numbers(self, content: str):
        """Check for magic numbers"""
        magic_number_pattern = r'\b\d{2,}\b'
        matches = re.findall(magic_number_pattern, content)
        if len(matches) > 3:
            self.violations.append({
                'rule': 'Magic Numbers',
                'message': f'Found {len(matches)} potential magic numbers',
                'severity': 'warning'
            })

    def validate_component_structure(self, content: str, file_path: str):
        """Validate React component structure"""
        if Path(file_path).suffix in ['.tsx', '.jsx']:
            if 'export default' not in content:
                self.violations.append({
                    'rule': 'Component Structure',
                    'message': 'React component should have default export',
                    'severity': 'warning'
                })

    def validate_api_route_structure(self, content: str, file_path: str):
        """Validate API route structure"""
        if '/api/' in file_path:
            if 'export' not in content:
                self.violations.append({
                    'rule': 'API Route Structure',
                    'message': 'API route should export handler functions',
                    'severity': 'warning'
                })

    def validate_file_name(self, file_path: str):
        """Validate file naming conventions"""
        file_name = Path(file_path).name
        if not re.match(r'^[a-z0-9-_.]+$', file_name):
            self.violations.append({
                'rule': 'File Naming',
                'message': f'File name "{file_name}" should use kebab-case',
                'severity': 'warning'
            })

    def get_final_result(self) -> Dict[str, Any]:
        """Determine final validation result"""
        if self.errors or self.blockers:
            return self.block()
        else:
            return self.approve()

    def approve(self, custom_message: str = None) -> Dict[str, Any]:
        """Approve validation"""
        message = custom_message or '✅ TypeScript validation passed'
        if self.warnings:
            message += f' ({len(self.warnings)} warnings)'
        
        return {
            'approve': True,
            'message': message
        }

    def block(self) -> Dict[str, Any]:
        """Block validation due to errors"""
        message_parts = ['❌ TypeScript validation failed:']
        
        if self.errors:
            message_parts.extend([f'  - {error}' for error in self.errors])
        
        if self.blockers:
            message_parts.append('')
            message_parts.append('🔧 Required fixes:')
            message_parts.extend([f'  - {blocker}' for blocker in self.blockers])
        
        return {
            'approve': False,
            'message': '\n'.join(message_parts)
        }


async def main():
    """Main execution"""
    try:
        input_data = json.load(sys.stdin)
        validator = TypeScriptValidator(input_data)
        result = await validator.validate()
        
        print(json.dumps(result))
    except Exception as error:
        print(json.dumps({
            'approve': False,
            'message': f'TypeScript validator error: {error}'
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    import asyncio
    asyncio.run(main())