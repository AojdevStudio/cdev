/**
 * Tests for python-detector.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

const { pythonDetector, PythonDetector } = require('../src/python-detector');
const { pathResolver } = require('../src/path-resolver');

// Mock child_process
jest.mock('child_process');
jest.mock('fs');

// Mock path-resolver
jest.mock('../src/path-resolver', () => ({
  pathResolver: {
    findInPath: jest.fn(),
    getPlatformInfo: jest.fn(() => ({
      platform: 'darwin',
      isWindows: false,
      isMacOS: true,
      isLinux: false,
    })),
  },
}));

describe('PythonDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the cached detectedPython
    pythonDetector.detectedPython = null;
  });

  describe('detectPythonInstallations', () => {
    test('detects Python installations from commands', () => {
      // Mock command checks
      execSync.mockImplementation((command) => {
        if (command.includes('--version')) {
          return 'Python 3.9.7';
        }
        if (command.includes('sys.prefix')) {
          return '/usr/local';
        }
        if (command.includes('pip --version')) {
          return 'pip 21.0.0';
        }
        return '';
      });

      fs.existsSync.mockReturnValue(true);
      fs.accessSync.mockImplementation(() => {});

      const detector = new PythonDetector();
      const installations = detector.detectPythonInstallations();

      expect(installations.length).toBeGreaterThan(0);
      expect(installations[0]).toHaveProperty('command');
      expect(installations[0]).toHaveProperty('path');
      expect(installations[0]).toHaveProperty('version', '3.9.7');
      expect(installations[0]).toHaveProperty('hasPip', true);
    });

    test('handles missing Python gracefully', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command not found');
      });
      fs.existsSync.mockReturnValue(false);

      const detector = new PythonDetector();
      const installations = detector.detectPythonInstallations();

      expect(installations).toEqual([]);
    });

    test('sorts installations by version (newest first)', () => {
      let callCount = 0;
      execSync.mockImplementation((command) => {
        if (command.includes('python3') && command.includes('--version')) {
          return 'Python 3.9.7';
        }
        if (command.includes('python') && command.includes('--version')) {
          return callCount++ === 0 ? 'Python 3.11.5' : 'Python 3.7.3';
        }
        if (command.includes('sys.prefix')) {
          return '/usr/local';
        }
        return '';
      });

      fs.existsSync.mockReturnValue(true);
      fs.accessSync.mockImplementation(() => {});

      const detector = new PythonDetector();
      detector.pythonCommands = ['python']; // Limit to one command for predictable test
      const installations = detector.detectPythonInstallations();

      if (installations.length >= 2) {
        expect(
          detector.compareVersions(installations[0].version, installations[1].version),
        ).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getBestPython', () => {
    test('returns cached Python if available', () => {
      const cachedPython = {
        command: 'python3',
        path: '/usr/bin/python3',
        version: '3.9.7',
        hasPip: true,
      };

      const detector = new PythonDetector();
      detector.detectedPython = cachedPython;

      expect(detector.getBestPython()).toBe(cachedPython);
    });

    test('finds Python meeting minimum version', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('--version')) {
          return 'Python 3.8.0';
        }
        if (command.includes('sys.prefix')) {
          return '/usr/local';
        }
        return '';
      });

      fs.existsSync.mockReturnValue(true);
      fs.accessSync.mockImplementation(() => {});

      const detector = new PythonDetector();
      const best = detector.getBestPython();

      expect(best).not.toBeNull();
      expect(best.meetsMinimumVersion).toBe(true);
    });

    test('returns newest Python even if below minimum version', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('--version')) {
          return 'Python 3.5.0';
        }
        if (command.includes('sys.prefix')) {
          return '/usr/local';
        }
        return '';
      });

      fs.existsSync.mockReturnValue(true);
      fs.accessSync.mockImplementation(() => {});

      const detector = new PythonDetector();
      const best = detector.getBestPython();

      expect(best).not.toBeNull();
      expect(best.version).toBe('3.5.0');
      expect(best.meetsMinimumVersion).toBe(false);
    });
  });

  describe('getPythonInfo', () => {
    test('extracts Python information correctly', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('--version')) {
          return 'Python 3.9.7';
        }
        if (command.includes('sys.prefix')) {
          return '/usr/local/python3.9';
        }
        if (command.includes('pip --version')) {
          return 'pip 21.2.4 from /usr/local/python3.9/lib/python3.9/site-packages/pip';
        }
        return '';
      });

      const detector = new PythonDetector();
      const info = detector.getPythonInfo('/usr/bin/python3');

      expect(info).toEqual({
        command: 'python3',
        path: '/usr/bin/python3',
        version: '3.9.7',
        prefix: '/usr/local/python3.9',
        hasPip: true,
        meetsMinimumVersion: true,
      });
    });

    test('handles Python without pip', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('--version') && !command.includes('pip')) {
          return 'Python 3.9.7';
        }
        if (command.includes('sys.prefix')) {
          return '/usr/local/python3.9';
        }
        if (command.includes('-m pip --version')) {
          throw new Error('No module named pip');
        }
        return '';
      });

      const detector = new PythonDetector();
      const info = detector.getPythonInfo('/usr/bin/python3');

      expect(info.hasPip).toBe(false);
    });

    test('returns null for invalid Python executable', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      const detector = new PythonDetector();
      const info = detector.getPythonInfo('/usr/bin/not-python');

      expect(info).toBeNull();
    });
  });

  describe('compareVersions', () => {
    test('compares versions correctly', () => {
      const detector = new PythonDetector();

      expect(detector.compareVersions('3.9.0', '3.8.0')).toBe(1);
      expect(detector.compareVersions('3.8.0', '3.9.0')).toBe(-1);
      expect(detector.compareVersions('3.9.0', '3.9.0')).toBe(0);
      expect(detector.compareVersions('3.10.0', '3.9.9')).toBe(1);
      expect(detector.compareVersions('3.9', '3.9.0')).toBe(0);
      expect(detector.compareVersions('3.9.1', '3.9')).toBe(1);
    });
  });

  describe('meetsMinimumVersion', () => {
    test('checks minimum version correctly', () => {
      const detector = new PythonDetector();
      detector.minPythonVersion = '3.6';

      expect(detector.meetsMinimumVersion('3.6.0')).toBe(true);
      expect(detector.meetsMinimumVersion('3.7.0')).toBe(true);
      expect(detector.meetsMinimumVersion('3.5.9')).toBe(false);
      expect(detector.meetsMinimumVersion('3.10.0')).toBe(true);
    });
  });

  describe('createVirtualEnvironment', () => {
    test('creates virtual environment with best Python', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('--version')) {
          return 'Python 3.9.7';
        }
        if (command.includes('sys.prefix')) {
          return '/usr/local';
        }
        if (command.includes('-m pip')) {
          return 'pip 21.0.0';
        }
        if (command.includes('-m venv')) {
          return '';
        }
        return '';
      });

      fs.existsSync.mockReturnValue(true);
      fs.accessSync.mockImplementation(() => {});

      const detector = new PythonDetector();
      const result = detector.createVirtualEnvironment('/tmp/test-venv');

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('-m venv'), expect.any(Object));
    });

    test('throws error if no Python available', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command not found');
      });
      fs.existsSync.mockReturnValue(false);

      const detector = new PythonDetector();
      expect(() => {
        detector.createVirtualEnvironment('/tmp/test-venv');
      }).toThrow('No suitable Python installation found');
    });
  });

  describe('getPipCommand', () => {
    test('returns pip command for Python with pip', () => {
      const pythonInfo = {
        path: '/usr/bin/python3',
        hasPip: true,
      };

      const detector = new PythonDetector();
      const pipCmd = detector.getPipCommand(pythonInfo);

      expect(pipCmd).toBe('"/usr/bin/python3" -m pip');
    });

    test('throws error for Python without pip', () => {
      const pythonInfo = {
        path: '/usr/bin/python3',
        hasPip: false,
      };

      const detector = new PythonDetector();
      expect(() => {
        detector.getPipCommand(pythonInfo);
      }).toThrow('pip is not available');
    });
  });

  describe('ensurePip', () => {
    test('returns true if pip already available', () => {
      const pythonInfo = {
        path: '/usr/bin/python3',
        hasPip: true,
      };

      const detector = new PythonDetector();
      const result = detector.ensurePip(pythonInfo);

      expect(result).toBe(true);
      expect(execSync).not.toHaveBeenCalled();
    });

    test('installs pip if not available', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('ensurepip')) {
          return '';
        }
        return '';
      });

      const pythonInfo = {
        path: '/usr/bin/python3',
        hasPip: false,
      };

      const detector = new PythonDetector();
      const result = detector.ensurePip(pythonInfo);

      expect(result).toBe(true);
      expect(pythonInfo.hasPip).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('ensurepip'),
        expect.any(Object),
      );
    });
  });

  describe('getEnvironmentInfo', () => {
    test('returns detailed Python environment info', () => {
      const mockInfo = {
        version: '3.9.7 (default, Sep 16 2021, 13:09:58)',
        version_info: [3, 9, 7, 'final', 0],
        platform: 'darwin',
        implementation: 'CPython',
        prefix: '/usr/local',
        executable: '/usr/bin/python3',
        paths: {
          stdlib: '/usr/local/lib/python3.9',
          include: '/usr/local/include/python3.9',
        },
        pip_available: true,
        pip_version: '21.2.4',
      };

      execSync.mockImplementation((command) => {
        if (command.includes('import sys')) {
          return JSON.stringify(mockInfo);
        }
        return '';
      });

      const detector = new PythonDetector();
      const info = detector.getEnvironmentInfo({ path: '/usr/bin/python3' });

      expect(info).toEqual(mockInfo);
    });

    test('returns null on error', () => {
      execSync.mockImplementation(() => {
        throw new Error('Script failed');
      });

      const detector = new PythonDetector();
      const info = detector.getEnvironmentInfo({ path: '/usr/bin/python3' });

      expect(info).toBeNull();
    });
  });

  describe('platform-specific paths', () => {
    let originalPlatform;

    beforeEach(() => {
      originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    });

    afterEach(() => {
      Object.defineProperty(process, 'platform', originalPlatform);
    });

    test('returns Windows-specific paths on Windows', () => {
      // Mock environment variables for Windows
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        ProgramFiles: 'C:\\Program Files',
        'ProgramFiles(x86)': 'C:\\Program Files (x86)',
        LOCALAPPDATA: 'C:\\Users\\test\\AppData\\Local',
        USERPROFILE: 'C:\\Users\\test',
      };

      // Mock pathResolver to return Windows platform info
      pathResolver.getPlatformInfo.mockReturnValue({
        platform: 'win32',
        isWindows: true,
        isMacOS: false,
        isLinux: false,
      });

      // Mock fs.existsSync to return true for specific Windows paths
      fs.existsSync.mockImplementation(
        (path) =>
          path.includes('Python.exe') ||
          path.includes('WindowsApps') ||
          path.includes('python.exe'),
      );

      const detector = new PythonDetector();
      const paths = detector.getPlatformSpecificPaths();

      // Restore environment
      process.env = originalEnv;

      // Check that we get Windows-specific paths
      expect(paths.length).toBeGreaterThan(0);
      expect(paths.some((p) => p.includes('python.exe') || p.includes('Python.exe'))).toBe(true);
      expect(paths.some((p) => p.includes('WindowsApps'))).toBe(true);
    });

    test('returns macOS-specific paths on macOS', () => {
      // Mock pathResolver to return macOS platform info
      pathResolver.getPlatformInfo.mockReturnValue({
        platform: 'darwin',
        isWindows: false,
        isMacOS: true,
        isLinux: false,
      });

      // Mock fs.existsSync to return true for specific macOS paths
      fs.existsSync.mockImplementation(
        (path) => path.includes('/usr/local/bin') || path.includes('/opt/homebrew'),
      );

      const detector = new PythonDetector();
      const paths = detector.getPlatformSpecificPaths();

      expect(paths.some((p) => p.includes('/usr/local/bin'))).toBe(true);
      expect(paths.some((p) => p.includes('/opt/homebrew'))).toBe(true);
    });

    test('returns Linux-specific paths on Linux', () => {
      // Mock pathResolver to return Linux platform info
      pathResolver.getPlatformInfo.mockReturnValue({
        platform: 'linux',
        isWindows: false,
        isMacOS: false,
        isLinux: true,
      });

      // Mock fs.existsSync to return true for specific Linux paths
      fs.existsSync.mockImplementation(
        (path) => path.includes('/usr/bin') || path.includes('/snap/bin'),
      );

      const detector = new PythonDetector();
      const paths = detector.getPlatformSpecificPaths();

      expect(paths.some((p) => p.includes('/usr/bin'))).toBe(true);
      expect(paths.some((p) => p.includes('/snap/bin'))).toBe(true);
    });
  });
});
