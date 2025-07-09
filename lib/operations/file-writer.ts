import { promises as fs } from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

export interface FileWriterOptions {
  encoding?: BufferEncoding;
  mode?: number;
  flag?: string;
  createDirectories?: boolean;
}

export interface StreamWriteOptions extends FileWriterOptions {
  highWaterMark?: number;
  autoClose?: boolean;
}

export class FileWriter {
  private defaultOptions: FileWriterOptions = {
    encoding: 'utf8',
    mode: 0o644,
    flag: 'w',
    createDirectories: true
  };

  async writeFile(
    filePath: string,
    content: string,
    encoding?: BufferEncoding,
    options: FileWriterOptions = {}
  ): Promise<void> {
    const resolvedOptions = { ...this.defaultOptions, ...options };
    
    if (encoding) {
      resolvedOptions.encoding = encoding;
    }

    try {
      // Ensure directory exists if createDirectories is true
      if (resolvedOptions.createDirectories) {
        await this.ensureDirectoryExists(path.dirname(filePath));
      }

      // Write the file
      await fs.writeFile(filePath, content, {
        encoding: resolvedOptions.encoding,
        mode: resolvedOptions.mode,
        flag: resolvedOptions.flag
      });

    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async writeFileBuffer(
    filePath: string,
    buffer: Buffer,
    options: FileWriterOptions = {}
  ): Promise<void> {
    const resolvedOptions = { ...this.defaultOptions, ...options };

    try {
      // Ensure directory exists if createDirectories is true
      if (resolvedOptions.createDirectories) {
        await this.ensureDirectoryExists(path.dirname(filePath));
      }

      // Write the buffer
      await fs.writeFile(filePath, buffer, {
        mode: resolvedOptions.mode,
        flag: resolvedOptions.flag
      });

    } catch (error) {
      throw new Error(`Failed to write buffer to file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async writeStream(
    filePath: string,
    readable: Readable,
    options: StreamWriteOptions = {}
  ): Promise<void> {
    const resolvedOptions = { ...this.defaultOptions, ...options };

    try {
      // Ensure directory exists if createDirectories is true
      if (resolvedOptions.createDirectories) {
        await this.ensureDirectoryExists(path.dirname(filePath));
      }

      // Create write stream
      const writeStream = createWriteStream(filePath, {
        encoding: resolvedOptions.encoding,
        mode: resolvedOptions.mode,
        flags: resolvedOptions.flag,
        highWaterMark: options.highWaterMark,
        autoClose: options.autoClose !== false
      });

      // Pipe readable to write stream
      await pipelineAsync(readable, writeStream);

    } catch (error) {
      throw new Error(`Failed to write stream to file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async appendFile(
    filePath: string,
    content: string,
    encoding?: BufferEncoding,
    options: FileWriterOptions = {}
  ): Promise<void> {
    const resolvedOptions = { ...this.defaultOptions, ...options, flag: 'a' };
    
    if (encoding) {
      resolvedOptions.encoding = encoding;
    }

    try {
      // Ensure directory exists if createDirectories is true
      if (resolvedOptions.createDirectories) {
        await this.ensureDirectoryExists(path.dirname(filePath));
      }

      // Append to the file
      await fs.appendFile(filePath, content, {
        encoding: resolvedOptions.encoding,
        mode: resolvedOptions.mode,
        flag: resolvedOptions.flag
      });

    } catch (error) {
      throw new Error(`Failed to append to file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async writeLines(
    filePath: string,
    lines: string[],
    options: FileWriterOptions = {}
  ): Promise<void> {
    const content = lines.join('\n');
    await this.writeFile(filePath, content, undefined, options);
  }

  async writeJSON(
    filePath: string,
    data: unknown,
    options: FileWriterOptions & { pretty?: boolean } = {}
  ): Promise<void> {
    const { pretty, ...fileOptions } = options;
    
    try {
      const content = pretty 
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);

      await this.writeFile(filePath, content, 'utf8', fileOptions);

    } catch (error) {
      throw new Error(`Failed to write JSON to file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async createSymlink(
    targetPath: string,
    linkPath: string,
    options: FileWriterOptions = {}
  ): Promise<void> {
    const resolvedOptions = { ...this.defaultOptions, ...options };

    try {
      // Ensure directory exists if createDirectories is true
      if (resolvedOptions.createDirectories) {
        await this.ensureDirectoryExists(path.dirname(linkPath));
      }

      // Create symbolic link
      await fs.symlink(targetPath, linkPath);

    } catch (error) {
      throw new Error(`Failed to create symlink ${linkPath} -> ${targetPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async copyFile(
    sourcePath: string,
    destPath: string,
    options: FileWriterOptions = {}
  ): Promise<void> {
    const resolvedOptions = { ...this.defaultOptions, ...options };

    try {
      // Ensure directory exists if createDirectories is true
      if (resolvedOptions.createDirectories) {
        await this.ensureDirectoryExists(path.dirname(destPath));
      }

      // Copy file
      await fs.copyFile(sourcePath, destPath);

      // Set permissions if specified
      if (resolvedOptions.mode) {
        await fs.chmod(destPath, resolvedOptions.mode);
      }

    } catch (error) {
      throw new Error(`Failed to copy file ${sourcePath} -> ${destPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createTempFile(
    prefix: string = 'temp',
    suffix: string = '',
    content?: string,
    options: FileWriterOptions = {}
  ): Promise<string> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const tempFileName = `${prefix}_${timestamp}_${randomId}${suffix}`;
    const tempDir = process.env.TMPDIR || '/tmp';
    const tempPath = path.join(tempDir, tempFileName);

    if (content !== undefined) {
      await this.writeFile(tempPath, content, undefined, options);
    }

    return tempPath;
  }

  async writeWithTemplate(
    filePath: string,
    template: string,
    variables: Record<string, string>,
    options: FileWriterOptions = {}
  ): Promise<void> {
    let content = template;

    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      content = content.replace(regex, value);
    }

    await this.writeFile(filePath, content, undefined, options);
  }

  async writeChunked(
    filePath: string,
    chunks: string[],
    options: FileWriterOptions = {}
  ): Promise<void> {
    const resolvedOptions = { ...this.defaultOptions, ...options };

    try {
      // Ensure directory exists if createDirectories is true
      if (resolvedOptions.createDirectories) {
        await this.ensureDirectoryExists(path.dirname(filePath));
      }

      // Create write stream
      const writeStream = createWriteStream(filePath, {
        encoding: resolvedOptions.encoding,
        mode: resolvedOptions.mode,
        flags: resolvedOptions.flag
      });

      // Write chunks sequentially
      for (const chunk of chunks) {
        await new Promise<void>((resolve, reject) => {
          writeStream.write(chunk, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }

      // Close the stream
      await new Promise<void>((resolve, reject) => {
        writeStream.end((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

    } catch (error) {
      throw new Error(`Failed to write chunked data to file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}