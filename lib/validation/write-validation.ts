import { promises as fs } from 'fs';
import { dirname, extname, resolve } from 'path';
import { FileValidationResult, WriteOperationOptions } from '../types/write-types';

export class WriteValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /eval\s*\(/,
    /Function\s*\(/,
    /import\s*\(\s*['"`][^'"`]*['"`]\s*\)/,
    /require\s*\(\s*['"`][^'"`]*['"`]\s*\)/,
    /process\.env/,
    /child_process/,
    /fs\.unlink/,
    /fs\.rmdir/,
    /rm\s+-rf/,
    /sudo\s+/,
    /curl\s+.*\|\s*bash/,
    /wget\s+.*\|\s*bash/,
  ];

  private static readonly SAFE_EXTENSIONS = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.yml', '.yaml',
    '.css', '.scss', '.sass', '.less', '.html', '.svg', '.gitignore'
  ];

  private static readonly MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB
  private static readonly MAX_LINE_LENGTH = 1000;

  async validateWriteOperation(
    filePath: string,
    content: string,
    options: WriteOperationOptions = {}
  ): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate file path
    const pathValidation = this.validateFilePath(filePath);
    if (!pathValidation.isValid) {
      errors.push(pathValidation.error || 'Invalid file path');
    }

    // Validate file extension
    const extValidation = this.validateFileExtension(filePath);
    if (!extValidation.isValid) {
      errors.push(extValidation.error || 'Invalid file extension');
    }

    // Validate file size
    const sizeValidation = this.validateFileSize(content, options.maxFileSize);
    if (!sizeValidation.isValid) {
      errors.push(sizeValidation.error || 'File too large');
    }

    // Validate content security
    const securityValidation = this.validateContentSecurity(content);
    if (!securityValidation.isValid) {
      errors.push(securityValidation.error || 'Content contains dangerous patterns');
    }

    // Validate content structure
    const structureValidation = this.validateContentStructure(content, filePath);
    if (!structureValidation.isValid) {
      if (structureValidation.error) {
        warnings.push(structureValidation.error);
      }
    }

    // Validate directory permissions
    const permissionValidation = await this.validateDirectoryPermissions(filePath);
    if (!permissionValidation.isValid) {
      errors.push(permissionValidation.error || 'Directory not writable');
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  async validateBatchWriteOperation(
    operations: Array<{ filePath: string; content: string; options?: WriteOperationOptions }>
  ): Promise<FileValidationResult[]> {
    const results: FileValidationResult[] = [];
    
    for (const operation of operations) {
      const result = await this.validateWriteOperation(
        operation.filePath,
        operation.content,
        operation.options || {}
      );
      results.push(result);
    }

    return results;
  }

  private validateFilePath(filePath: string): FileValidationResult {
    // Check for path traversal attempts
    if (filePath.includes('..')) {
      return { isValid: false, error: 'Path traversal not allowed' };
    }

    // Check for absolute paths outside of project
    const resolvedPath = resolve(filePath);
    const cwd = process.cwd();
    if (!resolvedPath.startsWith(cwd)) {
      return { isValid: false, error: 'Path outside project directory not allowed' };
    }

    // Check for dangerous system paths
    const dangerousPaths = ['/etc', '/usr', '/bin', '/sbin', '/var', '/tmp'];
    if (dangerousPaths.some(path => resolvedPath.startsWith(path))) {
      return { isValid: false, error: 'System path not allowed' };
    }

    return { isValid: true };
  }

  private validateFileExtension(filePath: string): FileValidationResult {
    const ext = extname(filePath).toLowerCase();
    
    if (!WriteValidator.SAFE_EXTENSIONS.includes(ext)) {
      return { isValid: false, error: `File extension ${ext} not allowed` };
    }

    return { isValid: true };
  }

  private validateFileSize(content: string, maxSize?: number): FileValidationResult {
    const size = Buffer.byteLength(content, 'utf8');
    const limit = maxSize || WriteValidator.MAX_FILE_SIZE;

    if (size > limit) {
      return { 
        isValid: false, 
        error: `File size ${size} bytes exceeds limit of ${limit} bytes` 
      };
    }

    return { isValid: true };
  }

  private validateContentSecurity(content: string): FileValidationResult {
    for (const pattern of WriteValidator.DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        return { 
          isValid: false, 
          error: `Content contains potentially dangerous pattern: ${pattern.source}` 
        };
      }
    }

    return { isValid: true };
  }

  private validateContentStructure(content: string, filePath: string): FileValidationResult {
    const warnings: string[] = [];
    const lines = content.split('\n');

    // Check for very long lines
    const longLines = lines.filter(line => line.length > WriteValidator.MAX_LINE_LENGTH);
    if (longLines.length > 0) {
      warnings.push(`${longLines.length} lines exceed ${WriteValidator.MAX_LINE_LENGTH} characters`);
    }

    // Check for mixed line endings
    const hasWindowsLineEndings = content.includes('\r\n');
    const hasUnixLineEndings = content.includes('\n') && !content.includes('\r\n');
    if (hasWindowsLineEndings && hasUnixLineEndings) {
      warnings.push('Mixed line endings detected');
    }

    // Validate JSON structure if it's a JSON file
    if (extname(filePath).toLowerCase() === '.json') {
      try {
        JSON.parse(content);
      } catch (error) {
        return { 
          isValid: false, 
          error: `Invalid JSON structure: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }
    }

    // Validate TypeScript/JavaScript syntax basics
    if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(filePath).toLowerCase())) {
      const syntaxValidation = this.validateJavaScriptSyntax(content);
      if (!syntaxValidation.isValid) {
        warnings.push(syntaxValidation.error || 'Syntax issues detected');
      }
    }

    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  }

  private validateJavaScriptSyntax(content: string): FileValidationResult {
    const warnings: string[] = [];

    // Check for unmatched braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      warnings.push('Unmatched braces detected');
    }

    // Check for unmatched parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      warnings.push('Unmatched parentheses detected');
    }

    // Check for unmatched brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      warnings.push('Unmatched brackets detected');
    }

    // Check for console.log statements (warning only)
    if (content.includes('console.log')) {
      warnings.push('Console.log statements detected');
    }

    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  }

  private async validateDirectoryPermissions(filePath: string): Promise<FileValidationResult> {
    const dir = dirname(filePath);
    
    try {
      await fs.access(dir, fs.constants.F_OK);
    } catch {
      // Directory doesn't exist, check if parent is writable
      try {
        await fs.access(dirname(dir), fs.constants.W_OK);
        return { isValid: true };
      } catch {
        return { isValid: false, error: 'Parent directory not writable' };
      }
    }

    try {
      await fs.access(dir, fs.constants.W_OK);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Directory not writable' };
    }
  }
}

export const writeValidator = new WriteValidator();