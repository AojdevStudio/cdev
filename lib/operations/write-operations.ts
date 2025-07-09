import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { WriteOperationResult, WriteOperationOptions, WriteTransaction } from '../types/write-types';

export class WriteOperations {
  private transactions: Map<string, WriteTransaction> = new Map();

  async writeFile(
    filePath: string,
    content: string,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    const transactionId = options.transactionId || this.generateTransactionId();
    
    try {
      // Validate write operation
      const validationResult = await this.validateWriteOperation(filePath, content, options);
      if (!validationResult.isValid) {
        return {
          success: false,
          transactionId,
          error: validationResult.error,
          rollbackAvailable: false
        };
      }

      // Create backup if requested
      let backupPath: string | undefined;
      if (options.createBackup) {
        backupPath = await this.createBackup(filePath);
      }

      // Ensure directory exists
      await fs.mkdir(dirname(filePath), { recursive: true });

      // Store transaction details
      const transaction: WriteTransaction = {
        id: transactionId,
        filePath,
        backupPath,
        timestamp: new Date(),
        options
      };
      this.transactions.set(transactionId, transaction);

      // Write file with atomic operation
      const tempPath = `${filePath}.tmp`;
      await fs.writeFile(tempPath, content, { encoding: 'utf8' });
      await fs.rename(tempPath, filePath);

      return {
        success: true,
        transactionId,
        filePath,
        backupPath,
        rollbackAvailable: !!backupPath
      };

    } catch (error) {
      return {
        success: false,
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        rollbackAvailable: false
      };
    }
  }

  async writeMultipleFiles(
    operations: Array<{ filePath: string; content: string; options?: WriteOperationOptions }>
  ): Promise<WriteOperationResult[]> {
    const results: WriteOperationResult[] = [];
    const transactionId = this.generateTransactionId();

    for (const operation of operations) {
      const result = await this.writeFile(
        operation.filePath,
        operation.content,
        { ...operation.options, transactionId }
      );
      results.push(result);

      // Stop on first failure if rollback is requested
      if (!result.success && operation.options?.rollbackOnFailure) {
        await this.rollbackTransaction(transactionId);
        break;
      }
    }

    return results;
  }

  async rollbackTransaction(transactionId: string): Promise<boolean> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || !transaction.backupPath) {
      return false;
    }

    try {
      await fs.copyFile(transaction.backupPath, transaction.filePath);
      await fs.unlink(transaction.backupPath);
      this.transactions.delete(transactionId);
      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }

  private async validateWriteOperation(
    filePath: string,
    content: string,
    options: WriteOperationOptions
  ): Promise<{ isValid: boolean; error?: string }> {
    // Check file permissions
    try {
      await fs.access(dirname(filePath), fs.constants.W_OK);
    } catch {
      return { isValid: false, error: 'Directory is not writable' };
    }

    // Check file size limits
    if (options.maxFileSize && content.length > options.maxFileSize) {
      return { isValid: false, error: 'Content exceeds maximum file size' };
    }

    // Check for concurrent operations
    if (options.preventConcurrentWrites) {
      const existingTransaction = Array.from(this.transactions.values())
        .find(t => t.filePath === filePath);
      if (existingTransaction) {
        return { isValid: false, error: 'Concurrent write operation detected' };
      }
    }

    return { isValid: true };
  }

  private async createBackup(filePath: string): Promise<string> {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    try {
      await fs.copyFile(filePath, backupPath);
      return backupPath;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, no backup needed
        return '';
      }
      throw error;
    }
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  getTransactionStatus(transactionId: string): WriteTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  clearCompletedTransactions(olderThanMs: number = 3600000): void {
    const cutoffTime = new Date(Date.now() - olderThanMs);
    for (const [id, transaction] of this.transactions) {
      if (transaction.timestamp < cutoffTime) {
        this.transactions.delete(id);
      }
    }
  }
}

export const writeOperations = new WriteOperations();