/**
 * Tests for path-resolver.js
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

const { PathResolver, pathResolver } = require('./path-resolver');

// Mock dependencies
jest.mock('os');
jest.mock('fs');

describe('PathResolver', () => {
  let resolver;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv };

    // Default OS mocks
    os.platform.mockReturnValue('linux');
    os.arch.mockReturnValue('x64');
    os.homedir.mockReturnValue('/home/test');
    os.tmpdir.mockReturnValue('/tmp');

    // Default fs mocks
    fs.mkdirSync.mockImplementation();
    fs.accessSync.mockImplementation();

    resolver = new PathResolver();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    test('detects Linux platform', () => {
      expect(resolver.platform).toBe('linux');
      expect(resolver.isLinux).toBe(true);
      expect(resolver.isWindows).toBe(false);
      expect(resolver.isMacOS).toBe(false);
    });

    test('detects Windows platform', () => {
      os.platform.mockReturnValue('win32');
      const winResolver = new PathResolver();

      expect(winResolver.platform).toBe('win32');
      expect(winResolver.isWindows).toBe(true);
      expect(winResolver.isLinux).toBe(false);
      expect(winResolver.isMacOS).toBe(false);
    });

    test('detects macOS platform', () => {
      os.platform.mockReturnValue('darwin');
      const macResolver = new PathResolver();

      expect(macResolver.platform).toBe('darwin');
      expect(macResolver.isMacOS).toBe(true);
      expect(macResolver.isWindows).toBe(false);
      expect(macResolver.isLinux).toBe(false);
    });
  });

  describe('normalizePath', () => {
    test('normalizes paths on Unix', () => {
      expect(resolver.normalizePath('/home/user//folder')).toBe('/home/user/folder');
      expect(resolver.normalizePath('/home/user/./folder')).toBe('/home/user/folder');
      expect(resolver.normalizePath('/home/user/../folder')).toBe('/home/folder');
    });

    test('converts backslashes to forward slashes on Unix', () => {
      expect(resolver.normalizePath('C:\\Users\\Test')).toBe('C:/Users/Test');
    });

    test('converts forward slashes to backslashes on Windows', () => {
      os.platform.mockReturnValue('win32');
      resolver = new PathResolver();

      expect(resolver.normalizePath('C:/Users/Test')).toBe('C:\\Users\\Test');
    });

    test('handles empty input', () => {
      expect(resolver.normalizePath('')).toBe('');
      expect(resolver.normalizePath(null)).toBe('');
      expect(resolver.normalizePath(undefined)).toBe('');
    });
  });

  describe('resolveHome', () => {
    test('resolves tilde paths', () => {
      expect(resolver.resolveHome('~/Documents')).toBe('/home/test/Documents');
      expect(resolver.resolveHome('~')).toBe('/home/test');
    });

    test('handles paths with separator after tilde', () => {
      expect(resolver.resolveHome('~/Documents')).toBe('/home/test/Documents');
      expect(resolver.resolveHome('~\\Documents')).toBe('/home/test/Documents');
    });

    test('returns home directory for empty input', () => {
      expect(resolver.resolveHome('')).toBe('/home/test');
      expect(resolver.resolveHome(null)).toBe('/home/test');
    });

    test('handles paths without tilde', () => {
      expect(resolver.resolveHome('Documents/file.txt')).toBe('/home/test/Documents/file.txt');
    });
  });

  describe('getConfigDir', () => {
    test('returns Linux config directory', () => {
      process.env.XDG_CONFIG_HOME = '/custom/config';

      expect(resolver.getConfigDir('myapp')).toBe('/custom/config/myapp');

      delete process.env.XDG_CONFIG_HOME;
      expect(resolver.getConfigDir('myapp')).toBe('/home/test/.config/myapp');
    });

    test('returns Windows config directory', () => {
      os.platform.mockReturnValue('win32');
      process.env.APPDATA = 'C:\\Users\\Test\\AppData\\Roaming';
      resolver = new PathResolver();

      expect(resolver.getConfigDir('myapp')).toBe('C:\\Users\\Test\\AppData\\Roaming\\myapp');

      delete process.env.APPDATA;
      os.homedir.mockReturnValue('C:\\Users\\Test');
      expect(resolver.getConfigDir('myapp')).toBe('C:\\Users\\Test\\AppData\\Roaming\\myapp');
    });

    test('returns macOS config directory', () => {
      os.platform.mockReturnValue('darwin');
      resolver = new PathResolver();

      expect(resolver.getConfigDir('myapp')).toBe('/home/test/Library/Application Support/myapp');
    });
  });

  describe('getDataDir', () => {
    test('returns Linux data directory', () => {
      process.env.XDG_DATA_HOME = '/custom/data';

      expect(resolver.getDataDir('myapp')).toBe('/custom/data/myapp');

      delete process.env.XDG_DATA_HOME;
      expect(resolver.getDataDir('myapp')).toBe('/home/test/.local/share/myapp');
    });

    test('returns Windows data directory', () => {
      os.platform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = 'C:\\Users\\Test\\AppData\\Local';
      resolver = new PathResolver();

      expect(resolver.getDataDir('myapp')).toBe('C:\\Users\\Test\\AppData\\Local\\myapp');

      delete process.env.LOCALAPPDATA;
      os.homedir.mockReturnValue('C:\\Users\\Test');
      expect(resolver.getDataDir('myapp')).toBe('C:\\Users\\Test\\AppData\\Local\\myapp');
    });

    test('returns macOS data directory (same as config)', () => {
      os.platform.mockReturnValue('darwin');
      resolver = new PathResolver();

      expect(resolver.getDataDir('myapp')).toBe('/home/test/Library/Application Support/myapp');
    });
  });

  describe('getTempDir', () => {
    test('returns app-specific temp directory', () => {
      expect(resolver.getTempDir('myapp')).toBe('/tmp/myapp');

      os.tmpdir.mockReturnValue('C:\\Temp');
      expect(resolver.getTempDir('myapp')).toBe('C:\\Temp\\myapp');
    });
  });

  describe('ensureDir', () => {
    test('creates directory successfully', () => {
      const result = resolver.ensureDir('/test/dir');

      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/dir', { recursive: true });
      expect(result).toBe(true);
    });

    test('returns true if directory exists', () => {
      const error = new Error('Directory exists');
      error.code = 'EEXIST';
      fs.mkdirSync.mockImplementation(() => {
        throw error;
      });

      const result = resolver.ensureDir('/existing/dir');

      expect(result).toBe(true);
    });

    test('throws other errors', () => {
      const error = new Error('Permission denied');
      error.code = 'EACCES';
      fs.mkdirSync.mockImplementation(() => {
        throw error;
      });

      expect(() => resolver.ensureDir('/protected/dir')).toThrow('Permission denied');
    });
  });

  describe('path utility methods', () => {
    test('isAbsolute', () => {
      expect(resolver.isAbsolute('/home/user')).toBe(true);
      expect(resolver.isAbsolute('relative/path')).toBe(false);

      os.platform.mockReturnValue('win32');
      resolver = new PathResolver();
      expect(resolver.isAbsolute('C:\\Users')).toBe(true);
    });

    test('join', () => {
      expect(resolver.join('/home', 'user', 'documents')).toBe('/home/user/documents');
    });

    test('resolve', () => {
      const originalCwd = process.cwd();
      process.cwd = jest.fn().mockReturnValue('/current');

      expect(resolver.resolve('file.txt')).toBe('/current/file.txt');
      expect(resolver.resolve('/absolute', 'file.txt')).toBe('/absolute/file.txt');

      process.cwd = originalCwd;
    });

    test('dirname', () => {
      expect(resolver.dirname('/home/user/file.txt')).toBe('/home/user');
    });

    test('basename', () => {
      expect(resolver.basename('/home/user/file.txt')).toBe('file.txt');
      expect(resolver.basename('/home/user/file.txt', '.txt')).toBe('file');
    });

    test('extname', () => {
      expect(resolver.extname('file.txt')).toBe('.txt');
      expect(resolver.extname('file')).toBe('');
      expect(resolver.extname('file.tar.gz')).toBe('.gz');
    });
  });

  describe('path conversion methods', () => {
    test('toPosixPath converts to forward slashes', () => {
      expect(resolver.toPosixPath('/home/user')).toBe('/home/user');

      os.platform.mockReturnValue('win32');
      resolver = new PathResolver();
      expect(resolver.toPosixPath('C:\\Users\\Test')).toBe('C:/Users/Test');
    });

    test('toPosixPath handles empty input', () => {
      expect(resolver.toPosixPath('')).toBe('');
      expect(resolver.toPosixPath(null)).toBe('');
    });

    test('toNativePath converts to platform separators', () => {
      expect(resolver.toNativePath('C:\\Users\\Test')).toBe('C:/Users/Test');

      os.platform.mockReturnValue('win32');
      resolver = new PathResolver();
      expect(resolver.toNativePath('C:/Users/Test')).toBe('C:\\Users\\Test');
    });

    test('toNativePath handles empty input', () => {
      expect(resolver.toNativePath('')).toBe('');
      expect(resolver.toNativePath(null)).toBe('');
    });
  });

  describe('getEnvPaths', () => {
    test('splits Unix PATH variable', () => {
      process.env.PATH = '/usr/bin:/usr/local/bin:/home/user/bin';

      const paths = resolver.getEnvPaths();

      expect(paths).toEqual(['/usr/bin', '/usr/local/bin', '/home/user/bin']);
    });

    test('splits Windows PATH variable', () => {
      os.platform.mockReturnValue('win32');
      process.env.PATH = 'C:\\Windows\\System32;C:\\Program Files\\Git\\bin';
      resolver = new PathResolver();

      const paths = resolver.getEnvPaths();

      expect(paths).toEqual(['C:\\Windows\\System32', 'C:\\Program Files\\Git\\bin']);
    });

    test('handles Windows Path variable', () => {
      os.platform.mockReturnValue('win32');
      delete process.env.PATH;
      process.env.Path = 'C:\\Windows';
      resolver = new PathResolver();

      const paths = resolver.getEnvPaths();

      expect(paths).toEqual(['C:\\Windows']);
    });

    test('filters empty paths', () => {
      process.env.PATH = '/usr/bin:::/usr/local/bin';

      const paths = resolver.getEnvPaths();

      expect(paths).toEqual(['/usr/bin', '/usr/local/bin']);
    });

    test('returns empty array when PATH is not set', () => {
      delete process.env.PATH;
      delete process.env.Path;

      const paths = resolver.getEnvPaths();

      expect(paths).toEqual([]);
    });
  });

  describe('findInPath', () => {
    test('finds executable on Unix', () => {
      process.env.PATH = '/usr/bin:/usr/local/bin';
      fs.accessSync.mockImplementation((path) => {
        if (path === '/usr/bin/git') {
          return;
        }
        throw new Error('Not found');
      });

      const result = resolver.findInPath('git');

      expect(result).toBe('/usr/bin/git');
    });

    test('finds executable with extensions on Windows', () => {
      os.platform.mockReturnValue('win32');
      process.env.PATH = 'C:\\Windows\\System32;C:\\Program Files\\Git\\bin';
      resolver = new PathResolver();

      fs.accessSync.mockImplementation((path) => {
        if (path === 'C:\\Program Files\\Git\\bin\\git.exe') {
          return;
        }
        throw new Error('Not found');
      });

      const result = resolver.findInPath('git');

      expect(result).toBe('C:\\Program Files\\Git\\bin\\git.exe');
    });

    test('tries multiple extensions on Windows', () => {
      os.platform.mockReturnValue('win32');
      process.env.PATH = 'C:\\Windows\\System32';
      resolver = new PathResolver();

      const accessCalls = [];
      fs.accessSync.mockImplementation((path) => {
        accessCalls.push(path);
        throw new Error('Not found');
      });

      resolver.findInPath('test');

      expect(accessCalls).toContain('C:\\Windows\\System32\\test.exe');
      expect(accessCalls).toContain('C:\\Windows\\System32\\test.cmd');
      expect(accessCalls).toContain('C:\\Windows\\System32\\test.bat');
      expect(accessCalls).toContain('C:\\Windows\\System32\\test');
    });

    test('returns null when not found', () => {
      process.env.PATH = '/usr/bin';
      fs.accessSync.mockImplementation(() => {
        throw new Error('Not found');
      });

      const result = resolver.findInPath('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPlatformInfo', () => {
    test('returns complete platform information', () => {
      const info = resolver.getPlatformInfo();

      expect(info).toEqual({
        platform: 'linux',
        isWindows: false,
        isMacOS: false,
        isLinux: true,
        arch: 'x64',
        homeDir: '/home/test',
        tempDir: '/tmp',
        pathSeparator: path.sep,
        delimiter: path.delimiter,
      });
    });

    test('returns Windows platform info', () => {
      os.platform.mockReturnValue('win32');
      os.homedir.mockReturnValue('C:\\Users\\Test');
      os.tmpdir.mockReturnValue('C:\\Temp');
      resolver = new PathResolver();

      const info = resolver.getPlatformInfo();

      expect(info.isWindows).toBe(true);
      expect(info.homeDir).toBe('C:\\Users\\Test');
      expect(info.pathSeparator).toBe('\\');
      expect(info.delimiter).toBe(';');
    });
  });

  describe('singleton', () => {
    test('exports singleton instance', () => {
      expect(pathResolver).toBeInstanceOf(PathResolver);
    });
  });

  describe('edge cases', () => {
    test('handles paths with multiple separators', () => {
      expect(resolver.normalizePath('///home///user///')).toBe('/home/user/');

      os.platform.mockReturnValue('win32');
      resolver = new PathResolver();
      expect(resolver.normalizePath('C:\\\\Users\\\\\\Test\\\\')).toBe('C:\\Users\\Test\\');
    });

    test('handles mixed separators', () => {
      const mixed = 'C:\\Users/Test\\Documents/file.txt';

      expect(resolver.normalizePath(mixed)).toBe('C:/Users/Test/Documents/file.txt');

      os.platform.mockReturnValue('win32');
      resolver = new PathResolver();
      expect(resolver.normalizePath(mixed)).toBe('C:\\Users\\Test\\Documents\\file.txt');
    });

    test('handles UNC paths on Windows', () => {
      os.platform.mockReturnValue('win32');
      resolver = new PathResolver();

      const uncPath = '\\\\server\\share\\folder';
      expect(resolver.normalizePath(uncPath)).toBe('\\\\server\\share\\folder');
    });

    test('handles relative paths with parent directory references', () => {
      expect(resolver.normalizePath('../../../file.txt')).toBe('../../../file.txt');
    });
  });
});
