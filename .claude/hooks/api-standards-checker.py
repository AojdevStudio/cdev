#!/usr/bin/env python3
# /// script
# requires-python = ">=3.8"
# dependencies = []
# ///
"""
API Standards Checker - UV Script Version
Validates API routes follow project conventions

Usage:
    uv run api-standards-checker.py <file_path>
    uv run api-standards-checker.py --check-dir <directory>
    uv run api-standards-checker.py --hook-mode  # For Claude Code hook compatibility
"""

import json
import sys
import re
import os
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import argparse


@dataclass
class Violation:
    rule: str
    message: str
    severity: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None


class ApiStandardsChecker:
    def __init__(self, file_path: Optional[str] = None):
        self.file_path = file_path
        self.violations: List[Violation] = []
        self.suggestions: List[Violation] = []
        
    def validate_file(self, file_path: str, content: str) -> List[Violation]:
        """Validate a single file's content"""
        self.file_path = file_path
        self.violations = []
        self.suggestions = []
        
        # Only validate API route files
        if not self.is_api_route(file_path):
            return []
            
        # Perform validations
        self.validate_file_name(file_path)
        self.validate_http_methods(content)
        self.validate_response_format(content)
        self.validate_error_handling(content)
        self.validate_authentication(content, file_path)
        self.validate_input_validation(content)
        self.validate_multi_tenancy(content)
        
        return self.violations + self.suggestions
    
    def is_api_route(self, file_path: str) -> bool:
        """Check if file is an API route"""
        return '/app/api/' in file_path and '.test.' not in file_path
    
    def validate_file_name(self, file_path: str):
        """Validate file naming convention"""
        file_name = os.path.basename(file_path)
        
        if file_name not in ['route.ts', 'route.js']:
            self.violations.append(Violation(
                rule='File Naming',
                message=f"API route files must be named 'route.ts', found: {file_name}",
                severity='error',
                file_path=file_path
            ))
    
    def validate_http_methods(self, content: str):
        """Validate HTTP method exports"""
        valid_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
        exported_methods = []
        
        # Find exported HTTP methods
        for method in valid_methods:
            patterns = [
                rf'export\s+const\s+{method}\s*=',
                rf'export\s+async\s+function\s+{method}',
                rf'export\s+function\s+{method}'
            ]
            
            if any(re.search(pattern, content) for pattern in patterns):
                exported_methods.append(method)
        
        if not exported_methods:
            self.violations.append(Violation(
                rule='HTTP Methods',
                message='API routes should export named HTTP method handlers (GET, POST, etc.)',
                severity='error',
                file_path=self.file_path
            ))
        
        # Check for consistent async usage
        for method in exported_methods:
            async_pattern = rf'export\s+const\s+{method}\s*=\s*async'
            function_pattern = rf'export\s+async\s+function\s+{method}'
            
            if not re.search(async_pattern, content) and not re.search(function_pattern, content):
                self.suggestions.append(Violation(
                    rule='Async Handlers',
                    message=f'Consider making {method} handler async for consistency',
                    severity='info',
                    file_path=self.file_path
                ))
    
    def validate_response_format(self, content: str):
        """Validate response format consistency"""
        has_api_utils = any(util in content for util in ['apiSuccess', 'apiError', 'apiPaginated'])
        has_next_response = 'NextResponse.json' in content
        has_response_json = 'Response.json' in content
        
        if not has_api_utils and (has_next_response or has_response_json):
            self.suggestions.append(Violation(
                rule='Response Format',
                message='Consider using standardized API utilities (apiSuccess, apiError, apiPaginated) for consistent responses',
                severity='warning',
                file_path=self.file_path
            ))
        
        # Check for consistent status codes
        status_matches = re.findall(r'status[:(]\s*(\d{3})', content)
        valid_codes = ['200', '201', '204', '400', '401', '403', '404', '500']
        
        for code in status_matches:
            if code not in valid_codes:
                self.suggestions.append(Violation(
                    rule='Status Codes',
                    message=f'Unusual status code {code} - ensure it\'s appropriate',
                    severity='info',
                    file_path=self.file_path
                ))
    
    def validate_error_handling(self, content: str):
        """Validate error handling patterns"""
        has_try_catch = 'try' in content and 'catch' in content
        has_error_handler = 'handleApiError' in content
        
        if not has_try_catch and not has_error_handler:
            self.violations.append(Violation(
                rule='Error Handling',
                message='API routes should include proper error handling (try-catch or handleApiError)',
                severity='warning',
                file_path=self.file_path
            ))
        
        # Check for proper error responses
        if has_try_catch:
            catch_blocks = re.findall(r'catch\s*\([^)]*\)\s*{[^}]*}', content)
            for block in catch_blocks:
                if not any(term in block for term in ['apiError', 'status', 'Response']):
                    self.violations.append(Violation(
                        rule='Error Response',
                        message='Catch blocks should return proper error responses',
                        severity='warning',
                        file_path=self.file_path
                    ))
    
    def validate_authentication(self, content: str, file_path: str):
        """Validate authentication usage"""
        has_with_auth = 'withAuth' in content
        is_public_route = '/public/' in file_path or '/webhook/' in file_path
        
        if not has_with_auth and not is_public_route:
            self.suggestions.append(Violation(
                rule='Authentication',
                message='Consider using withAuth middleware for protected routes',
                severity='warning',
                file_path=file_path
            ))
        
        # Check for role-based access control
        if has_with_auth and not any(term in content for term in ['permissions', 'role']):
            self.suggestions.append(Violation(
                rule='Authorization',
                message='Consider implementing role-based access control',
                severity='info',
                file_path=file_path
            ))
    
    def validate_input_validation(self, content: str):
        """Validate input validation"""
        has_zod = 'z.' in content or 'zod' in content
        has_request_json = 'request.json()' in content
        has_form_data = 'formData()' in content
        
        if (has_request_json or has_form_data) and not has_zod:
            self.suggestions.append(Violation(
                rule='Input Validation',
                message='Consider using Zod schemas for request validation',
                severity='warning',
                file_path=self.file_path
            ))
        
        # Check for SQL injection prevention
        if 'prisma' in content and '$queryRaw' in content:
            if 'Prisma.sql' not in content and '$queryRawUnsafe' not in content:
                self.suggestions.append(Violation(
                    rule='SQL Safety',
                    message='Ensure raw queries are parameterized to prevent SQL injection',
                    severity='warning',
                    file_path=self.file_path
                ))
    
    def validate_multi_tenancy(self, content: str):
        """Validate multi-tenancy patterns"""
        has_prisma_query = 'prisma.' in content
        has_clinic_filter = 'clinic_id' in content or 'clinicId' in content
        
        if has_prisma_query and not has_clinic_filter:
            # Check if it's a query that should be filtered by clinic
            data_models = ['provider', 'patient', 'appointment', 'transaction']
            has_data_model = any(f'prisma.{model}' in content for model in data_models)
            
            if has_data_model:
                self.suggestions.append(Violation(
                    rule='Multi-tenancy',
                    message='Ensure data queries are filtered by clinic_id for multi-tenant isolation',
                    severity='warning',
                    file_path=self.file_path
                ))


