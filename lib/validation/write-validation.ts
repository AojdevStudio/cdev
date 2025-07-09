import { promises as fs } from 'fs';
import path from 'path';
import { constants } from 'fs';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
}

export interface ValidationOptions {
  checkPermissions?: boolean;
  checkPath?: boolean;
  checkDiskSpace?: boolean;
  checkParentDirectory?: boolean;
  requiredPermissions?: FilePermissions;
  maxFileSize?: number;
  allowedExtensions?: string[];
  forbiddenPaths?: string[];
}

export class WriteValidation {
  private readonly defaultOptions: ValidationOptions = {
    checkPermissions: true,
    checkPath: true,
    checkDiskSpace: true,
    checkParentDirectory: true,
    requiredPermissions: {
      readable: true,
      writable: true,
      executable: false
    },
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedExtensions: [],
    forbiddenPaths: ['/etc', '/sys', '/proc', '/dev']
  };

  async validateWrite(filePath: string, options: ValidationOptions = {}): Promise<ValidationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Basic path validation
      if (opts.checkPath) {
        const pathValidation = await this.validatePath(filePath, opts);
        result.errors.push(...pathValidation.errors);
        result.warnings.push(...pathValidation.warnings);
      }

      // Parent directory validation
      if (opts.checkParentDirectory) {
        const parentValidation = await this.validateParentDirectory(filePath, opts);
        result.errors.push(...parentValidation.errors);
        result.warnings.push(...parentValidation.warnings);
      }

      // Permission validation
      if (opts.checkPermissions) {
        const permissionValidation = await this.validatePermissions(filePath, opts);
        result.errors.push(...permissionValidation.errors);
        result.warnings.push(...permissionValidation.warnings);
      }

      // Disk space validation
      if (opts.checkDiskSpace) {
        const diskValidation = await this.validateDiskSpace(filePath, opts);
        result.errors.push(...diskValidation.errors);
        result.warnings.push(...diskValidation.warnings);
      }

      // File size validation (if file exists)
      const sizeValidation = await this.validateFileSize(filePath, opts);
      result.errors.push(...sizeValidation.errors);
      result.warnings.push(...sizeValidation.warnings);

