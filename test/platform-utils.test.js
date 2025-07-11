/**
 * Tests for platform-utils.js
 */

const { platformUtils, PlatformUtils } = require('../src/platform-utils');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Mock modules
jest.mock('child_process');
jest.mock('fs');

describe('PlatformUtils', () => {
  let originalPlatform;

  beforeEach(() => {
    jest.clearAllMocks();
    originalPlatform = os.platform;
  });

  afterEach(() => {
    os.platform = originalPlatform;
  });

  describe('platform detection', () => {
    test('detects Windows correctly', () => {
      os.platform = jest.fn(() => 'win32');
      const utils = new PlatformUtils();
      
      expect(utils.isWindows).toBe(true);
      expect(utils.isMacOS).toBe(false);
      expect(utils.isLinux).toBe(false);
      expect(utils.isUnix).toBe(false);
    });

    test('detects macOS correctly', () => {
      os.platform = jest.fn(() => 'darwin');
      const utils = new PlatformUtils();
      
      expect(utils.isWindows).toBe(false);
      expect(utils.isMacOS).toBe(true);
      expect(utils.isLinux).toBe(false);
      expect(utils.isUnix).toBe(true);
    });

    test('detects Linux correctly', () => {
      os.platform = jest.fn(() => 'linux');
      const utils = new PlatformUtils();
      
      expect(utils.isWindows).toBe(false);
      expect(utils.isMacOS).toBe(false);
      expect(utils.isLinux).toBe(true);
      expect(utils.isUnix).toBe(true);
    });
  });

  describe('getUserInfo', () => {
    test('returns user information', () => {
      const mockUserInfo = {
        username: 'testuser',
        homedir: '/home/testuser'
      };
      jest.spyOn(os, 'userInfo').mockReturnValue(mockUserInfo);
      jest.spyOn(os, 'homedir').mockReturnValue('/home/testuser');

      const info = platformUtils.getUserInfo();
      
      expect(info.username).toBe('testuser');
      expect(info.homedir).toBe('/home/testuser');
      expect(info).toHaveProperty('shell');
      expect(info).toHaveProperty('isAdmin');
    });

    test('detects admin privileges on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      execSync.mockImplementation(() => ''); // Success means admin

      const utils = new PlatformUtils();
      const info = utils.getUserInfo();
      
      expect(info.isAdmin).toBe(true);
    });

    test('detects non-admin on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      execSync.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const utils = new PlatformUtils();
      const info = utils.getUserInfo();
      
      expect(info.isAdmin).toBe(false);
    });

    test('detects admin privileges on Unix', () => {
      os.platform = jest.fn(() => 'linux');
      const originalGetuid = process.getuid;
      process.getuid = () => 0; // Root user

      const utils = new PlatformUtils();
      const info = utils.getUserInfo();
      
      expect(info.isAdmin).toBe(true);
      
      process.getuid = originalGetuid;
    });
  });

  describe('getSystemInfo', () => {
    test('returns system information', () => {
      jest.spyOn(os, 'arch').mockReturnValue('x64');
      jest.spyOn(os, 'release').mockReturnValue('5.10.0');
      jest.spyOn(os, 'cpus').mockReturnValue(new Array(8));
      jest.spyOn(os, 'totalmem').mockReturnValue(16 * 1024 * 1024 * 1024);
      jest.spyOn(os, 'freemem').mockReturnValue(8 * 1024 * 1024 * 1024);
      execSync.mockImplementation((cmd) => {
        if (cmd === 'npm --version') return '8.0.0';
        return '';
      });

      const info = platformUtils.getSystemInfo();
      
      expect(info.arch).toBe('x64');
      expect(info.cpus).toBe(8);
      expect(info.totalMemory).toBe(16 * 1024 * 1024 * 1024);
      expect(info.npmVersion).toBe('8.0.0');
    });
  });

  describe('executeCommand', () => {
    test('executes command successfully', () => {
      execSync.mockReturnValue('command output');

      const result = platformUtils.executeCommand('echo test');
      
      expect(result.success).toBe(true);
      expect(result.output).toBe('command output');
      expect(result.error).toBeNull();
    });

    test('handles command failure', () => {
      const error = new Error('Command failed');
      error.stderr = 'error output';
      execSync.mockImplementation(() => {
        throw error;
      });

      const result = platformUtils.executeCommand('failing-command');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('error output');
    });

    test('uses correct shell on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      execSync.mockReturnValue('');

      const utils = new PlatformUtils();
      utils.executeCommand('test');
      
      expect(execSync).toHaveBeenCalledWith('test', expect.objectContaining({
        shell: expect.stringContaining('cmd')
      }));
    });

    test('uses correct shell on Unix', () => {
      os.platform = jest.fn(() => 'darwin');
      execSync.mockReturnValue('');

      const utils = new PlatformUtils();
      utils.executeCommand('test');
      
      expect(execSync).toHaveBeenCalledWith('test', expect.objectContaining({
        shell: expect.stringMatching(/sh$/)
      }));
    });
  });

  describe('openBrowser', () => {
    test('opens browser on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      execSync.mockReturnValue('');

      const utils = new PlatformUtils();
      const result = utils.openBrowser('https://example.com');
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('start'), expect.any(Object));
    });

    test('opens browser on macOS', () => {
      os.platform = jest.fn(() => 'darwin');
      execSync.mockReturnValue('');

      const utils = new PlatformUtils();
      const result = utils.openBrowser('https://example.com');
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('open'), expect.any(Object));
    });

    test('opens browser on Linux', () => {
      os.platform = jest.fn(() => 'linux');
      execSync.mockReturnValue('');

      const utils = new PlatformUtils();
      const result = utils.openBrowser('https://example.com');
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('xdg-open'), expect.any(Object));
    });
  });

  describe('getFilePermissions', () => {
    test('gets file permissions on Unix', () => {
      os.platform = jest.fn(() => 'linux');
      fs.statSync.mockReturnValue({
        mode: 0o755
      });

      const utils = new PlatformUtils();
      const perms = utils.getFilePermissions('/test/file');
      
      expect(perms.readable).toBe(true);
      expect(perms.writable).toBe(true);
      expect(perms.executable).toBe(true);
      expect(perms.mode).toBe('755');
    });

    test('gets file permissions on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      fs.statSync.mockReturnValue({
        mode: 0o666
      });

      const utils = new PlatformUtils();
      const perms = utils.getFilePermissions('/test/file.txt');
      
      expect(perms.readable).toBe(true);
      expect(perms.writable).toBe(true);
      expect(perms.executable).toBe(false);
    });

    test('returns null on error', () => {
      fs.statSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const perms = platformUtils.getFilePermissions('/nonexistent');
      expect(perms).toBeNull();
    });
  });

  describe('setFilePermissions', () => {
    test('sets file permissions on Unix', () => {
      os.platform = jest.fn(() => 'linux');
      fs.chmodSync.mockImplementation(() => {});

      const utils = new PlatformUtils();
      const result = utils.setFilePermissions('/test/file', {
        readable: true,
        writable: false,
        executable: true
      });
      
      expect(result).toBe(true);
      expect(fs.chmodSync).toHaveBeenCalled();
    });

    test('handles limited permissions on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      fs.chmodSync.mockImplementation(() => {});

      const utils = new PlatformUtils();
      const result = utils.setFilePermissions('/test/file', {
        writable: false
      });
      
      expect(result).toBe(true);
      expect(fs.chmodSync).toHaveBeenCalledWith('/test/file', 0o444);
    });

    test('returns false on error', () => {
      fs.chmodSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = platformUtils.setFilePermissions('/test/file', {});
      expect(result).toBe(false);
    });
  });

  describe('createScript', () => {
    test('creates Windows script', () => {
      os.platform = jest.fn(() => 'win32');
      fs.writeFileSync.mockImplementation(() => {});

      const utils = new PlatformUtils();
      const scriptPath = utils.createScript('/test/script', 'echo hello\necho world');
      
      expect(scriptPath).toBe('/test/script.cmd');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/script.cmd',
        'echo hello\r\necho world',
        { mode: 0o755 }
      );
    });

    test('creates Unix script with shebang', () => {
      os.platform = jest.fn(() => 'linux');
      fs.writeFileSync.mockImplementation(() => {});

      const utils = new PlatformUtils();
      const scriptPath = utils.createScript('/test/script', 'echo hello');
      
      expect(scriptPath).toBe('/test/script.sh');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/script.sh',
        expect.stringContaining('#!/bin/sh'),
        expect.objectContaining({ mode: 0o755 })
      );
    });
  });

  describe('process management', () => {
    test('kills process on Windows', () => {
      os.platform = jest.fn(() => 'win32');
      execSync.mockImplementation(() => '');

      const utils = new PlatformUtils();
      const result = utils.killProcess(1234);
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('taskkill'), expect.any(Object));
    });

    test('kills process on Unix', () => {
      os.platform = jest.fn(() => 'linux');
      const originalKill = process.kill;
      process.kill = jest.fn();

      const utils = new PlatformUtils();
      const result = utils.killProcess(1234, 'SIGTERM');
      
      expect(result).toBe(true);
      expect(process.kill).toHaveBeenCalledWith(1234, 'SIGTERM');
      
      process.kill = originalKill;
    });

    test('finds processes by name', () => {
      os.platform = jest.fn(() => 'linux');
      execSync.mockReturnValue(`user     1234  0.0  0.1  12345  6789 ?        S    10:00   0:00 /usr/bin/node test.js
user     5678  0.0  0.1  12345  6789 ?        S    10:01   0:00 /usr/bin/node server.js`);

      const utils = new PlatformUtils();
      const processes = utils.findProcess('node');
      
      expect(processes).toHaveLength(2);
      expect(processes[0].pid).toBe(1234);
      expect(processes[0].name).toBe('node');
    });
  });

  describe('container detection', () => {
    test('detects Docker container', () => {
      fs.existsSync.mockImplementation((path) => path === '/.dockerenv');

      const result = platformUtils.isInContainer();
      expect(result).toBe(true);
    });

    test('detects containerd via cgroup', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readFileSync.mockImplementation((path) => {
        if (path === '/proc/1/cgroup') {
          return '12:devices:/docker/abcdef123456';
        }
        return '';
      });

      const result = platformUtils.isInContainer();
      expect(result).toBe(true);
    });

    test('returns false when not in container', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = platformUtils.isInContainer();
      expect(result).toBe(false);
    });
  });

  describe('WSL detection', () => {
    test('detects WSL environment', () => {
      os.platform = jest.fn(() => 'linux');
      fs.readFileSync.mockImplementation((path) => {
        if (path === '/proc/version') {
          return 'Linux version 5.10.16.3-microsoft-standard-WSL2';
        }
        return '';
      });

      const utils = new PlatformUtils();
      const result = utils.isWSL();
      expect(result).toBe(true);
    });

    test('returns false on non-Linux platforms', () => {
      os.platform = jest.fn(() => 'win32');
      
      const utils = new PlatformUtils();
      const result = utils.isWSL();
      expect(result).toBe(false);
    });
  });

  describe('line endings', () => {
    test('returns correct line ending for Windows', () => {
      os.platform = jest.fn(() => 'win32');
      const utils = new PlatformUtils();
      
      expect(utils.getLineEnding()).toBe('\r\n');
    });

    test('returns correct line ending for Unix', () => {
      os.platform = jest.fn(() => 'darwin');
      const utils = new PlatformUtils();
      
      expect(utils.getLineEnding()).toBe('\n');
    });

    test('normalizes line endings correctly', () => {
      os.platform = jest.fn(() => 'win32');
      const utils = new PlatformUtils();
      
      const text = 'line1\nline2\r\nline3\rline4';
      const normalized = utils.normalizeLineEndings(text);
      
      expect(normalized).toBe('line1\r\nline2\r\nline3\r\nline4');
    });
  });

  describe('getNetworkInfo', () => {
    test('returns network interface information', () => {
      const mockInterfaces = {
        eth0: [{
          address: '192.168.1.100',
          family: 'IPv4',
          internal: false
        }],
        lo: [{
          address: '127.0.0.1',
          family: 'IPv4',
          internal: true
        }]
      };
      
      jest.spyOn(os, 'networkInterfaces').mockReturnValue(mockInterfaces);

      const info = platformUtils.getNetworkInfo();
      
      expect(info).toHaveProperty('eth0');
      expect(info).toHaveProperty('lo');
      expect(info.eth0[0].address).toBe('192.168.1.100');
      expect(info.lo[0].internal).toBe(true);
    });
  });
});