def check_file(file_path: str) -> List[Violation]:
    """Check a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        checker = ApiStandardsChecker()
        return checker.validate_file(file_path, content)
    except Exception as e:
        return [Violation(
            rule='File Error',
            message=f'Error reading file: {str(e)}',
            severity='error',
            file_path=file_path
        )]


def check_directory(directory: str) -> List[Violation]:
    """Check all API route files in a directory"""
    all_violations = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file in ['route.ts', 'route.js']:
                file_path = os.path.join(root, file)
                violations = check_file(file_path)
                all_violations.extend(violations)
    
    return all_violations


def hook_mode() -> Dict:
    """Claude Code hook compatibility mode"""
    try:
        input_data = json.loads(sys.stdin.read())
        tool_input = input_data.get('tool_input', {})
        output = input_data.get('output', {})
        
        # Get file path and content
        file_path = tool_input.get('file_path', '')
        content = output.get('content') or tool_input.get('content', '')
        
        # Security check
        if file_path and ('../' in file_path or file_path.startswith('/')):
            return {
                'approve': True,
                'message': 'Potentially unsafe file path detected'
            }
        
        if not content:
            return {'approve': True, 'message': '✅ API standards check passed'}
        
        # Validate
        checker = ApiStandardsChecker()
        violations = checker.validate_file(file_path, content)
        
        if violations:
            message_lines = ['⚠️  API Standards Review:']
            for v in violations:
                message_lines.append(f'  - {v.rule}: {v.message}')
            message_lines.append('')
            message_lines.append('Consider addressing these issues to maintain API consistency.')
            
            return {
                'approve': True,
                'message': '\n'.join(message_lines)
            }
        
        return {'approve': True, 'message': '✅ API standards check passed'}
        
    except Exception as e:
        return {
            'approve': True,
            'message': f'API checker error: {str(e)}'
        }


def format_violations(violations: List[Violation]) -> str:
    """Format violations for display"""
    if not violations:
        return "✅ No API standards violations found!"
    
    lines = ["📋 API Standards Check Results:", ""]
    
    # Group by severity
    errors = [v for v in violations if v.severity == 'error']
    warnings = [v for v in violations if v.severity == 'warning']
    info = [v for v in violations if v.severity == 'info']
    
    for severity, items, emoji in [
        ('ERRORS', errors, '❌'),
        ('WARNINGS', warnings, '⚠️'),
        ('INFO', info, '💡')
    ]:
        if items:
            lines.append(f"{emoji} {severity}:")
            for item in items:
                location = f" ({item.file_path})" if item.file_path else ""
                lines.append(f"  - {item.rule}: {item.message}{location}")
            lines.append("")
    
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description='API Standards Checker')
    parser.add_argument('file_path', nargs='?', help='File to check')
    parser.add_argument('--check-dir', help='Directory to check recursively')
    parser.add_argument('--hook-mode', action='store_true', help='Claude Code hook compatibility mode')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    
    if args.hook_mode:
        result = hook_mode()
        print(json.dumps(result))
        return
    
    violations = []
    
    if args.check_dir:
        violations = check_directory(args.check_dir)
    elif args.file_path:
        violations = check_file(args.file_path)
    else:
        parser.print_help()
        return
    
    if args.json:
        print(json.dumps([asdict(v) for v in violations], indent=2))
    else:
        print(format_violations(violations))
    
    # Exit with error code if violations found
    if any(v.severity == 'error' for v in violations):
        sys.exit(1)


if __name__ == '__main__':
    main()