const os = require('os');

const fs = require('fs-extra');
const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

const { InstallUtils } = require('./install-utils');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('os');

describe('InstallUtils', () => {
  let installUtils;

  beforeEach(() => {
    installUtils = new InstallUtils();

    // Mock os methods
    os.platform.mockReturnValue('darwin');
    os.homedir.mockReturnValue('/home/user');
    os.arch.mockReturnValue('x64');
    os.tmpdir.mockReturnValue('/tmp');

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with system information', () => {
      expect(installUtils.platform).toBe('darwin');
      expect(installUtils.homeDir).toBe('/home/user');
    });
  });

  describe('isDirectoryEmpty', () => {
    it('should return true for empty directory', async () => {
      fs.readdir.mockResolvedValue([]);

      const result = await installUtils.isDirectoryEmpty('/test/dir');

      expect(result).toBe(true);
      expect(fs.readdir).toHaveBeenCalledWith('/test/dir');
    });

    it('should return false for non-empty directory', async () => {
      fs.readdir.mockResolvedValue(['file1.txt', 'file2.txt']);

      const result = await installUtils.isDirectoryEmpty('/test/dir');

      expect(result).toBe(false);
    });

    it('should return true if directory read fails', async () => {
      fs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await installUtils.isDirectoryEmpty('/test/dir');

      expect(result).toBe(true);
    });
  });

  describe('isGitRepository', () => {
    it('should return true for git repository', async () => {
      fs.stat.mockResolvedValue({ isDirectory: () => true });

      const result = await installUtils.isGitRepository('/test/dir');

      expect(result).toBe(true);
      expect(fs.stat).toHaveBeenCalledWith('/test/dir/.git');
    });

    it('should return false for non-git repository', async () => {
      fs.stat.mockRejectedValue(new Error('Not found'));

      const result = await installUtils.isGitRepository('/test/dir');

      expect(result).toBe(false);
    });
  });

  describe('resolveWorkTreePath', () => {
    it('should resolve alongside path', () => {
      const config = {
        projectName: 'test-project',
        workTreeLocation: 'alongside',
      };

      const result = installUtils.resolveWorkTreePath('/test/project', config);

      expect(result).toBe('/test/test-project-worktrees');
    });

    it('should resolve tmp path', () => {
      const config = {
        projectName: 'test-project',
        workTreeLocation: 'tmp',
      };

      const result = installUtils.resolveWorkTreePath('/test/project', config);

      expect(result).toBe('/tmp/parallel-claude-worktrees/test-project');
    });

    it('should resolve custom path', () => {
      const config = {
        projectName: 'test-project',
        workTreeLocation: 'custom',
        customWorkTreePath: '/custom/path',
      };

      const result = installUtils.resolveWorkTreePath('/test/project', config);

      expect(result).toBe('/custom/path');
    });

    it('should default to alongside path', () => {
      const config = {
        projectName: 'test-project',
        workTreeLocation: 'unknown',
      };

      const result = installUtils.resolveWorkTreePath('/test/project', config);

      expect(result).toBe('/test/test-project-worktrees');
    });
  });

  describe('detectProjectType', () => {
    it('should detect Node.js project', async () => {
      fs.pathExists.mockImplementation((filePath) =>
        Promise.resolve(filePath.endsWith('package.json')),
      );

      const result = await installUtils.detectProjectType('/test/dir');

      expect(result).toContain('node');
    });

    it('should detect multiple project types', async () => {
      fs.pathExists.mockImplementation((filePath) =>
        Promise.resolve(filePath.endsWith('package.json') || filePath.endsWith('next.config.js')),
      );

      const result = await installUtils.detectProjectType('/test/dir');

      expect(result).toContain('node');
      expect(result).toContain('nextjs');
    });

    it('should return empty array for unrecognized project', async () => {
      fs.pathExists.mockResolvedValue(false);

      const result = await installUtils.detectProjectType('/test/dir');

      expect(result).toEqual([]);
    });
  });

  describe('readJsonFile', () => {
    it('should read and parse JSON file', async () => {
      const jsonData = { name: 'test', version: '1.0.0' };
      fs.readFile.mockResolvedValue(JSON.stringify(jsonData));

      const result = await installUtils.readJsonFile('/test/file.json');

      expect(result).toEqual(jsonData);
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.json', 'utf8');
    });

    it('should throw error for invalid JSON', async () => {
      fs.readFile.mockResolvedValue('invalid json');

      await expect(installUtils.readJsonFile('/test/file.json')).rejects.toThrow(
        'Failed to read JSON file',
      );
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON file', async () => {
      const jsonData = { name: 'test', version: '1.0.0' };
      fs.writeFile.mockResolvedValue(true);

      await installUtils.writeJsonFile('/test/file.json', jsonData);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/file.json',
        JSON.stringify(jsonData, null, 2),
        'utf8',
      );
    });

    it('should throw error if write fails', async () => {
      fs.writeFile.mockRejectedValue(new Error('Write failed'));

      await expect(installUtils.writeJsonFile('/test/file.json', {})).rejects.toThrow(
        'Failed to write JSON file',
      );
    });
  });

  describe('mergePackageJson', () => {
    it('should merge package.json with existing file', async () => {
      const existingPackageJson = {
        name: 'existing-project',
        scripts: { start: 'node index.js' },
        dependencies: { express: '^4.0.0' },
      };

      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingPackageJson));
      fs.writeFile.mockResolvedValue(true);

      const additions = {
        scripts: { test: 'jest' },
        dependencies: { lodash: '^4.0.0' },
        keywords: ['test', 'parallel'],
      };

      const result = await installUtils.mergePackageJson('/test/dir', additions);

      expect(result.scripts).toEqual({
        start: 'node index.js',
        test: 'jest',
      });
      expect(result.dependencies).toEqual({
        express: '^4.0.0',
        lodash: '^4.0.0',
      });
      expect(result.keywords).toEqual(['test', 'parallel']);
    });

    it('should create new package.json if none exists', async () => {
      fs.pathExists.mockResolvedValue(false);
      fs.writeFile.mockResolvedValue(true);

      const additions = {
        scripts: { test: 'jest' },
        dependencies: { lodash: '^4.0.0' },
      };

      const result = await installUtils.mergePackageJson('/test/dir', additions);

      expect(result.scripts).toEqual({ test: 'jest' });
      expect(result.dependencies).toEqual({ lodash: '^4.0.0' });
    });
  });

  describe('validateLinearApiKey', () => {
    it('should validate correct API key format', async () => {
      const apiKey = `lin_api_${'x'.repeat(50)}`;

      const result = await installUtils.validateLinearApiKey(apiKey);

      expect(result.valid).toBe(true);
    });

    it('should reject empty API key', async () => {
      const result = await installUtils.validateLinearApiKey('');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('API key is required');
    });

    it('should reject invalid format', async () => {
      const result = await installUtils.validateLinearApiKey('invalid_key');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid API key format. Should start with "lin_api_"');
    });

    it('should reject too short API key', async () => {
      const result = await installUtils.validateLinearApiKey('lin_api_short');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('API key appears to be too short');
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', async () => {
      const { promisify } = require('util');
      const mockExec = jest.fn();
      require('child_process').exec = mockExec;
      const execAsync = promisify(mockExec);

      execAsync
        .mockResolvedValueOnce({ stdout: 'git version 2.30.0' })
        .mockResolvedValueOnce({ stdout: 'claude version 1.0.0' });

      const result = await installUtils.getSystemInfo();

      expect(result).toMatchObject({
        platform: 'darwin',
        architecture: 'x64',
        nodeVersion: expect.any(String),
        homeDirectory: '/home/user',
        currentDirectory: expect.any(String),
        tempDirectory: '/tmp',
        gitVersion: 'git version 2.30.0',
        claudeVersion: 'claude version 1.0.0',
      });
    });

    it('should handle missing dependencies gracefully', async () => {
      const { promisify } = require('util');
      const mockExec = jest.fn();
      require('child_process').exec = mockExec;
      const execAsync = promisify(mockExec);

      execAsync
        .mockRejectedValueOnce(new Error('Git not found'))
        .mockRejectedValueOnce(new Error('Claude not found'));

      const result = await installUtils.getSystemInfo();

      expect(result.gitVersion).toBe('Not installed');
      expect(result.claudeVersion).toBe('Not installed');
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize file name with invalid characters', async () => {
      const result = await installUtils.sanitizeFileName('My Project <Test> File:Name');

      expect(result).toBe('my-project-test-file-name');
    });

    it('should handle multiple spaces and hyphens', async () => {
      const result = await installUtils.sanitizeFileName('  Multiple   Spaces  ');

      expect(result).toBe('multiple-spaces');
    });

    it('should return clean name for valid input', async () => {
      const result = await installUtils.sanitizeFileName('clean-file-name');

      expect(result).toBe('clean-file-name');
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await installUtils.retry(operation, 3, 100);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const result = await installUtils.retry(operation, 3, 100);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(installUtils.retry(operation, 2, 100)).rejects.toThrow('Always fails');

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(installUtils.formatBytes(0)).toBe('0 Bytes');
      expect(installUtils.formatBytes(1024)).toBe('1 KB');
      expect(installUtils.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(installUtils.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(installUtils.formatBytes(1536, 1)).toBe('1.5 KB');
      expect(installUtils.formatBytes(1536, 0)).toBe('2 KB');
    });
  });

  describe('createProgressTracker', () => {
    it('should track progress correctly', async () => {
      const tracker = await installUtils.createProgressTracker(5);

      expect(tracker.getProgress()).toEqual({
        current: 0,
        total: 5,
        percentage: 0,
      });

      tracker.increment();
      tracker.increment();

      expect(tracker.getProgress()).toEqual({
        current: 2,
        total: 5,
        percentage: 40,
      });

      expect(tracker.isComplete()).toBe(false);

      tracker.increment();
      tracker.increment();
      tracker.increment();

      expect(tracker.isComplete()).toBe(true);
    });
  });
});
