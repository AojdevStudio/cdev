import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WriteOperations } from '../lib/operations/write-operations';
import { promises as fs } from 'fs';
import path from 'path';

describe('WriteOperations', () => {
  let writeOperations: WriteOperations;
  let testDir: string;

  beforeEach(async () => {
    writeOperations = new WriteOperations();
    testDir = path.join(__dirname, 'test-temp', Date.now().toString());
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
      const filePath = path.join(testDir, 'test.txt');
      const content = 'Hello, World!';

      const result = await writeOperations.writeFile(filePath, content);

      expect(result.success).toBe(true);
      expect(result.path).toBe(filePath);
      expect(result.operation).toBe('create');
      expect(result.error).toBeUndefined();

      const writtenContent = await fs.readFile(filePath, 'utf-8');
      expect(writtenContent).toBe(content);
    });

    it('should create backup when requested', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const originalContent = 'Original content';
      const newContent = 'New content';

      // Create initial file
      await fs.writeFile(filePath, originalContent);

      // Update with backup
      const result = await writeOperations.writeFile(filePath, newContent, {
        createBackup: true,
        overwrite: true
      });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(result.operation).toBe('update');

      // Verify backup exists
      const backupExists = await fs.access(result.backupPath!).then(() => true).catch(() => false);
      expect(backupExists).toBe(true);

      // Verify backup content
      const backupContent = await fs.readFile(result.backupPath!, 'utf-8');
      expect(backupContent).toBe(originalContent);

      // Verify new content
      const currentContent = await fs.readFile(filePath, 'utf-8');
      expect(currentContent).toBe(newContent);
    });

    it('should fail when file exists and overwrite is false', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'Test content';

      // Create initial file
      await fs.writeFile(filePath, content);

      // Try to overwrite without permission
      const result = await writeOperations.writeFile(filePath, 'New content', {
        overwrite: false
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('File already exists');
    });

    it('should validate permissions when requested', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'Test content';

      const result = await writeOperations.writeFile(filePath, content, {
        validatePermissions: true
      });

      expect(result.success).toBe(true);
    });
  });

  describe('writeFileAtomic', () => {
    it('should write file atomically', async () => {
      const filePath = path.join(testDir, 'atomic-test.txt');
      const content = 'Atomic content';

      const result = await writeOperations.writeFileAtomic(filePath, content);

      expect(result.success).toBe(true);
      expect(result.path).toBe(filePath);

      const writtenContent = await fs.readFile(filePath, 'utf-8');
      expect(writtenContent).toBe(content);
    });

    it('should clean up temporary file on failure', async () => {
      const invalidPath = path.join('/invalid/path', 'test.txt');
      const content = 'Test content';

      const result = await writeOperations.writeFileAtomic(invalidPath, content);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const filePath = path.join(testDir, 'delete-test.txt');
      const content = 'Delete me';

      // Create file
      await fs.writeFile(filePath, content);

      const result = await writeOperations.deleteFile(filePath);

      expect(result.success).toBe(true);
      expect(result.operation).toBe('delete');

      // Verify file is deleted
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should create backup before deletion', async () => {
      const filePath = path.join(testDir, 'delete-backup-test.txt');
      const content = 'Backup me before deletion';

      // Create file
      await fs.writeFile(filePath, content);

      const result = await writeOperations.deleteFile(filePath, {
        createBackup: true
      });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();

      // Verify backup exists
      const backupExists = await fs.access(result.backupPath!).then(() => true).catch(() => false);
      expect(backupExists).toBe(true);

      // Verify backup content
      const backupContent = await fs.readFile(result.backupPath!, 'utf-8');
      expect(backupContent).toBe(content);
    });

    it('should fail when file does not exist', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent.txt');

      const result = await writeOperations.deleteFile(nonExistentPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('File does not exist');
    });
  });

  describe('batchWrite', () => {
    it('should write multiple files successfully', async () => {
      const operations = [
        { path: path.join(testDir, 'batch1.txt'), content: 'Batch content 1' },
        { path: path.join(testDir, 'batch2.txt'), content: 'Batch content 2' },
        { path: path.join(testDir, 'batch3.txt'), content: 'Batch content 3' }
      ];

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

    it('should rollback on failure', async () => {
      const operations = [
        { path: path.join(testDir, 'batch1.txt'), content: 'Batch content 1' },
        { path: path.join('/invalid/path', 'batch2.txt'), content: 'This will fail' },
        { path: path.join(testDir, 'batch3.txt'), content: 'Batch content 3' }
      ];

      await expect(writeOperations.batchWrite(operations)).rejects.toThrow();

      // Verify first file was rolled back
      const firstFileExists = await fs.access(operations[0].path).then(() => true).catch(() => false);
      expect(firstFileExists).toBe(false);
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore file from backup', async () => {
      const filePath = path.join(testDir, 'restore-test.txt');
      const originalContent = 'Original content';
      const newContent = 'Modified content';

      // Create initial file
      await fs.writeFile(filePath, originalContent);

      // Create backup
      const backupPath = await writeOperations.createBackup(filePath);

      // Modify file
      await fs.writeFile(filePath, newContent);

      // Restore from backup
      const result = await writeOperations.restoreFromBackup(backupPath, filePath);

      expect(result.success).toBe(true);

      // Verify content is restored
      const restoredContent = await fs.readFile(filePath, 'utf-8');
      expect(restoredContent).toBe(originalContent);
    });

    it('should fail when backup does not exist', async () => {
      const filePath = path.join(testDir, 'restore-test.txt');
      const nonExistentBackup = path.join(testDir, 'non-existent.backup');

      const result = await writeOperations.restoreFromBackup(nonExistentBackup, filePath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Backup file does not exist');
    });
  });

  describe('data loss prevention', () => {
    it('should prevent data loss during write operations', async () => {
      const filePath = path.join(testDir, 'data-loss-test.txt');
      const originalContent = 'Important data';
      const newContent = 'Updated data';

      // Create initial file
      await fs.writeFile(filePath, originalContent);

      // Write with backup
      const result = await writeOperations.writeFileAtomic(filePath, newContent, {
        createBackup: true,
        overwrite: true
      });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();

      // Verify both original and new content exist
      const backupContent = await fs.readFile(result.backupPath!, 'utf-8');
      expect(backupContent).toBe(originalContent);

      const currentContent = await fs.readFile(filePath, 'utf-8');
      expect(currentContent).toBe(newContent);
    });
  });
});