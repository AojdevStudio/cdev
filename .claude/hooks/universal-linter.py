#!/usr/bin/env -S uv run --script

# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///

import hashlib
import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

# Simple file validation cache to prevent redundant work
validation_cache = {}
CACHE_TTL = timedelta(minutes=5)

def get_file_hash(file_path: str) -> Optional[str]:
    """Generate file hash for cache key"""
    try:
        path = Path(file_path)
        if not path.exists():
            return None
        
        content = path.read_text(encoding='utf-8')
        mtime = path.stat().st_mtime
        return hashlib.md5(f"{content}{mtime}".encode()).hexdigest()
    except Exception:
        return None

def is_cached_valid(file_path: str) -> Optional[Dict[str, Any]]:
    """Check if file was recently validated"""
    file_hash = get_file_hash(file_path)
    if not file_hash:
        return None
    
    cache_key = f"{file_path}:{file_hash}"
    cached = validation_cache.get(cache_key)
    
    if cached and datetime.now() - cached['timestamp'] < CACHE_TTL:
        return cached['result']
    
    return None

def cache_result(file_path: str, result: Dict[str, Any]):
    """Cache validation result"""
    file_hash = get_file_hash(file_path)
    if not file_hash:
        return
    
    cache_key = f"{file_path}:{file_hash}"
    validation_cache[cache_key] = {
        'result': result,
        'timestamp': datetime.now()
    }

def should_validate_file(file_path: str) -> bool:
    """Check if file should be validated"""
    if not file_path:
        return False
    
    # Skip non-existent files
    if not Path(file_path).exists():
        return False
    
    # Only validate TypeScript/JavaScript files
    ext = Path(file_path).suffix
    return ext in ['.ts', '.tsx', '.js', '.jsx']

def run_biome_check(file_path: str) -> Dict[str, Any]:
    """Run Biome linting check"""
    try:
        # Try to run Biome check
        result = subprocess.run(
            ['pnpm', 'biome', 'check', file_path, '--apply'],
            capture_output=True,
            text=True,
            check=True
        )
        
        return {
            'success': True,
            'message': f'✅ Biome check passed for {Path(file_path).name}',
            'output': result.stdout
        }
    except subprocess.CalledProcessError as error:
        error_output = error.stdout or error.stderr or str(error)
        
        # Parse specific Biome error types
        issues = []
        if 'Format' in error_output:
            issues.append('formatting issues')
        if 'Lint' in error_output:
            issues.append('linting issues')
        if 'Organize imports' in error_output:
            issues.append('import organization issues')
        
        if not issues:
            issues.append('validation issues')
        
        return {
            'success': False,
            'message': f'❌ Biome found {", ".join(issues)} in {Path(file_path).name}',
            'output': error_output,
            'fix': f'Run: pnpm biome check {file_path} --apply'
        }
    except FileNotFoundError:
        return {
            'success': True,
            'message': 'ℹ️ Biome not available, skipping check',
            'output': ''
        }

def run_typescript_check() -> Dict[str, Any]:
    """Run TypeScript type checking"""
    try:
        # Try to run TypeScript check
        result = subprocess.run(
            ['pnpm', 'typecheck'],
            capture_output=True,
            text=True,
            check=True
        )
        
        return {
            'success': True,
            'message': '✅ TypeScript check passed',
            'output': result.stdout
        }
    except subprocess.CalledProcessError as error:
        error_output = error.stdout or error.stderr or str(error)
        
        return {
            'success': False,
            'message': '❌ TypeScript check failed',
            'output': error_output,
            'fix': 'Fix TypeScript errors shown above'
        }
    except FileNotFoundError:
        return {
            'success': True,
            'message': 'ℹ️ TypeScript not available, skipping check',
            'output': ''
        }

def validate_file(file_path: str) -> Dict[str, Any]:
    """Validate a single file"""
    # Check cache first
    cached = is_cached_valid(file_path)
    if cached:
        return cached
    
    # Check if file should be validated
    if not should_validate_file(file_path):
        result = {
            'approve': True,
            'message': f'ℹ️ Skipped {Path(file_path).name} (not a TypeScript/JavaScript file)'
        }
        return result
    
    # Run Biome check
    biome_result = run_biome_check(file_path)
    
    # Run TypeScript check (project-wide)
    typescript_result = run_typescript_check()
    
    # Combine results
    all_passed = biome_result['success'] and typescript_result['success']
    
    if all_passed:
        result = {
            'approve': True,
            'message': f'✅ All checks passed for {Path(file_path).name}'
        }
    else:
        issues = []
        fixes = []
        
        if not biome_result['success']:
            issues.append(biome_result['message'])
            if 'fix' in biome_result:
                fixes.append(biome_result['fix'])
        
        if not typescript_result['success']:
            issues.append(typescript_result['message'])
            if 'fix' in typescript_result:
                fixes.append(typescript_result['fix'])
        
        message_parts = ['❌ Validation failed:'] + issues
        if fixes:
            message_parts.extend(['', '🔧 Fixes:'] + fixes)
        
        result = {
            'approve': False,
            'message': '\n'.join(message_parts)
        }
    
    # Cache result
    cache_result(file_path, result)
    
    return result

def main():
    """Main execution"""
    try:
        input_data = json.load(sys.stdin)
        
        # Extract file path from tool input
        tool_input = input_data.get('tool_input', {})
        file_path = tool_input.get('file_path')
        
        if not file_path:
            # No file path provided, approve by default
            result = {
                'approve': True,
                'message': 'ℹ️ No file path provided, skipping validation'
            }
        else:
            result = validate_file(file_path)
        
        print(json.dumps(result))
        
    except Exception as error:
        print(json.dumps({
            'approve': True,
            'message': f'Universal linter error: {error}'
        }))


if __name__ == '__main__':
    main()