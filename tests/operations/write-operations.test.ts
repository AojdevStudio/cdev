import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { WriteOperations } from '../../lib/operations/write-operations';
import { WriteOperationOptions } from '../../lib/types/write-types';

describe('WriteOperations', () => {
  let writeOperations: WriteOperations;
  let testDir: string;

  beforeEach(async () => {
    writeOperations = new WriteOperations();
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

  describe('writeFile', () => {
    it('should write file successfully', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello, World!';

      const result = await writeOperations.writeFile(filePath, content);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(filePath);
      expect(result.transactionId).toBeDefined();

      const written = await fs.readFile(filePath, 'utf8');
      expect(written).toBe(content);
    });

    it('should create backup when requested', async () => {
      const filePath = join(testDir, 'test.txt');
      const originalContent = 'Original content';
      const newContent = 'New content';

      // Create original file
      await fs.writeFile(filePath, originalContent);

      const result = await writeOperations.writeFile(filePath, newContent, {
        createBackup: true
      });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(result.rollbackAvailable).toBe(true);

      // Check backup exists
      const backupContent = await fs.readFile(result.backupPath!, 'utf8');
      expect(backupContent).toBe(originalContent);

      // Check new content
      const newFileContent = await fs.readFile(filePath, 'utf8');
      expect(newFileContent).toBe(newContent);
    });

    it('should prevent concurrent writes when configured', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Test content';

      const options: WriteOperationOptions = {
        preventConcurrentWrites: true
      };

      // Start first write
      const firstWrite = writeOperations.writeFile(filePath, content, options);

      // Try second write immediately
      const secondWrite = writeOperations.writeFile(filePath, content, options);

      const [firstResult, secondResult] = await Promise.all([firstWrite, secondWrite]);

      // One should succeed, one should fail
      const successCount = [firstResult, secondResult].filter(r => r.success).length;
      expect(successCount).toBe(1);

      const failureCount = [firstResult, secondResult].filter(r => !r.success).length;
      expect(failureCount).toBe(1);
    });

    it('should respect file size limits', async () => {
      const filePath = join(testDir, 'large-file.txt');
      const content = 'x'.repeat(1000);

      const result = await writeOperations.writeFile(filePath, content, {
        maxFileSize: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('maximum file size');
    });

    it('should handle directory creation', async () => {
      const filePath = join(testDir, 'subdir', 'deep', 'test.txt');
      const content = 'Deep file content';

      const result = await writeOperations.writeFile(filePath, content);

      expect(result.success).toBe(true);
      
      const written = await fs.readFile(filePath, 'utf8');
      expect(written).toBe(content);
    });
  });

  describe('writeMultipleFiles', () => {
    it('should write multiple files successfully', async () => {
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

      const results = await writeOperations.writeMultipleFiles(operations);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      const content1 = await fs.readFile(operations[0].filePath, 'utf8');
      const content2 = await fs.readFile(operations[1].filePath, 'utf8');
      
      expect(content1).toBe('Content 1');
      expect(content2).toBe('Content 2');
    });

    it('should handle partial failures', async () => {
      const operations = [
        {
          filePath: join(testDir, 'file1.txt'),
          content: 'Content 1'
        },
        {
          filePath: join(testDir, 'file2.txt'),
          content: 'x'.repeat(1000),
          options: { maxFileSize: 100 }
        }
      ];

      const results = await writeOperations.writeMultipleFiles(operations);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('rollbackTransaction', () => {
    it('should rollback transaction successfully', async () => {
      const filePath = join(testDir, 'test.txt');
      const originalContent = 'Original';
      const newContent = 'Modified';

      // Create original file
      await fs.writeFile(filePath, originalContent);

      // Write with backup
      const result = await writeOperations.writeFile(filePath, newContent, {
        createBackup: true
      });

      expect(result.success).toBe(true);

      // Verify file was modified
      let content = await fs.readFile(filePath, 'utf8');
      expect(content).toBe(newContent);

      // Rollback
      const rollbackSuccess = await writeOperations.rollbackTransaction(result.transactionId);
      expect(rollbackSuccess).toBe(true);

      // Verify file was restored
      content = await fs.readFile(filePath, 'utf8');
      expect(content).toBe(originalContent);
    });

    it('should return false for non-existent transaction', async () => {
      const rollbackSuccess = await writeOperations.rollbackTransaction('invalid-id');
      expect(rollbackSuccess).toBe(false);
    });
  });

  describe('transaction management', () => {
    it('should track transaction status', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Test content';

      const result = await writeOperations.writeFile(filePath, content, {
        createBackup: true
      });

      const transaction = writeOperations.getTransactionStatus(result.transactionId);
      expect(transaction).toBeDefined();
      expect(transaction!.id).toBe(result.transactionId);
      expect(transaction!.filePath).toBe(filePath);
    });

    it('should clear old transactions', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Test content';

      const result = await writeOperations.writeFile(filePath, content);

      // Verify transaction exists
      let transaction = writeOperations.getTransactionStatus(result.transactionId);
      expect(transaction).toBeDefined();

      // Clear transactions older than 0ms (should clear all)
      writeOperations.clearCompletedTransactions(0);

      // Verify transaction was cleared
      transaction = writeOperations.getTransactionStatus(result.transactionId);
      expect(transaction).toBeUndefined();
    });
  });
});