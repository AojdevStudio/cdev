/**
 * Tests for platform-utils.js
 */

const os = require('os');
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const { PlatformUtils, platformUtils } = require('./platform-utils');
const { pathResolver } = require('./path-resolver');

// Mock dependencies
jest.mock('os');
jest.mock('fs');
jest.mock('child_process');
jest.mock('./path-resolver');

describe('PlatformUtils', () => {
  let utils;
  const originalEnv = process.env;
  const originalGetuid = process.getuid;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    process.env = { ...originalEnv };
    
    // Default OS mocks
    os.platform.mockReturnValue('linux');
    os.arch.mockReturnValue('x64');
    os.release.mockReturnValue('5.4.0');
    os.version.mockReturnValue('#1 SMP');
    os.hostname.mockReturnValue('test-host');
    os.homedir.mockReturnValue('/home/test');
    os.tmpdir.mockReturnValue('/tmp');
    os.cpus.mockReturnValue([{}, {}, {}, {}]);
    os.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024);
    os.freemem.mockReturnValue(4 * 1024 * 1024 * 1024);
    os.uptime.mockReturnValue(3600);
    os.userInfo.mockReturnValue({ username: 'testuser' });
    os.networkInterfaces.mockReturnValue({
      eth0: [{ address: '192.168.1.1', family: 'IPv4', internal: false }]
    });
    
    // Default exec mocks
    execSync.mockReturnValue('');
    
    // Default fs mocks
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('');
    fs.writeFileSync.mockImplementation();
    fs.statSync.mockReturnValue({ mode: 0o755 });
    fs.chmodSync.mockImplementation();
    
    // Default path resolver mocks
    pathResolver.findInPath.mockReturnValue(null);
    
    utils = new PlatformUtils();
  });

  afterEach(() => {
    process.env = originalEnv;
    process.getuid = originalGetuid;
  });

  describe('constructor', () => {
    test('detects Linux platform', () => {
      os.platform.mockReturnValue('linux');
      const linuxUtils = new PlatformUtils();
      
      expect(linuxUtils.platform).toBe('linux');
      expect(linuxUtils.isLinux).toBe(true);
      expect(linuxUtils.isWindows).toBe(false);
      expect(linuxUtils.isMacOS).toBe(false);
      expect(linuxUtils.isUnix).toBe(true);
    });

    test('detects Windows platform', () => {
      os.platform.mockReturnValue('win32');
      const winUtils = new PlatformUtils();
      
      expect(winUtils.platform).toBe('win32');
      expect(winUtils.isWindows).toBe(true);
      expect(winUtils.isLinux).toBe(false);
      expect(winUtils.isMacOS).toBe(false);
      expect(winUtils.isUnix).toBe(false);
    });

    test('detects macOS platform', () => {
      os.platform.mockReturnValue('darwin');
      const macUtils = new PlatformUtils();
      
      expect(macUtils.platform).toBe('darwin');
      expect(macUtils.isMacOS).toBe(true);
      expect(macUtils.isWindows).toBe(false);
      expect(macUtils.isLinux).toBe(false);
      expect(macUtils.isUnix).toBe(true);
    });
  });

  describe('getUserInfo', () => {
    test('returns user info on Unix', () => {
      process.env.SHELL = '/bin/bash';
      process.getuid = jest.fn().mockReturnValue(1000);
      
      const info = utils.getUserInfo();
      
      expect(info).toEqual({
        username: 'testuser',
        homedir: '/home/test',
        shell: '/bin/bash',
        isAdmin: false
      });
    });

    test('detects root user on Unix', () => {
      process.getuid = jest.fn().mockReturnValue(0);
      
      const info = utils.getUserInfo();
      
      expect(info.isAdmin).toBe(true);
    });

    test('returns user info on Windows', () => {
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      
      const info = utils.getUserInfo();
      
      expect(info.isAdmin).toBe(false);
      expect(execSync).toHaveBeenCalledWith('net session', { stdio: 'ignore' });
    });

    test('detects admin on Windows', () => {
      os.platform.mockReturnValue('win32');
      execSync.mockImplementation((cmd) => {
        if (cmd === 'net session') return '';
        throw new Error('Not admin');
      });
      utils = new PlatformUtils();
      
      const info = utils.getUserInfo();
      
      expect(info.isAdmin).toBe(true);
    });

    test('handles missing getuid gracefully', () => {
      process.getuid = undefined;
      
      const info = utils.getUserInfo();
      
      expect(info.isAdmin).toBe(false);
    });
  });

  describe('getSystemInfo', () => {
    test('returns complete system information', () => {
      execSync.mockReturnValue('7.19.0\n');
      process.version = 'v16.14.0';
      
      const info = utils.getSystemInfo();
      
      expect(info).toEqual({
        platform: 'linux',
        arch: 'x64',
        release: '5.4.0',
        version: '#1 SMP',
        hostname: 'test-host',
        cpus: 4,
        totalMemory: 8 * 1024 * 1024 * 1024,
        freeMemory: 4 * 1024 * 1024 * 1024,
        uptime: 3600,
        nodeVersion: 'v16.14.0',
        npmVersion: '7.19.0'
      });
    });

    test('handles npm version check failure', () => {
      execSync.mockImplementation(() => {
        throw new Error('npm not found');
      });
      
      const info = utils.getSystemInfo();
      
      expect(info.npmVersion).toBeNull();
    });
  });

  describe('executeCommand', () => {
    test('executes command successfully', () => {
      execSync.mockReturnValue('command output\n');
      
      const result = utils.executeCommand('echo test');
      
      expect(result).toEqual({
        success: true,
        output: 'command output',
        error: null
      });
    });

    test('handles command failure', () => {
      const error = new Error('Command failed');
      error.stdout = Buffer.from('partial output');
      error.stderr = Buffer.from('error message');
      execSync.mockImplementation(() => { throw error; });
      
      const result = utils.executeCommand('invalid command');
      
      expect(result).toEqual({
        success: false,
        output: 'partial output',
        error: 'error message'
      });
    });

    test('uses Windows shell on Windows', () => {
      os.platform.mockReturnValue('win32');
      process.env.ComSpec = 'C:\\Windows\\System32\\cmd.exe';
      utils = new PlatformUtils();
      
      utils.executeCommand('dir');
      
      expect(execSync).toHaveBeenCalledWith('dir', expect.objectContaining({
        shell: 'C:\\Windows\\System32\\cmd.exe'
      }));
    });

    test('uses Unix shell on Unix', () => {
      process.env.SHELL = '/bin/zsh';
      
      utils.executeCommand('ls');
      
      expect(execSync).toHaveBeenCalledWith('ls', expect.objectContaining({
        shell: '/bin/zsh'
      }));
    });

    test('respects custom options', () => {
      utils.executeCommand('test', { timeout: 5000, encoding: 'binary' });
      
      expect(execSync).toHaveBeenCalledWith('test', expect.objectContaining({
        timeout: 5000,
        encoding: 'binary'
      }));
    });
  });

  describe('openBrowser', () => {
    test('opens browser on Windows', () => {
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      
      const result = utils.openBrowser('https://example.com');
      
      expect(execSync).toHaveBeenCalledWith(
        'start "" "https://example.com"',
        expect.any(Object)
      );
      expect(result).toBe(true);
    });

    test('opens browser on macOS', () => {
      os.platform.mockReturnValue('darwin');
      utils = new PlatformUtils();
      
      const result = utils.openBrowser('https://example.com');
      
      expect(execSync).toHaveBeenCalledWith(
        'open "https://example.com"',
        expect.any(Object)
      );
      expect(result).toBe(true);
    });

    test('opens browser on Linux', () => {
      const result = utils.openBrowser('https://example.com');
      
      expect(execSync).toHaveBeenCalledWith(
        'xdg-open "https://example.com"',
        expect.any(Object)
      );
      expect(result).toBe(true);
    });

    test('handles browser open failure', () => {
      execSync.mockImplementation(() => { throw new Error('Failed'); });
      
      const result = utils.openBrowser('https://example.com');
      
      expect(result).toBe(false);
    });
  });

  describe('openFile', () => {
    test('opens file with appropriate command per platform', () => {
      // Linux
      utils.openFile('/path/to/file.txt');
      expect(execSync).toHaveBeenCalledWith(
        'xdg-open "/path/to/file.txt"',
        expect.any(Object)
      );

      // Windows
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      utils.openFile('C:\\path\\to\\file.txt');
      expect(execSync).toHaveBeenCalledWith(
        'start "" "C:\\path\\to\\file.txt"',
        expect.any(Object)
      );

      // macOS
      os.platform.mockReturnValue('darwin');
      utils = new PlatformUtils();
      utils.openFile('/path/to/file.txt');
      expect(execSync).toHaveBeenCalledWith(
        'open "/path/to/file.txt"',
        expect.any(Object)
      );
    });
  });

  describe('getEnvironmentVariables', () => {
    test('returns environment variables', () => {
      process.env = { HOME: '/home/test', PATH: '/usr/bin' };
      
      const env = utils.getEnvironmentVariables();
      
      expect(env).toEqual({
        HOME: '/home/test',
        PATH: '/usr/bin'
      });
    });

    test('normalizes Windows Path variable', () => {
      os.platform.mockReturnValue('win32');
      process.env = { Path: 'C:\\Windows', OTHER: 'value' };
      utils = new PlatformUtils();
      
      const env = utils.getEnvironmentVariables();
      
      expect(env.PATH).toBe('C:\\Windows');
    });

    test('preserves existing PATH on Windows', () => {
      os.platform.mockReturnValue('win32');
      process.env = { PATH: 'C:\\existing', Path: 'C:\\Windows' };
      utils = new PlatformUtils();
      
      const env = utils.getEnvironmentVariables();
      
      expect(env.PATH).toBe('C:\\existing');
    });
  });

  describe('setEnvironmentVariable', () => {
    test('sets environment variable', () => {
      utils.setEnvironmentVariable('TEST_VAR', 'test_value');
      
      expect(process.env.TEST_VAR).toBe('test_value');
    });

    test('sets both PATH and Path on Windows', () => {
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      
      utils.setEnvironmentVariable('PATH', 'C:\\test');
      
      expect(process.env.PATH).toBe('C:\\test');
      expect(process.env.Path).toBe('C:\\test');
    });
  });

  describe('commandExists', () => {
    test('returns true when command exists', () => {
      pathResolver.findInPath.mockReturnValue('/usr/bin/git');
      
      expect(utils.commandExists('git')).toBe(true);
    });

    test('returns false when command does not exist', () => {
      pathResolver.findInPath.mockReturnValue(null);
      
      expect(utils.commandExists('nonexistent')).toBe(false);
    });
  });

  describe('getShellPrefix', () => {
    test('returns empty string on Unix', () => {
      expect(utils.getShellPrefix()).toBe('');
    });

    test('returns cmd prefix on Windows', () => {
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      
      expect(utils.getShellPrefix()).toBe('cmd /c');
    });
  });

  describe('createScript', () => {
    test('creates shell script on Unix', () => {
      const content = 'echo "Hello"';
      const result = utils.createScript('/tmp/script', content);
      
      expect(result).toBe('/tmp/script.sh');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/tmp/script.sh',
        '#!/bin/sh\necho "Hello"',
        { mode: 0o755 }
      );
    });

    test('preserves existing shebang', () => {
      const content = '#!/bin/bash\necho "Hello"';
      utils.createScript('/tmp/script', content);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        '#!/bin/bash\necho "Hello"',
        expect.any(Object)
      );
    });

    test('creates batch script on Windows', () => {
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      
      const content = 'echo Hello\necho World';
      const result = utils.createScript('C:\\temp\\script', content);
      
      expect(result).toBe('C:\\temp\\script.cmd');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'C:\\temp\\script.cmd',
        'echo Hello\r\necho World',
        { mode: 0o755 }
      );
    });
  });

  describe('getFilePermissions', () => {
    test('returns Unix permissions', () => {
      fs.statSync.mockReturnValue({ mode: 0o100755 });
      
      const perms = utils.getFilePermissions('/usr/bin/test');
      
      expect(perms).toEqual({
        readable: true,
        writable: true,
        executable: true,
        mode: '755'
      });
    });

    test('returns Windows permissions', () => {
      os.platform.mockReturnValue('win32');
      fs.statSync.mockReturnValue({ mode: 0o100666 });
      utils = new PlatformUtils();
      
      const perms = utils.getFilePermissions('C:\\test.exe');
      
      expect(perms).toEqual({
        readable: true,
        writable: true,
        executable: true
      });
    });

    test('detects read-only on Windows', () => {
      os.platform.mockReturnValue('win32');
      fs.statSync.mockReturnValue({ mode: 0o100444 });
      utils = new PlatformUtils();
      
      const perms = utils.getFilePermissions('C:\\readonly.txt');
      
      expect(perms.writable).toBe(false);
    });

    test('handles stat errors', () => {
      fs.statSync.mockImplementation(() => { throw new Error('File not found'); });
      
      const perms = utils.getFilePermissions('/nonexistent');
      
      expect(perms).toBeNull();
    });
  });

  describe('setFilePermissions', () => {
    test('sets Unix permissions', () => {
      const result = utils.setFilePermissions('/test/file', {
        readable: true,
        writable: false,
        executable: true
      });
      
      expect(fs.chmodSync).toHaveBeenCalledWith('/test/file', 0o555);
      expect(result).toBe(true);
    });

    test('sets Windows read-only', () => {
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      
      utils.setFilePermissions('C:\\test.txt', { writable: false });
      
      expect(fs.chmodSync).toHaveBeenCalledWith('C:\\test.txt', 0o444);
    });

    test('handles permission errors', () => {
      fs.chmodSync.mockImplementation(() => { throw new Error('Access denied'); });
      
      const result = utils.setFilePermissions('/test', {});
      
      expect(result).toBe(false);
    });
  });

  describe('killProcess', () => {
    test('kills process on Unix', () => {
      process.kill = jest.fn();
      
      const result = utils.killProcess(1234);
      
      expect(process.kill).toHaveBeenCalledWith(1234, 'SIGTERM');
      expect(result).toBe(true);
    });

    test('kills process with custom signal', () => {
      process.kill = jest.fn();
      
      utils.killProcess(1234, 'SIGKILL');
      
      expect(process.kill).toHaveBeenCalledWith(1234, 'SIGKILL');
    });

    test('kills process on Windows', () => {
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      
      const result = utils.killProcess(1234);
      
      expect(execSync).toHaveBeenCalledWith('taskkill /F /PID 1234', { stdio: 'ignore' });
      expect(result).toBe(true);
    });

    test('handles kill errors', () => {
      process.kill = jest.fn().mockImplementation(() => { throw new Error('No such process'); });
      
      const result = utils.killProcess(9999);
      
      expect(result).toBe(false);
    });
  });

  describe('findProcess', () => {
    test('finds process on Windows', () => {
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      
      execSync.mockReturnValue(`
Node,Name,ProcessId,CommandLine
host,node.exe,1234,"node server.js"
host,chrome.exe,5678,"chrome --flag"
host,node.exe,9012,"node client.js"
`);
      
      const processes = utils.findProcess('node');
      
      expect(processes).toHaveLength(2);
      expect(processes[0]).toEqual({
        pid: 1234,
        name: 'node.exe',
        command: 'Name'
      });
    });

    test('finds process on Unix', () => {
      execSync.mockReturnValue(`
user  1234  0.0  0.1  12345  6789 ?  S  10:00  0:00 node server.js
user  9012  0.0  0.1  12345  6789 ?  S  10:01  0:00 node client.js
`);
      
      const processes = utils.findProcess('node');
      
      expect(processes).toHaveLength(2);
      expect(processes[0]).toEqual({
        pid: 1234,
        name: 'node',
        command: 'node server.js'
      });
    });

    test('returns empty array when no processes found', () => {
      execSync.mockImplementation(() => { throw new Error('No matching processes'); });
      
      const processes = utils.findProcess('nonexistent');
      
      expect(processes).toEqual([]);
    });
  });

  describe('getNetworkInfo', () => {
    test('returns network interface information', () => {
      os.networkInterfaces.mockReturnValue({
        eth0: [
          { address: '192.168.1.100', family: 'IPv4', internal: false },
          { address: 'fe80::1', family: 'IPv6', internal: false }
        ],
        lo: [
          { address: '127.0.0.1', family: 'IPv4', internal: true }
        ]
      });
      
      const info = utils.getNetworkInfo();
      
      expect(info).toEqual({
        eth0: [
          { address: '192.168.1.100', family: 'IPv4', internal: false },
          { address: 'fe80::1', family: 'IPv6', internal: false }
        ],
        lo: [
          { address: '127.0.0.1', family: 'IPv4', internal: true }
        ]
      });
    });
  });

  describe('isInContainer', () => {
    test('detects Docker via .dockerenv', () => {
      fs.existsSync.mockImplementation(path => path === '/.dockerenv');
      
      expect(utils.isInContainer()).toBe(true);
    });

    test('detects container via cgroup', () => {
      fs.readFileSync.mockImplementation(path => {
        if (path === '/proc/1/cgroup') {
          return '1:name=systemd:/docker/abc123';
        }
      });
      
      expect(utils.isInContainer()).toBe(true);
    });

    test('detects containerd', () => {
      fs.readFileSync.mockImplementation(path => {
        if (path === '/proc/1/cgroup') {
          return '1:name=systemd:/containerd/abc123';
        }
      });
      
      expect(utils.isInContainer()).toBe(true);
    });

    test('returns false when not in container', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readFileSync.mockImplementation(() => { throw new Error('Not found'); });
      
      expect(utils.isInContainer()).toBe(false);
    });
  });

  describe('isWSL', () => {
    test('detects WSL via proc version', () => {
      fs.readFileSync.mockImplementation(path => {
        if (path === '/proc/version') {
          return 'Linux version 5.10.16.3-microsoft-standard-WSL2';
        }
      });
      
      expect(utils.isWSL()).toBe(true);
    });

    test('returns false on non-Linux', () => {
      os.platform.mockReturnValue('darwin');
      utils = new PlatformUtils();
      
      expect(utils.isWSL()).toBe(false);
    });

    test('returns false when not WSL', () => {
      fs.readFileSync.mockImplementation(path => {
        if (path === '/proc/version') {
          return 'Linux version 5.4.0-generic';
        }
      });
      
      expect(utils.isWSL()).toBe(false);
    });
  });

  describe('line endings', () => {
    test('getLineEnding returns correct endings', () => {
      expect(utils.getLineEnding()).toBe('\n');
      
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      expect(utils.getLineEnding()).toBe('\r\n');
    });

    test('normalizeLineEndings converts to platform format', () => {
      const text = 'Line1\r\nLine2\nLine3\rLine4';
      
      // Unix
      const unixResult = utils.normalizeLineEndings(text);
      expect(unixResult).toBe('Line1\nLine2\nLine3\nLine4');
      
      // Windows
      os.platform.mockReturnValue('win32');
      utils = new PlatformUtils();
      const winResult = utils.normalizeLineEndings(text);
      expect(winResult).toBe('Line1\r\nLine2\r\nLine3\r\nLine4');
    });
  });

  describe('singleton', () => {
    test('exports singleton instance', () => {
      expect(platformUtils).toBeInstanceOf(PlatformUtils);
    });
  });
});