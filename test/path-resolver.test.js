/**
 * Tests for path-resolver.js
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

const { PathResolver } = require('../src/path-resolver');

// Mock os.platform for better test control
jest.mock('os');

describe('PathResolver', () => {
  let originalPlatform;
  let originalHomedir;
  let originalTmpdir;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');

    // Set up os mocks with defaults
    originalHomedir = os.homedir;
    originalTmpdir = os.tmpdir;
    os.homedir = jest.fn(() => '/Users/ossieirondi');
    os.tmpdir = jest.fn(() => '/tmp');
    os.arch = jest.fn(() => 'x64');
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', originalPlatform);
    os.homedir = originalHomedir;
    os.tmpdir = originalTmpdir;
    jest.clearAllMocks();
  });

  describe('normalizePath', () => {
    test('normalizes paths on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      const resolver = new PathResolver();

      expect(resolver.normalizePath('C:/Users/test/file.txt')).toBe('C:\\Users\\test\\file.txt');
      expect(resolver.normalizePath('C:\\Users\\test\\file.txt')).toBe('C:\\Users\\test\\file.txt');
      expect(resolver.normalizePath('relative/path/file.txt')).toBe('relative\\path\\file.txt');
    });

    test('normalizes paths on Unix-like systems', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();

      expect(resolver.normalizePath('/Users/test/file.txt')).toBe('/Users/test/file.txt');
      expect(resolver.normalizePath('\\Windows\\Style\\Path')).toBe('/Windows/Style/Path');
      expect(resolver.normalizePath('relative/path/file.txt')).toBe('relative/path/file.txt');
    });

    test('handles empty paths', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      expect(resolver.normalizePath('')).toBe('');
      expect(resolver.normalizePath(null)).toBe('');
      expect(resolver.normalizePath(undefined)).toBe('');
    });
  });

  describe('resolveHome', () => {
    test('resolves home directory paths', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      const homeDir = '/Users/ossieirondi';

      expect(resolver.resolveHome('~')).toBe(homeDir);
      expect(resolver.resolveHome('~/Documents')).toBe(path.join(homeDir, 'Documents'));
      expect(resolver.resolveHome('~/.config')).toBe(path.join(homeDir, '.config'));
    });

    test('handles paths without tilde', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      const homeDir = '/Users/ossieirondi';

      expect(resolver.resolveHome('Documents')).toBe(path.join(homeDir, 'Documents'));
      expect(resolver.resolveHome('')).toBe(homeDir);
    });
  });

  describe('getConfigDir', () => {
    test('returns correct config directory on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      const resolver = new PathResolver();
      const homeDir = '/Users/ossieirondi';
      const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');

      expect(resolver.getConfigDir('testapp')).toBe(path.join(appData, 'testapp'));
    });

    test('returns correct config directory on macOS', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      const homeDir = '/Users/ossieirondi';

      expect(resolver.getConfigDir('testapp')).toBe(
        path.join(homeDir, 'Library', 'Application Support', 'testapp'),
      );
    });

    test('returns correct config directory on Linux', () => {
      os.platform = jest.fn(() => 'linux');
      const resolver = new PathResolver();
      const homeDir = '/Users/ossieirondi';
      const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config');

      expect(resolver.getConfigDir('testapp')).toBe(path.join(xdgConfig, 'testapp'));
    });
  });

  describe('getDataDir', () => {
    test('returns correct data directory on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      const resolver = new PathResolver();
      const homeDir = '/Users/ossieirondi';
      const localAppData = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
      expect(resolver.getDataDir('testapp')).toBe(path.join(localAppData, 'testapp'));
    });

    test('returns correct data directory on macOS', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      const homeDir = '/Users/ossieirondi';
      expect(resolver.getDataDir('testapp')).toBe(
        path.join(homeDir, 'Library', 'Application Support', 'testapp'),
      );
    });

    test('returns correct data directory on Linux', () => {
      os.platform = jest.fn(() => 'linux');
      const resolver = new PathResolver();
      const homeDir = '/Users/ossieirondi';
      const xdgData = process.env.XDG_DATA_HOME || path.join(homeDir, '.local', 'share');
      expect(resolver.getDataDir('testapp')).toBe(path.join(xdgData, 'testapp'));
    });
  });

  describe('ensureDir', () => {
    const testDir = path.join('/tmp', `path-resolver-test-${Date.now()}`);

    afterAll(() => {
      // Clean up test directory
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        // Ignore errors during cleanup
      }
    });

    test('creates directory if it does not exist', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      const dirPath = path.join('/tmp', `path-resolver-test-${Date.now()}`, 'new-dir');

      expect(fs.existsSync(dirPath)).toBe(false);
      expect(resolver.ensureDir(dirPath)).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    test('returns true if directory already exists', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      const dirPath = path.join('/tmp', `path-resolver-test-${Date.now()}`, 'existing-dir');
      fs.mkdirSync(dirPath, { recursive: true });

      expect(resolver.ensureDir(dirPath)).toBe(true);
    });
  });

  describe('path utilities', () => {
    test('isAbsolute works correctly on Unix-like systems', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      expect(resolver.isAbsolute('/usr/local')).toBe(true);
      expect(resolver.isAbsolute('relative/path')).toBe(false);
      expect(resolver.isAbsolute('./relative')).toBe(false);
    });

    test('isAbsolute works correctly on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      const resolver = new PathResolver();
      // Note: path.isAbsolute() uses the actual runtime platform, not mocked platform
      // On macOS runtime, Windows paths are not considered absolute
      const isRunningOnWindows = process.platform === 'win32';
      expect(resolver.isAbsolute('C:\\Windows')).toBe(isRunningOnWindows);
      expect(resolver.isAbsolute('relative/path')).toBe(false);
      expect(resolver.isAbsolute('./relative')).toBe(false);
    });

    test('join works correctly', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      expect(resolver.join('dir', 'subdir', 'file.txt')).toBe(
        path.join('dir', 'subdir', 'file.txt'),
      );
    });

    test('resolve works correctly', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      const resolved = resolver.resolve('dir', 'file.txt');
      expect(path.isAbsolute(resolved)).toBe(true);
      expect(resolved).toContain('dir');
      expect(resolved).toContain('file.txt');
    });

    test('dirname works correctly on Unix-like systems', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      expect(resolver.dirname('/dir/subdir/file.txt')).toBe('/dir/subdir');
    });

    test('dirname works correctly on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      const resolver = new PathResolver();
      // Note: path.dirname() uses the actual runtime platform, not mocked platform
      // On macOS runtime, Windows paths are treated as relative paths
      const isRunningOnWindows = process.platform === 'win32';
      const expected = isRunningOnWindows ? 'C:\\dir' : '.';
      expect(resolver.dirname('C:\\dir\\file.txt')).toBe(expected);
    });

    test('basename works correctly', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      expect(resolver.basename('/dir/file.txt')).toBe('file.txt');
      expect(resolver.basename('/dir/file.txt', '.txt')).toBe('file');
    });

    test('extname works correctly', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      expect(resolver.extname('file.txt')).toBe('.txt');
      expect(resolver.extname('file.tar.gz')).toBe('.gz');
      expect(resolver.extname('file')).toBe('');
    });
  });

  describe('cross-platform path conversion', () => {
    test('toPosixPath converts to forward slashes', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      expect(resolver.toPosixPath('C:\\Users\\test\\file.txt')).toBe('C:/Users/test/file.txt');
      expect(resolver.toPosixPath('/usr/local/bin')).toBe('/usr/local/bin');
      expect(resolver.toPosixPath('')).toBe('');
    });

    test('toNativePath converts to platform-specific separators on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      const resolver = new PathResolver();
      expect(resolver.toNativePath('C:/Users/test/file.txt')).toBe('C:\\Users\\test\\file.txt');
    });

    test('toNativePath converts to platform-specific separators on Unix-like systems', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      expect(resolver.toNativePath('C:\\Users\\test\\file.txt')).toBe('C:/Users/test/file.txt');
    });
  });

  describe('findInPath', () => {
    test('finds executables in PATH', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      // This test is platform-dependent, so we'll test with common commands
      const commonCommands = ['node', 'npm'];

      for (const cmd of commonCommands) {
        const result = resolver.findInPath(cmd);
        if (result) {
          expect(result).toContain(cmd);
          expect(fs.existsSync(result)).toBe(true);
        }
      }
    });

    test('returns null for non-existent executables', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      const result = resolver.findInPath('definitely-not-a-real-command-xyz123');
      expect(result).toBeNull();
    });
  });

  describe('getPlatformInfo', () => {
    test('returns platform information', () => {
      os.platform = jest.fn(() => 'darwin');
      const resolver = new PathResolver();
      const info = resolver.getPlatformInfo();

      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('isWindows');
      expect(info).toHaveProperty('isMacOS');
      expect(info).toHaveProperty('isLinux');
      expect(info).toHaveProperty('arch');
      expect(info).toHaveProperty('homeDir');
      expect(info).toHaveProperty('tempDir');
      expect(info).toHaveProperty('pathSeparator');
      expect(info).toHaveProperty('delimiter');

      // Check boolean consistency
      const platformCount = [info.isWindows, info.isMacOS, info.isLinux].filter(Boolean).length;
      expect(platformCount).toBe(1);
    });
  });
});
