/**
 * Tests for python-detector.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { pathResolver } = require('./path-resolver');
const { PythonDetector, pythonDetector } = require('./python-detector');

// Mock dependencies
jest.mock('./path-resolver');
jest.mock('child_process');
jest.mock('fs');

describe('PythonDetector', () => {
  let detector;
  const mockPythonPath = '/usr/bin/python3';
  const mockPythonVersion = 'Python 3.9.5';
  const mockSysPrefix = '/usr';

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset singleton state
    pythonDetector.detectedPython = null;

    // Default mocks
    pathResolver.findInPath.mockReturnValue(mockPythonPath);
    pathResolver.getPlatformInfo.mockReturnValue({
      isWindows: false,
      isMacOS: false,
      isLinux: true,
    });

    execSync.mockImplementation((cmd) => {
      if (cmd.includes('--version')) {
        return mockPythonVersion;
      }
      if (cmd.includes('sys.prefix')) {
        return mockSysPrefix;
      }
      if (cmd.includes('-m pip')) {
        return 'pip 21.0.0';
      }
      return '';
    });

    fs.existsSync.mockReturnValue(true);
    fs.accessSync.mockImplementation();

    detector = new PythonDetector();
  });

  describe('constructor', () => {
    test('initializes with default values', () => {
      expect(detector.minPythonVersion).toBe('3.6');
      expect(detector.pythonCommands).toEqual(['python3', 'python', 'py']);
      expect(detector.detectedPython).toBeNull();
    });
  });

  describe('detectPythonInstallations', () => {
    test('detects Python from common commands', () => {
      const installations = detector.detectPythonInstallations();

      expect(pathResolver.findInPath).toHaveBeenCalledWith('python3');
      expect(pathResolver.findInPath).toHaveBeenCalledWith('python');
      expect(pathResolver.findInPath).toHaveBeenCalledWith('py');

      expect(installations).toHaveLength(1);
      expect(installations[0]).toMatchObject({
        path: mockPythonPath,
        version: '3.9.5',
        hasPip: true,
      });
    });

    test('avoids duplicates', () => {
      pathResolver.findInPath.mockReturnValue(mockPythonPath);
      fs.existsSync.mockImplementation((path) => path === mockPythonPath);

      const installations = detector.detectPythonInstallations();

      expect(installations).toHaveLength(1);
    });

    test('checks platform-specific paths', () => {
      pathResolver.findInPath.mockReturnValue(null);
      fs.existsSync.mockImplementation((path) => path === '/usr/bin/python3.9');

      execSync.mockImplementation((cmd) => {
        if (cmd.includes('/usr/bin/python3.9') && cmd.includes('--version')) {
          return 'Python 3.9.0';
        }
        if (cmd.includes('sys.prefix')) {
          return '/usr';
        }
        return '';
      });

      const installations = detector.detectPythonInstallations();

      expect(installations).toHaveLength(1);
      expect(installations[0].path).toBe('/usr/bin/python3.9');
    });

    test('sorts installations by version (newest first)', () => {
      let callCount = 0;
      pathResolver.findInPath.mockImplementation((cmd) => {
        callCount++;
        if (callCount === 1) {
          return '/usr/bin/python3.8';
        }
        if (callCount === 2) {
          return '/usr/bin/python3.10';
        }
        if (callCount === 3) {
          return '/usr/bin/python3.9';
        }
        return null;
      });

      execSync.mockImplementation((cmd) => {
        if (cmd.includes('python3.8') && cmd.includes('--version')) {
          return 'Python 3.8.0';
        }
        if (cmd.includes('python3.10') && cmd.includes('--version')) {
          return 'Python 3.10.0';
        }
        if (cmd.includes('python3.9') && cmd.includes('--version')) {
          return 'Python 3.9.0';
        }
        if (cmd.includes('sys.prefix')) {
          return '/usr';
        }
        return '';
      });

      const installations = detector.detectPythonInstallations();

      expect(installations[0].version).toBe('3.10.0');
      expect(installations[1].version).toBe('3.9.0');
      expect(installations[2].version).toBe('3.8.0');
    });
  });

  describe('getBestPython', () => {
    test('returns cached result if available', () => {
      const cached = { path: '/cached/python', version: '3.9.0' };
      detector.detectedPython = cached;

      const result = detector.getBestPython();

      expect(result).toBe(cached);
      expect(execSync).not.toHaveBeenCalled();
    });

    test('returns first installation meeting minimum version', () => {
      pathResolver.findInPath.mockImplementation((cmd) => {
        if (cmd === 'python3') {
          return '/usr/bin/python3';
        }
        if (cmd === 'python') {
          return '/usr/bin/python';
        }
        return null;
      });

      execSync.mockImplementation((cmd) => {
        if (cmd.includes('python3') && cmd.includes('--version')) {
          return 'Python 3.5.0'; // Below minimum
        }
        if (cmd.includes('/usr/bin/python') && cmd.includes('--version')) {
          return 'Python 3.7.0'; // Meets minimum
        }
        if (cmd.includes('sys.prefix')) {
          return '/usr';
        }
        return '';
      });

      const result = detector.getBestPython();

      expect(result.version).toBe('3.7.0');
      expect(result.meetsMinimumVersion).toBe(true);
    });

    test('returns newest version if none meet minimum', () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('--version')) {
          return 'Python 3.5.0'; // Below minimum
        }
        if (cmd.includes('sys.prefix')) {
          return '/usr';
        }
        return '';
      });

      const result = detector.getBestPython();

      expect(result.version).toBe('3.5.0');
      expect(result.meetsMinimumVersion).toBe(false);
    });

    test('returns null if no Python found', () => {
      pathResolver.findInPath.mockReturnValue(null);
      fs.existsSync.mockReturnValue(false);

      const result = detector.getBestPython();

      expect(result).toBeNull();
    });
  });

  describe('checkPythonCommand', () => {
    test('returns Python info for valid command', () => {
      const result = detector.checkPythonCommand('python3');

      expect(pathResolver.findInPath).toHaveBeenCalledWith('python3');
      expect(result).toMatchObject({
        path: mockPythonPath,
        version: '3.9.5',
      });
    });

    test('returns null for invalid command', () => {
      pathResolver.findInPath.mockReturnValue(null);

      const result = detector.checkPythonCommand('python4');

      expect(result).toBeNull();
    });

    test('handles errors gracefully', () => {
      pathResolver.findInPath.mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = detector.checkPythonCommand('python3');

      expect(result).toBeNull();
    });
  });

  describe('getPythonInfo', () => {
    test('extracts Python information', () => {
      const result = detector.getPythonInfo(mockPythonPath);

      expect(result).toEqual({
        command: 'python3',
        path: mockPythonPath,
        version: '3.9.5',
        prefix: mockSysPrefix,
        hasPip: true,
        meetsMinimumVersion: true,
      });
    });

    test('detects missing pip', () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('--version')) {
          return mockPythonVersion;
        }
        if (cmd.includes('sys.prefix')) {
          return mockSysPrefix;
        }
        if (cmd.includes('-m pip')) {
          throw new Error('No module named pip');
        }
        return '';
      });

      const result = detector.getPythonInfo(mockPythonPath);

      expect(result.hasPip).toBe(false);
    });

    test('handles Windows executable paths', () => {
      const windowsPath = 'C:\\Python39\\python.exe';
      const result = detector.getPythonInfo(windowsPath);

      expect(result.command).toBe('python');
    });

    test('returns null for invalid Python', () => {
      execSync.mockImplementation(() => {
        throw new Error('Invalid command');
      });

      const result = detector.getPythonInfo('/invalid/python');

      expect(result).toBeNull();
    });

    test('handles version extraction failure', () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('--version')) {
          return 'Invalid output';
        }
        return '';
      });

      const result = detector.getPythonInfo(mockPythonPath);

      expect(result).toBeNull();
    });
  });

  describe('isPythonExecutable', () => {
    test('validates Python executable', () => {
      const result = detector.isPythonExecutable(mockPythonPath);

      expect(fs.accessSync).toHaveBeenCalledWith(mockPythonPath, fs.constants.X_OK);
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--version'),
        expect.any(Object),
      );
      expect(result).toBe(true);
    });

    test('returns false for non-executable', () => {
      fs.accessSync.mockImplementation(() => {
        throw new Error('Not executable');
      });

      const result = detector.isPythonExecutable('/not/executable');

      expect(result).toBe(false);
    });

    test('returns false for non-Python executable', () => {
      execSync.mockReturnValue('node v16.0.0');

      const result = detector.isPythonExecutable('/usr/bin/node');

      expect(result).toBe(false);
    });
  });

  describe('getPlatformSpecificPaths', () => {
    test('returns Windows paths on Windows', () => {
      pathResolver.getPlatformInfo.mockReturnValue({
        isWindows: true,
        isMacOS: false,
        isLinux: false,
      });

      process.env.ProgramFiles = 'C:\\Program Files';
      process.env['ProgramFiles(x86)'] = 'C:\\Program Files (x86)';
      process.env.LOCALAPPDATA = 'C:\\Users\\Test\\AppData\\Local';
      process.env.USERPROFILE = 'C:\\Users\\Test';

      fs.existsSync.mockImplementation((path) => path.includes('Python39'));

      const paths = detector.getPlatformSpecificPaths();

      expect(paths.some((p) => p.includes('Python39'))).toBe(true);
      expect(paths.some((p) => p.includes('WindowsApps'))).toBe(false);
    });

    test('returns macOS paths on macOS', () => {
      pathResolver.getPlatformInfo.mockReturnValue({
        isWindows: false,
        isMacOS: true,
        isLinux: false,
      });

      process.env.HOME = '/Users/test';

      fs.existsSync.mockImplementation(
        (path) => path === '/usr/local/bin/python3' || path === '/opt/homebrew/bin/python3',
      );

      const paths = detector.getPlatformSpecificPaths();

      expect(paths).toContain('/usr/local/bin/python3');
      expect(paths).toContain('/opt/homebrew/bin/python3');
    });

    test('returns Linux paths on Linux', () => {
      pathResolver.getPlatformInfo.mockReturnValue({
        isWindows: false,
        isMacOS: false,
        isLinux: true,
      });

      process.env.HOME = '/home/test';

      fs.existsSync.mockImplementation(
        (path) => path === '/usr/bin/python3' || path === '/usr/bin/python3.9',
      );

      const paths = detector.getPlatformSpecificPaths();

      expect(paths).toContain('/usr/bin/python3');
      expect(paths).toContain('/usr/bin/python3.9');
    });

    test('filters out non-existent paths', () => {
      fs.existsSync.mockReturnValue(false);

      const paths = detector.getPlatformSpecificPaths();

      expect(paths).toHaveLength(0);
    });
  });

  describe('compareVersions', () => {
    test('compares versions correctly', () => {
      expect(detector.compareVersions('3.9.0', '3.10.0')).toBe(-1);
      expect(detector.compareVersions('3.10.0', '3.9.0')).toBe(1);
      expect(detector.compareVersions('3.9.0', '3.9.0')).toBe(0);

      expect(detector.compareVersions('3.9', '3.9.0')).toBe(0);
      expect(detector.compareVersions('3.9.1', '3.9')).toBe(1);

      expect(detector.compareVersions('3.10.2', '3.10.10')).toBe(-1);
    });
  });

  describe('meetsMinimumVersion', () => {
    test('checks against minimum version', () => {
      expect(detector.meetsMinimumVersion('3.6.0')).toBe(true);
      expect(detector.meetsMinimumVersion('3.7.0')).toBe(true);
      expect(detector.meetsMinimumVersion('3.5.0')).toBe(false);
      expect(detector.meetsMinimumVersion('2.7.0')).toBe(false);
    });
  });

  describe('createVirtualEnvironment', () => {
    test('creates virtual environment with best Python', () => {
      const venvPath = '/test/venv';

      detector.createVirtualEnvironment(venvPath);

      expect(execSync).toHaveBeenCalledWith(
        `"${mockPythonPath}" -m venv "${venvPath}"`,
        expect.any(Object),
      );
    });

    test('uses specified Python installation', () => {
      const customPython = {
        path: '/custom/python',
        version: '3.10.0',
      };

      detector.createVirtualEnvironment('/test/venv', customPython);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('/custom/python'),
        expect.any(Object),
      );
    });

    test('throws error if no Python available', () => {
      pathResolver.findInPath.mockReturnValue(null);
      fs.existsSync.mockReturnValue(false);

      expect(() => {
        detector.createVirtualEnvironment('/test/venv');
      }).toThrow('No suitable Python installation found');
    });

    test('throws error on venv creation failure', () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('-m venv')) {
          throw new Error('venv failed');
        }
        return mockPythonVersion;
      });

      expect(() => {
        detector.createVirtualEnvironment('/test/venv');
      }).toThrow('Failed to create virtual environment: venv failed');
    });
  });

  describe('getPipCommand', () => {
    test('returns pip command for Python with pip', () => {
      const pythonInfo = {
        path: mockPythonPath,
        hasPip: true,
      };

      const result = detector.getPipCommand(pythonInfo);

      expect(result).toBe(`"${mockPythonPath}" -m pip`);
    });

    test('throws error for Python without pip', () => {
      const pythonInfo = {
        path: mockPythonPath,
        hasPip: false,
      };

      expect(() => {
        detector.getPipCommand(pythonInfo);
      }).toThrow('pip is not available for this Python installation');
    });
  });

  describe('ensurePip', () => {
    test('returns true if pip already available', () => {
      const pythonInfo = { hasPip: true };

      const result = detector.ensurePip(pythonInfo);

      expect(result).toBe(true);
      expect(execSync).not.toHaveBeenCalled();
    });

    test('installs pip if not available', () => {
      const pythonInfo = {
        path: mockPythonPath,
        hasPip: false,
      };

      const result = detector.ensurePip(pythonInfo);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('ensurepip'),
        expect.any(Object),
      );
      expect(pythonInfo.hasPip).toBe(true);
      expect(result).toBe(true);
    });

    test('returns false on pip installation failure', () => {
      execSync.mockImplementation(() => {
        throw new Error('ensurepip failed');
      });

      const pythonInfo = {
        path: mockPythonPath,
        hasPip: false,
      };

      const result = detector.ensurePip(pythonInfo);

      expect(result).toBe(false);
      expect(pythonInfo.hasPip).toBe(false);
    });
  });

  describe('getEnvironmentInfo', () => {
    test('returns detailed environment information', () => {
      const mockEnvInfo = {
        version: '3.9.5 (default, May  3 2021, 19:12:05)',
        version_info: [3, 9, 5, 'final', 0],
        platform: 'Linux-5.4.0-x86_64-with-glibc2.31',
        implementation: 'CPython',
        prefix: '/usr',
        executable: mockPythonPath,
        paths: { stdlib: '/usr/lib/python3.9' },
        pip_available: true,
        pip_version: '21.0.0',
      };

      execSync.mockImplementation((cmd) => {
        if (cmd.includes('json.dumps')) {
          return JSON.stringify(mockEnvInfo);
        }
        return '';
      });

      const pythonInfo = { path: mockPythonPath };
      const result = detector.getEnvironmentInfo(pythonInfo);

      expect(result).toEqual(mockEnvInfo);
    });

    test('returns null on error', () => {
      execSync.mockImplementation(() => {
        throw new Error('Script failed');
      });

      const pythonInfo = { path: mockPythonPath };
      const result = detector.getEnvironmentInfo(pythonInfo);

      expect(result).toBeNull();
    });
  });

  describe('singleton export', () => {
    test('exports singleton instance', () => {
      expect(pythonDetector).toBeInstanceOf(PythonDetector);
    });
  });
});
