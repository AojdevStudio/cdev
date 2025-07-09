import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { WriteOperations } from '../../lib/operations/write-operations';
import { FileWriter } from '../../lib/operations/file-writer';
import { WriteValidator } from '../../lib/validation/write-validation';

describe('Write Flow Integration', () => {
  let writeOperations: WriteOperations;
  let fileWriter: FileWriter;
  let validator: WriteValidator;
  let testDir: string;

  beforeEach(async () => {
    writeOperations = new WriteOperations();
    fileWriter = new FileWriter();
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

  describe('Full Write Workflow', () => {
    it('should handle complete write operation with validation', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello, World!';

      // Step 1: Validate before writing
      const validationResult = await validator.validateWriteOperation(filePath, content);
      expect(validationResult.isValid).toBe(true);

      // Step 2: Write file using FileWriter
      const writeResult = await fileWriter.writeTextFile(filePath, content, {
        createBackup: true
      });
      
      expect(writeResult.success).toBe(true);
      expect(writeResult.rollbackAvailable).toBe(false); // No existing file to backup

      // Step 3: Verify file was written
      const writtenContent = await fs.readFile(filePath, 'utf8');
      expect(writtenContent).toBe(content);
    });

    it('should handle JSON file operations', async () => {
      const filePath = join(testDir, 'config.json');
      const data = { name: 'test', version: '1.0.0', enabled: true };

      // Validate JSON structure
      const jsonContent = JSON.stringify(data, null, 2);
      const validationResult = await validator.validateWriteOperation(filePath, jsonContent);
      expect(validationResult.isValid).toBe(true);

      // Write JSON file
      const writeResult = await fileWriter.writeJsonFile(filePath, data);
      expect(writeResult.success).toBe(true);

      // Verify JSON was written correctly
      const writtenContent = await fs.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(writtenContent);
      expect(parsedData).toEqual(data);
    });

    it('should handle template processing', async () => {
      const templatePath = join(testDir, 'template.txt');
      const outputPath = join(testDir, 'output.txt');
      const templateContent = 'Hello {{name}}! Welcome to {{app}}.';
      const variables = { name: 'John', app: 'MyApp' };

      // Create template file
      await fs.writeFile(templatePath, templateContent);

      // Process template
      const result = await fileWriter.writeTemplateFile(templatePath, outputPath, variables);
      expect(result.success).toBe(true);

      // Verify processed content
      const processedContent = await fs.readFile(outputPath, 'utf8');
      expect(processedContent).toBe('Hello John! Welcome to MyApp.');
    });

    it('should handle multiple file operations with rollback', async () => {
      const files = [
        { filePath: join(testDir, 'file1.txt'), content: 'Content 1' },
        { filePath: join(testDir, 'file2.txt'), content: 'Content 2' },
        { filePath: join(testDir, 'file3.txt'), content: 'Content 3' }
      ];

      // Write all files
      const results = await fileWriter.writeMultipleFiles(files, {
        createBackup: true,
        rollbackOnFailure: true
      });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);

      // Verify all files were written
      for (const file of files) {
        const content = await fs.readFile(file.filePath, 'utf8');
        expect(content).toBe(file.content);
      }

      // Test rollback capability
      const firstResult = results[0];
      if (firstResult.rollbackAvailable) {
        const rollbackSuccess = await writeOperations.rollbackTransaction(firstResult.transactionId);
        expect(rollbackSuccess).toBe(true);
      }
    });

    it('should reject unsafe operations', async () => {
      const filePath = join(testDir, 'unsafe.exe');
      const content = 'eval("malicious code");';

      // Validation should fail
      const validationResult = await validator.validateWriteOperation(filePath, content);
      expect(validationResult.isValid).toBe(false);

      // FileWriter should also reject
      const writeResult = await fileWriter.writeTextFile(filePath, content);
      expect(writeResult.success).toBe(false);
      expect(writeResult.error).toContain('not allowed');
    });

    it('should handle concurrent write protection', async () => {
      const filePath = join(testDir, 'concurrent.txt');
      const content = 'Concurrent test';

      // Start multiple writes simultaneously
      const writes = Array.from({ length: 3 }, (_, i) => 
        fileWriter.writeTextFile(filePath, `Content ${i}`, {
          preventConcurrentWrites: true
        })
      );

      const results = await Promise.all(writes);
      
      // Only one should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(1);
      
      const failureCount = results.filter(r => !r.success).length;
      expect(failureCount).toBe(2);
    });

    it('should handle file size limits', async () => {
      const filePath = join(testDir, 'large.txt');
      const content = 'x'.repeat(1000);

      // Should fail validation
      const validationResult = await validator.validateWriteOperation(filePath, content, {
        maxFileSize: 100
      });
      expect(validationResult.isValid).toBe(false);

      // Should also fail in FileWriter
      const writeResult = await fileWriter.writeTextFile(filePath, content, {
        maxFileSize: 100
      });
      expect(writeResult.success).toBe(false);
    });

    it('should handle append operations', async () => {
      const filePath = join(testDir, 'append.txt');
      const initialContent = 'Initial content\n';
      const appendContent = 'Appended content\n';

      // Write initial content
      const initialResult = await fileWriter.writeTextFile(filePath, initialContent);
      expect(initialResult.success).toBe(true);

      // Append content
      const appendResult = await fileWriter.appendToFile(filePath, appendContent);
      expect(appendResult.success).toBe(true);

      // Verify combined content
      const finalContent = await fs.readFile(filePath, 'utf8');
      expect(finalContent).toBe(initialContent + appendContent);
    });

    it('should handle file copying with validation', async () => {
      const sourcePath = join(testDir, 'source.txt');
      const destPath = join(testDir, 'destination.txt');
      const content = 'Content to copy';

      // Create source file
      await fs.writeFile(sourcePath, content);

      // Copy file
      const copyResult = await fileWriter.copyFile(sourcePath, destPath);
      expect(copyResult.success).toBe(true);

      // Verify copied content
      const copiedContent = await fs.readFile(destPath, 'utf8');
      expect(copiedContent).toBe(content);
    });
  });

  describe('Error Handling', () => {
    it('should handle write operation failures gracefully', async () => {
      const filePath = join(testDir, 'nonexistent', 'deep', 'path', 'file.txt');
      const content = 'Test content';

      // This should succeed because directories are created automatically
      const result = await fileWriter.writeTextFile(filePath, content);
      expect(result.success).toBe(true);

      // Verify file was created
      const writtenContent = await fs.readFile(filePath, 'utf8');
      expect(writtenContent).toBe(content);
    });

    it('should handle validation failures', async () => {
      const operations = [
        { filePath: join(testDir, 'good.txt'), content: 'Good content' },
        { filePath: join(testDir, 'bad.exe'), content: 'Bad content' }
      ];

      const results = await validator.validateBatchWriteOperation(operations);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });

    it('should handle transaction cleanup', async () => {
      const filePath = join(testDir, 'transaction.txt');
      const content = 'Transaction test';

      const result = await writeOperations.writeFile(filePath, content, {
        createBackup: true
      });
      expect(result.success).toBe(true);

      // Verify transaction is tracked
      const transaction = writeOperations.getTransactionStatus(result.transactionId);
      expect(transaction).toBeDefined();

      // Clear transactions
      writeOperations.clearCompletedTransactions(0);

      // Verify transaction was cleared
      const clearedTransaction = writeOperations.getTransactionStatus(result.transactionId);
      expect(clearedTransaction).toBeUndefined();
    });
  });
});