      result.isValid = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
      result.isValid = false;
      return result;
    }
  }

  async validateDelete(filePath: string, options: ValidationOptions = {}): Promise<ValidationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Basic path validation
      if (opts.checkPath) {
        const pathValidation = await this.validatePath(filePath, opts);
        result.errors.push(...pathValidation.errors);
        result.warnings.push(...pathValidation.warnings);
      }

      // Check if file exists
      const exists = await this.fileExists(filePath);
      if (!exists) {
        result.errors.push(`File does not exist: ${filePath}`);
      } else {
        // Check if file is writable (needed for deletion)
        const permissions = await this.getFilePermissions(filePath);
        if (!permissions.writable) {
          result.errors.push(`File is not writable and cannot be deleted: ${filePath}`);
        }
      }

      // Check parent directory permissions
      const parentDir = path.dirname(filePath);
      const parentPermissions = await this.getFilePermissions(parentDir);
      if (!parentPermissions.writable) {
        result.errors.push(`Parent directory is not writable: ${parentDir}`);
      }

      result.isValid = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push(`Delete validation failed: ${error instanceof Error ? error.message : String(error)}`);
      result.isValid = false;
      return result;
    }
  }

  async validateBatchWrite(
    filePaths: string[],
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate each file path
    for (const filePath of filePaths) {
      const validation = await this.validateWrite(filePath, options);
      result.errors.push(...validation.errors.map(error => `${filePath}: ${error}`));
      result.warnings.push(...validation.warnings.map(warning => `${filePath}: ${warning}`));
    }

    // Check for potential conflicts
    const duplicates = this.findDuplicates(filePaths);
    if (duplicates.length > 0) {
      result.errors.push(`Duplicate file paths detected: ${duplicates.join(', ')}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  async validateConcurrentWrite(
    filePath: string,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Basic write validation
      const writeValidation = await this.validateWrite(filePath, options);
      result.errors.push(...writeValidation.errors);
      result.warnings.push(...writeValidation.warnings);

      // Check for file locks (basic implementation)
      const lockFile = `${filePath}.lock`;
      const lockExists = await this.fileExists(lockFile);
      if (lockExists) {
        result.errors.push(`File is locked by another process: ${filePath}`);
      }

      result.isValid = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push(`Concurrent write validation failed: ${error instanceof Error ? error.message : String(error)}`);
      result.isValid = false;
      return result;
    }
  }

  private async validatePath(filePath: string, options: ValidationOptions): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if path is absolute
    if (!path.isAbsolute(filePath)) {
      result.warnings.push(`Path is not absolute: ${filePath}`);
    }

    // Check path length
    if (filePath.length > 260) {
      result.errors.push(`Path is too long (${filePath.length} characters): ${filePath}`);
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(filePath)) {
      result.errors.push(`Path contains invalid characters: ${filePath}`);
    }

    // Check forbidden paths
    if (options.forbiddenPaths) {
      for (const forbiddenPath of options.forbiddenPaths) {
        if (filePath.startsWith(forbiddenPath)) {
          result.errors.push(`Path is in forbidden location: ${filePath}`);
          break;
        }
      }
    }

    // Check file extension
    if (options.allowedExtensions && options.allowedExtensions.length > 0) {
      const ext = path.extname(filePath).toLowerCase();
      if (!options.allowedExtensions.includes(ext)) {
        result.errors.push(`File extension not allowed: ${ext}`);
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private async validateParentDirectory(filePath: string, options: ValidationOptions): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const parentDir = path.dirname(filePath);

    try {
      // Check if parent directory exists
      const parentExists = await this.fileExists(parentDir);
      if (!parentExists) {
        result.warnings.push(`Parent directory does not exist and will be created: ${parentDir}`);
      } else {
        // Check parent directory permissions
        const parentPermissions = await this.getFilePermissions(parentDir);
        if (!parentPermissions.writable) {
          result.errors.push(`Parent directory is not writable: ${parentDir}`);
        }
      }

    } catch (error) {
      result.errors.push(`Parent directory validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private async validatePermissions(filePath: string, options: ValidationOptions): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      const exists = await this.fileExists(filePath);
      if (!exists) {
        // File doesn't exist, check parent directory permissions
        const parentDir = path.dirname(filePath);
        const parentPermissions = await this.getFilePermissions(parentDir);
        if (!parentPermissions.writable) {
          result.errors.push(`Cannot create file in non-writable directory: ${parentDir}`);
        }
      } else {
        // File exists, check its permissions
        const permissions = await this.getFilePermissions(filePath);
        const required = options.requiredPermissions!;

        if (required.readable && !permissions.readable) {
          result.errors.push(`File is not readable: ${filePath}`);
        }
        if (required.writable && !permissions.writable) {
          result.errors.push(`File is not writable: ${filePath}`);
        }
        if (required.executable && !permissions.executable) {
          result.errors.push(`File is not executable: ${filePath}`);
        }
      }

    } catch (error) {
      result.errors.push(`Permission validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private async validateDiskSpace(filePath: string, options: ValidationOptions): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      const stats = await fs.statfs(path.dirname(filePath));
      const availableSpace = stats.bavail * stats.bsize;
      const requiredSpace = options.maxFileSize || 0;

      if (availableSpace < requiredSpace) {
        result.errors.push(`Insufficient disk space. Available: ${availableSpace}, Required: ${requiredSpace}`);
      } else if (availableSpace < requiredSpace * 2) {
        result.warnings.push(`Low disk space detected`);
      }

    } catch (error) {
      result.warnings.push(`Could not check disk space: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private async validateFileSize(filePath: string, options: ValidationOptions): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      const exists = await this.fileExists(filePath);
      if (exists && options.maxFileSize) {
        const stats = await fs.stat(filePath);
        if (stats.size > options.maxFileSize) {
          result.errors.push(`File size exceeds maximum allowed size: ${stats.size} > ${options.maxFileSize}`);
        }
      }

    } catch (error) {
      result.warnings.push(`Could not check file size: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async getFilePermissions(filePath: string): Promise<FilePermissions> {
    try {
      await fs.access(filePath, constants.R_OK);
      const readable = true;
      let writable = false;
      let executable = false;

      try {
        await fs.access(filePath, constants.W_OK);
        writable = true;
      } catch {
        // Not writable
      }

      try {
        await fs.access(filePath, constants.X_OK);
        executable = true;
      } catch {
        // Not executable
      }

      return { readable, writable, executable };
    } catch {
      return { readable: false, writable: false, executable: false };
    }
  }

  private findDuplicates(array: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const item of array) {
      if (seen.has(item)) {
        duplicates.add(item);
      } else {
        seen.add(item);
      }
    }

    return Array.from(duplicates);
  }
}