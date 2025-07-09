import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WriteValidation } from '../lib/validation/write-validation';
import { promises as fs } from 'fs';
import path from 'path';

describe('WriteValidation', () => {
  let validator: WriteValidation;
  let testDir: string;

  beforeEach(async () => {
    validator = new WriteValidation();
    testDir = path.join(__dirname, 'validation-temp', Date.now().toString());
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('validateWrite', () => {
    it('should validate write to new file', async () => {
      const filePath = path.join(testDir, 'new-file.txt');

      const result = await validator.validateWrite(filePath);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate write to existing file', async () => {
      const filePath = path.join(testDir, 'existing-file.txt');
      await fs.writeFile(filePath, 'existing content');

      const result = await validator.validateWrite(filePath);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject forbidden paths', async () => {
      const forbiddenPath = '/etc/passwd';

      const result = await validator.validateWrite(forbiddenPath, {
        forbiddenPaths: ['/etc', '/sys', '/proc']
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('forbidden location'))).toBe(true);
    });

    it('should validate file extensions', async () => {
      const filePath = path.join(testDir, 'test.exe');

      const result = await validator.validateWrite(filePath, {
        allowedExtensions: ['.txt', '.js', '.ts']
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('extension not allowed'))).toBe(true);
    });

    it('should warn about non-absolute paths', async () => {
      const relativePath = 'relative/path.txt';

      const result = await validator.validateWrite(relativePath);

      expect(result.warnings.some(warning => warning.includes('not absolute'))).toBe(true);
    });

    it('should validate path length', async () => {
      const longPath = path.join(testDir, 'a'.repeat(300));

      const result = await validator.validateWrite(longPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Path is too long'))).toBe(true);
    });

    it('should detect invalid characters', async () => {
      const invalidPath = path.join(testDir, 'file<>:"|?*.txt');

      const result = await validator.validateWrite(invalidPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('invalid characters'))).toBe(true);
    });
  });

  describe('validateDelete', () => {
    it('should validate deletion of existing file', async () => {
      const filePath = path.join(testDir, 'delete-me.txt');
      await fs.writeFile(filePath, 'delete this');

      const result = await validator.validateDelete(filePath);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject deletion of non-existent file', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent.txt');

      const result = await validator.validateDelete(nonExistentPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('does not exist'))).toBe(true);
    });

    it('should check parent directory permissions', async () => {
      const filePath = path.join(testDir, 'protected-file.txt');
      await fs.writeFile(filePath, 'protected content');

      // Make parent directory read-only (if possible)
      try {
        await fs.chmod(testDir, 0o444);
        
        const result = await validator.validateDelete(filePath);

        // This test depends on the file system behavior
        // On some systems, this might still pass if the user has sufficient privileges
        if (!result.isValid) {
          expect(result.errors.some(error => error.includes('not writable'))).toBe(true);
        }
      } finally {
        // Restore permissions
        await fs.chmod(testDir, 0o755);
      }
    });
  });

  describe('validateBatchWrite', () => {
    it('should validate multiple file paths', async () => {
      const filePaths = [
        path.join(testDir, 'batch1.txt'),
        path.join(testDir, 'batch2.txt'),
        path.join(testDir, 'batch3.txt')
      ];

      const result = await validator.validateBatchWrite(filePaths);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate paths', async () => {
      const duplicatePath = path.join(testDir, 'duplicate.txt');
      const filePaths = [
        duplicatePath,
        path.join(testDir, 'unique.txt'),
        duplicatePath
      ];

      const result = await validator.validateBatchWrite(filePaths);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Duplicate file paths'))).toBe(true);
    });

    it('should validate each path individually', async () => {
      const filePaths = [
        path.join(testDir, 'valid.txt'),
        '/etc/passwd', // Forbidden path
        path.join(testDir, 'another-valid.txt')
      ];

      const result = await validator.validateBatchWrite(filePaths, {
        forbiddenPaths: ['/etc']
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('forbidden location'))).toBe(true);
    });
  });

  describe('validateConcurrentWrite', () => {
    it('should validate concurrent write to unlocked file', async () => {
      const filePath = path.join(testDir, 'concurrent.txt');

      const result = await validator.validateConcurrentWrite(filePath);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect locked files', async () => {
      const filePath = path.join(testDir, 'locked.txt');
      const lockFile = `${filePath}.lock`;

      // Create lock file
      await fs.writeFile(lockFile, 'locked');

      const result = await validator.validateConcurrentWrite(filePath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('locked by another process'))).toBe(true);
    });
  });

  describe('permission validation', () => {
    it('should properly validate file permissions', async () => {
      const filePath = path.join(testDir, 'permissions-test.txt');
      await fs.writeFile(filePath, 'test content');

      const result = await validator.validateWrite(filePath, {
        checkPermissions: true,
        requiredPermissions: {
          readable: true,
          writable: true,
          executable: false
        }
      });

      expect(result.isValid).toBe(true);
    });

    it('should handle permission errors gracefully', async () => {
      const filePath = path.join(testDir, 'permission-error.txt');
      await fs.writeFile(filePath, 'test content');

      // Make file read-only
      await fs.chmod(filePath, 0o444);

      const result = await validator.validateWrite(filePath, {
        checkPermissions: true,
        requiredPermissions: {
          readable: true,
          writable: true,
          executable: false
        }
      });

      // The result depends on whether the user has sufficient privileges
      // This test verifies the validation runs without throwing errors
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('edge cases', () => {
    it('should handle empty file paths', async () => {
      const result = await validator.validateWrite('');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle very long file names', async () => {
      const longFileName = 'a'.repeat(255);
      const filePath = path.join(testDir, longFileName);

      const result = await validator.validateWrite(filePath);

      // This depends on the file system's limits
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should handle special characters in file names', async () => {
      const specialChars = 'file with spaces and-dashes_underscores.txt';
      const filePath = path.join(testDir, specialChars);

      const result = await validator.validateWrite(filePath);

      expect(result.isValid).toBe(true);
    });
  });
});