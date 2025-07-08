import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { WriteOperationOptions, WriteOperationResult } from '../types/write-types';
import { writeOperations } from './write-operations';

export class FileWriter {
  private static readonly SAFE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.yml', '.yaml'];
  private static readonly MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB default limit

  async writeTextFile(
    filePath: string,
    content: string,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    const safeOptions = {
      ...options,
      maxFileSize: options.maxFileSize || FileWriter.MAX_FILE_SIZE,
      createBackup: options.createBackup !== false, // Default to true
      preventConcurrentWrites: options.preventConcurrentWrites !== false // Default to true
    };

    if (!this.isFileExtensionSafe(filePath)) {
      return {
        success: false,
        transactionId: options.transactionId || 'unknown',
        error: 'File extension not allowed for security reasons',
        rollbackAvailable: false
      };
    }

    return await writeOperations.writeFile(filePath, content, safeOptions);
  }

  async writeJsonFile(
    filePath: string,
    data: unknown,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      return await this.writeTextFile(filePath, jsonContent, options);
    } catch (error) {
      return {
        success: false,
        transactionId: options.transactionId || 'unknown',
        error: error instanceof Error ? error.message : 'JSON serialization failed',
        rollbackAvailable: false
      };
    }
  }

  async writeConfigFile(
    filePath: string,
    config: Record<string, unknown>,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    const ext = extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.json':
        return await this.writeJsonFile(filePath, config, options);
      case '.yml':
      case '.yaml':
        return await this.writeYamlFile(filePath, config, options);
      default:
        return {
          success: false,
          transactionId: options.transactionId || 'unknown',
          error: 'Unsupported config file format',
          rollbackAvailable: false
        };
    }
  }

  async writeTemplateFile(
    templatePath: string,
    outputPath: string,
    variables: Record<string, string>,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    try {
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const processedContent = this.processTemplate(templateContent, variables);
      return await this.writeTextFile(outputPath, processedContent, options);
    } catch (error) {
      return {
        success: false,
        transactionId: options.transactionId || 'unknown',
        error: error instanceof Error ? error.message : 'Template processing failed',
        rollbackAvailable: false
      };
    }
  }

  async appendToFile(
    filePath: string,
    content: string,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    try {
      let existingContent = '';
      try {
        existingContent = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        // File doesn't exist, that's okay
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }

      const newContent = existingContent + content;
      return await this.writeTextFile(filePath, newContent, options);
    } catch (error) {
      return {
        success: false,
        transactionId: options.transactionId || 'unknown',
        error: error instanceof Error ? error.message : 'Append operation failed',
        rollbackAvailable: false
      };
    }
  }

  async copyFile(
    sourcePath: string,
    destinationPath: string,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    try {
      const content = await fs.readFile(sourcePath, 'utf8');
      return await this.writeTextFile(destinationPath, content, options);
    } catch (error) {
      return {
        success: false,
        transactionId: options.transactionId || 'unknown',
        error: error instanceof Error ? error.message : 'File copy failed',
        rollbackAvailable: false
      };
    }
  }

  async writeMultipleFiles(
    files: Array<{
      filePath: string;
      content: string;
      options?: WriteOperationOptions;
    }>,
    globalOptions: WriteOperationOptions = {}
  ): Promise<WriteOperationResult[]> {
    const operations = files.map(file => ({
      filePath: file.filePath,
      content: file.content,
      options: { ...globalOptions, ...file.options }
    }));

    return await writeOperations.writeMultipleFiles(operations);
  }

  private isFileExtensionSafe(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return FileWriter.SAFE_EXTENSIONS.includes(ext);
  }

  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    
    // Replace {{variable}} patterns
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    }

    return processed;
  }

  private async writeYamlFile(
    filePath: string,
    data: Record<string, unknown>,
    options: WriteOperationOptions = {}
  ): Promise<WriteOperationResult> {
    try {
      // Simple YAML serialization for basic objects
      const yamlContent = this.simpleYamlStringify(data);
      return await this.writeTextFile(filePath, yamlContent, options);
    } catch (error) {
      return {
        success: false,
        transactionId: options.transactionId || 'unknown',
        error: error instanceof Error ? error.message : 'YAML serialization failed',
        rollbackAvailable: false
      };
    }
  }

  private simpleYamlStringify(obj: Record<string, unknown>, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'string') {
        yaml += `${spaces}${key}: "${value}"\n`;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        yaml += `${spaces}${key}: ${value}\n`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          yaml += `${spaces}  - ${typeof item === 'string' ? `"${item}"` : item}\n`;
        });
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += this.simpleYamlStringify(value as Record<string, unknown>, indent + 1);
      }
    }

    return yaml;
  }
}

export const fileWriter = new FileWriter();