/**
 * Platform-specific utilities for cross-platform operations
 * Provides abstraction for OS-specific functionality
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const { pathResolver } = require('./path-resolver');

class PlatformUtils {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isMacOS = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    this.isUnix = this.isMacOS || this.isLinux;
  }

  /**
   * Get current user information
   * @returns {Object} User information
   */
  getUserInfo() {
    const info = {
      username: os.userInfo().username,
      homedir: os.homedir(),
      shell: process.env.SHELL || null,
      isAdmin: false,
    };

    // Check if user has admin/root privileges
    if (this.isWindows) {
      try {
        execSync('net session', { stdio: 'ignore' });
        info.isAdmin = true;
      } catch {
        info.isAdmin = false;
      }
    } else {
      info.isAdmin = process.getuid && process.getuid() === 0;
    }

    return info;
  }

  /**
   * Get system information
   * @returns {Object} System information
   */
  getSystemInfo() {
    return {
      platform: this.platform,
      arch: os.arch(),
      release: os.release(),
      version: os.version(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      nodeVersion: process.version,
      npmVersion: this.getNpmVersion(),
    };
  }

  /**
   * Get NPM version
   * @returns {string|null} NPM version or null
   */
  getNpmVersion() {
    try {
      return execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  }

  /**
   * Execute command with platform-specific handling
   * @param {string} command - Command to execute
   * @param {Object} options - Execution options
   * @returns {Object} Execution result
   */
  executeCommand(command, options = {}) {
    const defaultOptions = {
      encoding: 'utf8',
      shell: true,
      timeout: 30000,
    };

    const execOptions = { ...defaultOptions, ...options };

    // Use appropriate shell on different platforms
    if (this.isWindows) {
      execOptions.shell = process.env.ComSpec || 'cmd.exe';
    } else {
      execOptions.shell = process.env.SHELL || '/bin/sh';
    }

    try {
      const output = execSync(command, execOptions);
      return {
        success: true,
        output: output.toString().trim(),
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        output: error.stdout ? error.stdout.toString() : '',
        error: error.stderr ? error.stderr.toString() : error.message,
      };
    }
  }

  /**
   * Open URL in default browser
   * @param {string} url - URL to open
   * @returns {boolean} True if successful
   */
  openBrowser(url) {
    try {
      let command;
      if (this.isWindows) {
        command = `start "" "${url}"`;
      } else if (this.isMacOS) {
        command = `open "${url}"`;
      } else {
        command = `xdg-open "${url}"`;
      }

      this.executeCommand(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Open file in default application
   * @param {string} filePath - File path to open
   * @returns {boolean} True if successful
   */
  openFile(filePath) {
    try {
      let command;
      if (this.isWindows) {
        command = `start "" "${filePath}"`;
      } else if (this.isMacOS) {
        command = `open "${filePath}"`;
      } else {
        command = `xdg-open "${filePath}"`;
      }

      this.executeCommand(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get environment variables with platform-specific handling
   * @returns {Object} Environment variables
   */
  getEnvironmentVariables() {
    const env = { ...process.env };

    // Normalize PATH variable name
    if (this.isWindows && env.Path && !env.PATH) {
      env.PATH = env.Path;
    }

    return env;
  }

  /**
   * Set environment variable for current process
   * @param {string} name - Variable name
   * @param {string} value - Variable value
   */
  setEnvironmentVariable(name, value) {
    process.env[name] = value;

    // On Windows, also set Path if PATH is being set
    if (this.isWindows && name === 'PATH') {
      process.env.Path = value;
    }
  }

  /**
   * Check if a command exists in PATH
   * @param {string} command - Command to check
   * @returns {boolean} True if command exists
   */
  commandExists(command) {
    const result = pathResolver.findInPath(command);
    return result !== null;
  }

  /**
   * Get the appropriate shell command prefix
   * @returns {string} Shell command prefix
   */
  getShellPrefix() {
    if (this.isWindows) {
      return 'cmd /c';
    }
    return '';
  }

  /**
   * Create a platform-specific script file
   * @param {string} scriptPath - Path for script file
   * @param {string} content - Script content
   * @returns {string} Created script path
   */
  createScript(scriptPath, content) {
    let scriptExt = '';
    let scriptContent = content;

    if (this.isWindows) {
      scriptExt = '.cmd';
      // Ensure Windows line endings
      scriptContent = scriptContent.replace(/\n/g, '\r\n');
    } else {
      scriptExt = '.sh';
      // Add shebang if not present
      if (!scriptContent.startsWith('#!')) {
        scriptContent = `#!/bin/sh\n${scriptContent}`;
      }
    }

    const fullPath = scriptPath + scriptExt;
    fs.writeFileSync(fullPath, scriptContent, { mode: 0o755 });

    return fullPath;
  }

  /**
   * Get file permissions in a cross-platform way
   * @param {string} filePath - File path
   * @returns {Object} Permission details
   */
  getFilePermissions(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const { mode } = stats;

      if (this.isWindows) {
        // Windows doesn't have Unix-style permissions
        return {
          readable: true,
          writable: !((mode & 0o200) === 0),
          executable:
            filePath.endsWith('.exe') || filePath.endsWith('.cmd') || filePath.endsWith('.bat'),
        };
      }
      // Unix-style permissions
      return {
        readable: (mode & 0o400) !== 0,
        writable: (mode & 0o200) !== 0,
        executable: (mode & 0o100) !== 0,
        mode: (mode & 0o777).toString(8),
      };
    } catch {
      return null;
    }
  }

  /**
   * Set file permissions in a cross-platform way
   * @param {string} filePath - File path
   * @param {Object} permissions - Permissions to set
   * @returns {boolean} True if successful
   */
  setFilePermissions(filePath, permissions) {
    try {
      if (this.isWindows) {
        // Windows: Limited permission control
        if (permissions.writable === false) {
          fs.chmodSync(filePath, 0o444);
        }
      } else {
        // Unix: Full permission control
        let mode = 0;
        if (permissions.readable) {
          mode |= 0o400;
        }
        if (permissions.writable) {
          mode |= 0o200;
        }
        if (permissions.executable) {
          mode |= 0o100;
        }

        // Apply to group and others as well
        mode = mode | (mode >> 3) | (mode >> 6);

        fs.chmodSync(filePath, mode);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Kill a process by PID
   * @param {number} pid - Process ID
   * @param {string} signal - Signal to send (optional)
   * @returns {boolean} True if successful
   */
  killProcess(pid, signal = 'SIGTERM') {
    try {
      if (this.isWindows) {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } else {
        process.kill(pid, signal);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find process by name
   * @param {string} processName - Process name to find
   * @returns {Array<Object>} Array of matching processes
   */
  findProcess(processName) {
    const processes = [];

    try {
      if (this.isWindows) {
        const output = execSync('wmic process get ProcessId,Name,CommandLine /format:csv', {
          encoding: 'utf8',
        });
        const lines = output.split('\n').filter((line) => line.trim());

        for (let i = 2; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 3 && parts[2].toLowerCase().includes(processName.toLowerCase())) {
            processes.push({
              pid: parseInt(parts[3]),
              name: parts[2],
              command: parts[1],
            });
          }
        }
      } else {
        const output = execSync(`ps aux | grep -i ${processName} | grep -v grep`, {
          encoding: 'utf8',
        });
        const lines = output.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          const parts = line.split(/\s+/);
          processes.push({
            pid: parseInt(parts[1]),
            name: processName,
            command: parts.slice(10).join(' '),
          });
        }
      }
    } catch {
      // Process not found or command failed
    }

    return processes;
  }

  /**
   * Get network interfaces information
   * @returns {Object} Network interfaces
   */
  getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const result = {};

    for (const [name, addresses] of Object.entries(interfaces)) {
      result[name] = addresses.map((addr) => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal,
      }));
    }

    return result;
  }

  /**
   * Check if running in a container
   * @returns {boolean} True if in container
   */
  isInContainer() {
    // Check for Docker
    if (fs.existsSync('/.dockerenv')) {
      return true;
    }

    // Check for containerd
    try {
      const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
      if (cgroup.includes('docker') || cgroup.includes('containerd')) {
        return true;
      }
    } catch {
      // Not in container or can't determine
    }

    return false;
  }

  /**
   * Check if running in WSL
   * @returns {boolean} True if in WSL
   */
  isWSL() {
    if (!this.isLinux) {
      return false;
    }

    try {
      const version = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
      return version.includes('microsoft') || version.includes('wsl');
    } catch {
      return false;
    }
  }

  /**
   * Get the appropriate line ending for the platform
   * @returns {string} Line ending
   */
  getLineEnding() {
    return this.isWindows ? '\r\n' : '\n';
  }

  /**
   * Normalize line endings in text
   * @param {string} text - Text to normalize
   * @returns {string} Normalized text
   */
  normalizeLineEndings(text) {
    const lineEnding = this.getLineEnding();
    return text.replace(/\r\n|\r|\n/g, lineEnding);
  }
}

// Export singleton instance
const platformUtils = new PlatformUtils();

module.exports = {
  PlatformUtils,
  platformUtils,
};
