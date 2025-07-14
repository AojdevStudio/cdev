/**
 * Tests for path-resolver.js
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

const { pathResolver, PathResolver } = require('../src/path-resolver');

describe('PathResolver', () => {
  let originalPlatform;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', originalPlatform);
  });

  describe('normalizePath', () => {
    test('normalizes paths on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const resolver = new PathResolver();

      expect(resolver.normalizePath('C:/Users/test/file.txt')).toBe('C:\\Users\\test\\file.txt');
      expect(resolver.normalizePath('C:\\Users\\test\\file.txt')).toBe('C:\\Users\\test\\file.txt');
      expect(resolver.normalizePath('relative/path/file.txt')).toBe('relative\\path\\file.txt');
    });

    test('normalizes paths on Unix-like systems', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const resolver = new PathResolver();

      expect(resolver.normalizePath('/Users/test/file.txt')).toBe('/Users/test/file.txt');
      expect(resolver.normalizePath('\\Windows\\Style\\Path')).toBe('/Windows/Style/Path');
      expect(resolver.normalizePath('relative/path/file.txt')).toBe('relative/path/file.txt');
    });

    test('handles empty paths', () => {
      expect(pathResolver.normalizePath('')).toBe('');
      expect(pathResolver.normalizePath(null)).toBe('');
      expect(pathResolver.normalizePath(undefined)).toBe('');
    });
  });

  describe('resolveHome', () => {
    test('resolves home directory paths', () => {
      const homeDir = os.homedir();

      expect(pathResolver.resolveHome('~')).toBe(homeDir);
      expect(pathResolver.resolveHome('~/Documents')).toBe(path.join(homeDir, 'Documents'));
      expect(pathResolver.resolveHome('~/.config')).toBe(path.join(homeDir, '.config'));
    });

    test('handles paths without tilde', () => {
      const homeDir = os.homedir();

      expect(pathResolver.resolveHome('Documents')).toBe(path.join(homeDir, 'Documents'));
      expect(pathResolver.resolveHome('')).toBe(homeDir);
    });
  });

  describe('getConfigDir', () => {
    test('returns correct config directory on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const resolver = new PathResolver();
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');

      expect(resolver.getConfigDir('testapp')).toBe(path.join(appData, 'testapp'));
    });

    test('returns correct config directory on macOS', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const resolver = new PathResolver();

      expect(resolver.getConfigDir('testapp')).toBe(
        path.join(os.homedir(), 'Library', 'Application Support', 'testapp'),
      );
    });

    test('returns correct config directory on Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const resolver = new PathResolver();
      const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');

      expect(resolver.getConfigDir('testapp')).toBe(path.join(xdgConfig, 'testapp'));
    });
  });

  describe('getDataDir', () => {
    test('returns correct data directory on different platforms', () => {
      // Windows
      Object.defineProperty(process, 'platform', { value: 'win32' });
      let resolver = new PathResolver();
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
      expect(resolver.getDataDir('testapp')).toBe(path.join(localAppData, 'testapp'));

      // macOS
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      resolver = new PathResolver();
      expect(resolver.getDataDir('testapp')).toBe(
        path.join(os.homedir(), 'Library', 'Application Support', 'testapp'),
      );

      // Linux
      Object.defineProperty(process, 'platform', { value: 'linux' });
      resolver = new PathResolver();
      const xdgData = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
      expect(resolver.getDataDir('testapp')).toBe(path.join(xdgData, 'testapp'));
    });
  });

  describe('ensureDir', () => {
    const testDir = path.join(os.tmpdir(), `path-resolver-test-${Date.now()}`);

    afterAll(() => {
      // Clean up test directory
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {}
    });

    test('creates directory if it does not exist', () => {
      const dirPath = path.join(testDir, 'new-dir');

      expect(fs.existsSync(dirPath)).toBe(false);
      expect(pathResolver.ensureDir(dirPath)).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    test('returns true if directory already exists', () => {
      const dirPath = path.join(testDir, 'existing-dir');
      fs.mkdirSync(dirPath, { recursive: true });

      expect(pathResolver.ensureDir(dirPath)).toBe(true);
    });
  });

  describe('path utilities', () => {
    test('isAbsolute works correctly', () => {
      expect(pathResolver.isAbsolute('/usr/local')).toBe(true);
      expect(pathResolver.isAbsolute('C:\\Windows')).toBe(true);
      expect(pathResolver.isAbsolute('relative/path')).toBe(false);
      expect(pathResolver.isAbsolute('./relative')).toBe(false);
    });

    test('join works correctly', () => {
      expect(pathResolver.join('dir', 'subdir', 'file.txt')).toBe(
        path.join('dir', 'subdir', 'file.txt'),
      );
    });

    test('resolve works correctly', () => {
      const resolved = pathResolver.resolve('dir', 'file.txt');
      expect(path.isAbsolute(resolved)).toBe(true);
      expect(resolved).toContain('dir');
      expect(resolved).toContain('file.txt');
    });

    test('dirname works correctly', () => {
      expect(pathResolver.dirname('/dir/subdir/file.txt')).toBe('/dir/subdir');
      expect(pathResolver.dirname('C:\\dir\\file.txt')).toBe('C:\\dir');
    });

    test('basename works correctly', () => {
      expect(pathResolver.basename('/dir/file.txt')).toBe('file.txt');
      expect(pathResolver.basename('/dir/file.txt', '.txt')).toBe('file');
    });

    test('extname works correctly', () => {
      expect(pathResolver.extname('file.txt')).toBe('.txt');
      expect(pathResolver.extname('file.tar.gz')).toBe('.gz');
      expect(pathResolver.extname('file')).toBe('');
    });
  });

  describe('cross-platform path conversion', () => {
    test('toPosixPath converts to forward slashes', () => {
      expect(pathResolver.toPosixPath('C:\\Users\\test\\file.txt')).toBe('C:/Users/test/file.txt');
      expect(pathResolver.toPosixPath('/usr/local/bin')).toBe('/usr/local/bin');
      expect(pathResolver.toPosixPath('')).toBe('');
    });

    test('toNativePath converts to platform-specific separators', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      let resolver = new PathResolver();
      expect(resolver.toNativePath('C:/Users/test/file.txt')).toBe('C:\\Users\\test\\file.txt');

      Object.defineProperty(process, 'platform', { value: 'darwin' });
      resolver = new PathResolver();
      expect(resolver.toNativePath('C:\\Users\\test\\file.txt')).toBe('C:/Users/test/file.txt');
    });
  });

  describe('findInPath', () => {
    test('finds executables in PATH', () => {
      // This test is platform-dependent, so we'll test with common commands
      const commonCommands = ['node', 'npm'];

      for (const cmd of commonCommands) {
        const result = pathResolver.findInPath(cmd);
        if (result) {
          expect(result).toContain(cmd);
          expect(fs.existsSync(result)).toBe(true);
        }
      }
    });

    test('returns null for non-existent executables', () => {
      const result = pathResolver.findInPath('definitely-not-a-real-command-xyz123');
      expect(result).toBeNull();
    });
  });

  describe('getPlatformInfo', () => {
    test('returns platform information', () => {
      const info = pathResolver.getPlatformInfo();

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
