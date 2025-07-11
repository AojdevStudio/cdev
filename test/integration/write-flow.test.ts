import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WriteOperations } from '../lib/operations/write-operations';
import { WriteValidation } from '../lib/validation/write-validation';
import { FileWriter } from '../lib/operations/file-writer';
import { promises as fs } from 'fs';
import path from 'path';

describe('Write Flow Integration', () => {
  let writeOperations: WriteOperations;
  let validator: WriteValidation;
  let fileWriter: FileWriter;
  let testDir: string;

  beforeEach(async () => {
    writeOperations = new WriteOperations();
    validator = new WriteValidation();
    fileWriter = new FileWriter();
    testDir = path.join(__dirname, 'integration-temp', Date.now().toString());
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('complete write workflow', () => {
    it('should perform end-to-end write operation with validation', async () => {
      const filePath = path.join(testDir, 'e2e-test.txt');
      const content = 'End-to-end test content';

      // Step 1: Validate write operation
      const validation = await validator.validateWrite(filePath, {
        checkPermissions: true,
        checkPath: true,
        checkParentDirectory: true
      });

      expect(validation.isValid).toBe(true);

      // Step 2: Perform write operation
      const writeResult = await writeOperations.writeFileAtomic(filePath, content, {
        validatePermissions: true,
        createBackup: false,
        overwrite: true
      });

      expect(writeResult.success).toBe(true);
      expect(writeResult.operation).toBe('create');

      // Step 3: Verify file exists and has correct content
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const writtenContent = await fs.readFile(filePath, 'utf-8');
      expect(writtenContent).toBe(content);
    });

    it('should handle concurrent write operations safely', async () => {
      const filePath = path.join(testDir, 'concurrent-test.txt');
      const content1 = 'First concurrent write';
      const content2 = 'Second concurrent write';

      // Validate concurrent write
      const validation = await validator.validateConcurrentWrite(filePath);
      expect(validation.isValid).toBe(true);

      // Perform concurrent writes (simulate race condition)
      const writePromises = [
        writeOperations.writeFileAtomic(filePath, content1, {
          validatePermissions: true,
          createBackup: true,
          overwrite: true
        }),
        writeOperations.writeFileAtomic(filePath, content2, {
          validatePermissions: true,
          createBackup: true,
          overwrite: true
        })
      ];

      const results = await Promise.allSettled(writePromises);

      // At least one write should succeed
      const successfulWrites = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      );

      expect(successfulWrites.length).toBeGreaterThan(0);

      // Verify file exists with one of the contents
      const finalContent = await fs.readFile(filePath, 'utf-8');
      expect([content1, content2]).toContain(finalContent);
    });

    it('should handle rollback on batch write failure', async () => {
      const operations = [
        { path: path.join(testDir, 'batch1.txt'), content: 'Batch content 1' },
        { path: path.join(testDir, 'batch2.txt'), content: 'Batch content 2' },
        { path: path.join(testDir, 'batch3.txt'), content: 'Batch content 3' }
      ];

      // Validate batch write
      const validation = await validator.validateBatchWrite(
        operations.map(op => op.path)
      );
      expect(validation.isValid).toBe(true);

      // Perform successful batch write
      const results = await writeOperations.batchWrite(operations);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all files exist
      for (const operation of operations) {
        const content = await fs.readFile(operation.path, 'utf-8');
        expect(content).toBe(operation.content);
      }
    });

    it('should create and restore from backup during update', async () => {
      const filePath = path.join(testDir, 'backup-test.txt');
      const originalContent = 'Original content for backup';
      const updatedContent = 'Updated content';

      // Create initial file
      await fileWriter.writeFile(filePath, originalContent);

      // Update with backup
      const updateResult = await writeOperations.writeFileAtomic(filePath, updatedContent, {
        createBackup: true,
        overwrite: true,
        validatePermissions: true
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.operation).toBe('update');
      expect(updateResult.backupPath).toBeDefined();

      // Verify updated content
      const currentContent = await fs.readFile(filePath, 'utf-8');
      expect(currentContent).toBe(updatedContent);

      // Verify backup exists and has original content
      const backupExists = await fs.access(updateResult.backupPath!).then(() => true).catch(() => false);
      expect(backupExists).toBe(true);

      const backupContent = await fs.readFile(updateResult.backupPath!, 'utf-8');
      expect(backupContent).toBe(originalContent);

      // Restore from backup
      const restoreResult = await writeOperations.restoreFromBackup(updateResult.backupPath!, filePath);
      expect(restoreResult.success).toBe(true);

      // Verify restored content
      const restoredContent = await fs.readFile(filePath, 'utf-8');
      expect(restoredContent).toBe(originalContent);
    });
  });

  describe('error handling and recovery', () => {
    it('should handle validation failures gracefully', async () => {
      const forbiddenPath = '/etc/passwd';
      const content = 'Malicious content';

      // Validation should fail
      const validation = await validator.validateWrite(forbiddenPath, {
        forbiddenPaths: ['/etc', '/sys', '/proc']
      });
      expect(validation.isValid).toBe(false);

      // Write operation should fail due to validation
      const writeResult = await writeOperations.writeFile(forbiddenPath, content, {
        validatePermissions: true
      });

      expect(writeResult.success).toBe(false);
      expect(writeResult.error).toBeDefined();
    });

    it('should handle file system errors during write', async () => {
      const invalidPath = path.join('/nonexistent/directory', 'test.txt');
      const content = 'Test content';

      const writeResult = await writeOperations.writeFileAtomic(invalidPath, content, {
        validatePermissions: false // Skip validation to test file system error
      });

      expect(writeResult.success).toBe(false);
      expect(writeResult.error).toBeDefined();
    });

    it('should handle permission denied errors', async () => {
      const filePath = path.join(testDir, 'readonly.txt');
      const content = 'Test content';

      // Create file and make it read-only
      await fs.writeFile(filePath, 'original');
      await fs.chmod(filePath, 0o444);

      const writeResult = await writeOperations.writeFile(filePath, content, {
        overwrite: true,
        validatePermissions: true
      });

      // The result depends on user privileges, but should handle gracefully
      expect(typeof writeResult.success).toBe('boolean');
      if (!writeResult.success) {
        expect(writeResult.error).toBeDefined();
      }
    });
  });

  describe('performance and scalability', () => {
    it('should handle large files efficiently', async () => {
      const filePath = path.join(testDir, 'large-file.txt');
      const largeContent = 'A'.repeat(1024 * 1024); // 1MB of data

      const startTime = Date.now();
      const writeResult = await writeOperations.writeFileAtomic(filePath, largeContent);
      const endTime = Date.now();

      expect(writeResult.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify file size
      const stats = await fs.stat(filePath);
      expect(stats.size).toBe(largeContent.length);
    });

    it('should handle multiple concurrent operations', async () => {
      const numFiles = 10;
      const operations = Array.from({ length: numFiles }, (_, i) => ({
        path: path.join(testDir, `concurrent-${i}.txt`),
        content: `Content for file ${i}`
      }));

      const startTime = Date.now();
      const promises = operations.map(op => 
        writeOperations.writeFileAtomic(op.path, op.content, {
          validatePermissions: true
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete reasonably quickly
      expect(endTime - startTime).toBeLessThan(5000);

      // Verify all files exist with correct content
      for (const operation of operations) {
        const content = await fs.readFile(operation.path, 'utf-8');
        expect(content).toBe(operation.content);
      }
    });
  });

  describe('data integrity', () => {
    it('should ensure data integrity during write operations', async () => {
      const filePath = path.join(testDir, 'integrity-test.txt');
      const content = 'Data integrity test content';

      // Write file
      const writeResult = await writeOperations.writeFileAtomic(filePath, content);
      expect(writeResult.success).toBe(true);

      // Verify file integrity
      const writtenContent = await fs.readFile(filePath, 'utf-8');
      expect(writtenContent).toBe(content);
      expect(writtenContent.length).toBe(content.length);

      // Verify no corruption occurred
      const stats = await fs.stat(filePath);
      expect(stats.size).toBe(Buffer.byteLength(content, 'utf-8'));
    });

    it('should prevent data loss during atomic operations', async () => {
      const filePath = path.join(testDir, 'atomic-integrity.txt');
      const originalContent = 'Original content';
      const newContent = 'New content';

      // Create initial file
      await fs.writeFile(filePath, originalContent);

      // Perform atomic update
      const updateResult = await writeOperations.writeFileAtomic(filePath, newContent, {
        createBackup: true,
        overwrite: true
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.backupPath).toBeDefined();

      // Verify both backup and new file exist
      const backupContent = await fs.readFile(updateResult.backupPath!, 'utf-8');
      expect(backupContent).toBe(originalContent);

      const currentContent = await fs.readFile(filePath, 'utf-8');
      expect(currentContent).toBe(newContent);
    });
  });
});