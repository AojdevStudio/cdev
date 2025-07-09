import { promises as fs } from 'fs';
import path from 'path';
import { FileWriter } from './file-writer';
import { WriteValidation } from '../validation/write-validation';

export interface WriteOperationResult {
  success: boolean;
  path: string;
  operation: 'create' | 'update' | 'delete';
  error?: Error;
  backupPath?: string;
}

export interface WriteOperationOptions {
  createBackup?: boolean;
  overwrite?: boolean;
  validatePermissions?: boolean;
  encoding?: BufferEncoding;
}

export class WriteOperations {
  private fileWriter: FileWriter;
  private validator: WriteValidation;

  constructor() {
    this.fileWriter = new FileWriter();
    this.validator = new WriteValidation();
  }

  async writeFile(
    filePath: string,
    content: string,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    const result: WriteOperationResult = {
      success: false,
      path: filePath,
      operation: 'create'
    };

    try {
      // Validate write operation
      if (options.validatePermissions) {
        const validation = await this.validator.validateWrite(filePath);
        if (!validation.isValid) {
          throw new Error(`Write validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Check if file exists
      const exists = await this.fileExists(filePath);
      if (exists) {
        result.operation = 'update';
        if (!options.overwrite) {
          throw new Error(`File already exists: ${filePath}`);
        }
      }

      // Create backup if requested
      if (options.createBackup && exists) {
        const backupPath = await this.createBackup(filePath);
        result.backupPath = backupPath;
      }

      // Write the file
      await this.fileWriter.writeFile(filePath, content, options.encoding);

      result.success = true;
      return result;

    } catch (error) {
      result.error = error instanceof Error ? error : new Error(String(error));
      return result;
    }
  }

  async writeFileAtomic(
    filePath: string,
    content: string,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    const result: WriteOperationResult = {
      success: false,
      path: filePath,
      operation: 'create'
    };

    const tempPath = `${filePath}.tmp.${Date.now()}`;

    try {
      // Validate write operation
      if (options.validatePermissions) {
        const validation = await this.validator.validateWrite(filePath);
        if (!validation.isValid) {
          throw new Error(`Write validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Check if file exists
      const exists = await this.fileExists(filePath);
      if (exists) {
        result.operation = 'update';
        if (!options.overwrite) {
          throw new Error(`File already exists: ${filePath}`);
        }
      }

      // Create backup if requested
      if (options.createBackup && exists) {
        const backupPath = await this.createBackup(filePath);
        result.backupPath = backupPath;
      }

      // Write to temporary file first
      await this.fileWriter.writeFile(tempPath, content, options.encoding);

      // Atomic move to final location
      await fs.rename(tempPath, filePath);

      result.success = true;
      return result;

    } catch (error) {
      // Clean up temporary file on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }

      result.error = error instanceof Error ? error : new Error(String(error));
      return result;
    }
  }

  async deleteFile(filePath: string, options: WriteOperationOptions = {}): Promise<WriteOperationResult> {
    const result: WriteOperationResult = {
      success: false,
      path: filePath,
      operation: 'delete'
    };

    try {
      // Validate delete operation
      if (options.validatePermissions) {
        const validation = await this.validator.validateDelete(filePath);
        if (!validation.isValid) {
          throw new Error(`Delete validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Check if file exists
      const exists = await this.fileExists(filePath);
      if (!exists) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      // Create backup if requested
      if (options.createBackup) {
        const backupPath = await this.createBackup(filePath);
        result.backupPath = backupPath;
      }

      // Delete the file
      await fs.unlink(filePath);

      result.success = true;
      return result;

    } catch (error) {
      result.error = error instanceof Error ? error : new Error(String(error));
      return result;
    }
  }

  async batchWrite(
    operations: Array<{
      path: string;
      content: string;
      options?: WriteOperationOptions;
    }>
  ): Promise<WriteOperationResult[]> {
    const results: WriteOperationResult[] = [];
    const rollbackOperations: Array<() => Promise<void>> = [];

    try {
      for (const operation of operations) {
        const result = await this.writeFileAtomic(
          operation.path,
          operation.content,
          operation.options
        );

        results.push(result);

        if (!result.success) {
          throw new Error(`Batch write failed at ${operation.path}: ${result.error?.message}`);
        }

        // Prepare rollback operation
        if (result.backupPath) {
          rollbackOperations.push(async () => {
            await fs.copyFile(result.backupPath!, operation.path);
          });
        } else if (result.operation === 'create') {
          rollbackOperations.push(async () => {
            await fs.unlink(operation.path);
          });
        }
      }

      return results;

    } catch (error) {
      // Rollback on error
      await this.rollbackOperations(rollbackOperations);
      throw error;
    }
  }

  async createBackup(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(path.dirname(filePath), '.backups');
    const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.backup`);

    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Copy file to backup location
    await fs.copyFile(filePath, backupPath);

    return backupPath;
  }

  async restoreFromBackup(backupPath: string, originalPath: string): Promise<WriteOperationResult> {
    const result: WriteOperationResult = {
      success: false,
      path: originalPath,
      operation: 'update'
    };

    try {
      // Validate backup file exists
      const exists = await this.fileExists(backupPath);
      if (!exists) {
        throw new Error(`Backup file does not exist: ${backupPath}`);
      }

      // Restore from backup
      await fs.copyFile(backupPath, originalPath);

      result.success = true;
      return result;

    } catch (error) {
      result.error = error instanceof Error ? error : new Error(String(error));
      return result;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async rollbackOperations(rollbackOperations: Array<() => Promise<void>>): Promise<void> {
    for (const rollback of rollbackOperations.reverse()) {
      try {
        await rollback();
      } catch (error) {
        console.error('Rollback operation failed:', error);
      }
    }
  }
}