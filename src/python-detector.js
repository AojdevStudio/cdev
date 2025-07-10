/**
 * Python interpreter detection across different platforms
 * Finds Python installations and validates versions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathResolver } = require('./path-resolver');

class PythonDetector {
  constructor() {
    this.minPythonVersion = '3.6';
    this.pythonCommands = ['python3', 'python', 'py'];
    this.detectedPython = null;
  }

  /**
   * Detect Python installations on the system
   * @returns {Array<Object>} Array of Python installation details
   */
  detectPythonInstallations() {
    const installations = [];
    const checkedPaths = new Set();

    // Check common Python commands
    for (const cmd of this.pythonCommands) {
      const pythonPath = this.checkPythonCommand(cmd);
      if (pythonPath && !checkedPaths.has(pythonPath.path)) {
        checkedPaths.add(pythonPath.path);
        installations.push(pythonPath);
      }
    }

    // Check platform-specific locations
    const platformPaths = this.getPlatformSpecificPaths();
    for (const pythonPath of platformPaths) {
      if (!checkedPaths.has(pythonPath) && this.isPythonExecutable(pythonPath)) {
        const info = this.getPythonInfo(pythonPath);
        if (info && !checkedPaths.has(info.path)) {
          checkedPaths.add(info.path);
          installations.push(info);
        }
      }
    }

    // Sort by version (newest first)
    installations.sort((a, b) => this.compareVersions(b.version, a.version));

    return installations;
  }

  /**
   * Get the best available Python installation
   * @returns {Object|null} Python installation details or null
   */
  getBestPython() {
    if (this.detectedPython) {
      return this.detectedPython;
    }

    const installations = this.detectPythonInstallations();
    
    // Find the first installation that meets minimum version
    for (const installation of installations) {
      if (this.meetsMinimumVersion(installation.version)) {
        this.detectedPython = installation;
        return installation;
      }
    }

    // If none meet minimum, return the newest one
    if (installations.length > 0) {
      this.detectedPython = installations[0];
      return installations[0];
    }

    return null;
  }

  /**
   * Check a specific Python command
   * @param {string} command - Python command to check
   * @returns {Object|null} Python info or null
   */
  checkPythonCommand(command) {
    try {
      const pythonPath = pathResolver.findInPath(command);
      if (!pythonPath) return null;

      return this.getPythonInfo(pythonPath);
    } catch {
      return null;
    }
  }

  /**
   * Get Python information from executable path
   * @param {string} pythonPath - Path to Python executable
   * @returns {Object|null} Python info or null
   */
  getPythonInfo(pythonPath) {
    try {
      // Get version
      const versionOutput = execSync(`"${pythonPath}" --version`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      
      const versionMatch = versionOutput.match(/Python (\d+\.\d+\.\d+)/);
      if (!versionMatch) return null;

      const version = versionMatch[1];

      // Get sys.prefix (Python installation root)
      const prefixOutput = execSync(`"${pythonPath}" -c "import sys; print(sys.prefix)"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      // Get pip availability
      let hasPip = false;
      try {
        execSync(`"${pythonPath}" -m pip --version`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        hasPip = true;
      } catch {
        hasPip = false;
      }

      return {
        command: path.basename(pythonPath, path.extname(pythonPath)),
        path: pythonPath,
        version: version,
        prefix: prefixOutput,
        hasPip: hasPip,
        meetsMinimumVersion: this.meetsMinimumVersion(version)
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if a path is a valid Python executable
   * @param {string} pythonPath - Path to check
   * @returns {boolean} True if valid Python executable
   */
  isPythonExecutable(pythonPath) {
    try {
      fs.accessSync(pythonPath, fs.constants.X_OK);
      const output = execSync(`"${pythonPath}" --version`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return output.includes('Python');
    } catch {
      return false;
    }
  }

  /**
   * Get platform-specific Python paths to check
   * @returns {Array<string>} Array of paths to check
   */
  getPlatformSpecificPaths() {
    const paths = [];
    const platform = pathResolver.getPlatformInfo();

    if (platform.isWindows) {
      // Windows Python locations
      const programFiles = [
        process.env.ProgramFiles,
        process.env['ProgramFiles(x86)'],
        process.env.LOCALAPPDATA
      ].filter(Boolean);

      for (const base of programFiles) {
        // Python.org installations
        paths.push(path.join(base, 'Python', 'Python39', 'python.exe'));
        paths.push(path.join(base, 'Python', 'Python310', 'python.exe'));
        paths.push(path.join(base, 'Python', 'Python311', 'python.exe'));
        paths.push(path.join(base, 'Python', 'Python312', 'python.exe'));
        
        // Older versions
        paths.push(path.join(base, 'Python39', 'python.exe'));
        paths.push(path.join(base, 'Python310', 'python.exe'));
        paths.push(path.join(base, 'Python311', 'python.exe'));
        paths.push(path.join(base, 'Python312', 'python.exe'));
      }

      // Windows Store Python
      const localAppData = process.env.LOCALAPPDATA;
      if (localAppData) {
        const windowsApps = path.join(localAppData, 'Microsoft', 'WindowsApps');
        paths.push(path.join(windowsApps, 'python.exe'));
        paths.push(path.join(windowsApps, 'python3.exe'));
      }

      // Conda/Anaconda on Windows
      const userProfile = process.env.USERPROFILE;
      if (userProfile) {
        paths.push(path.join(userProfile, 'Anaconda3', 'python.exe'));
        paths.push(path.join(userProfile, 'Miniconda3', 'python.exe'));
      }
    } else if (platform.isMacOS) {
      // macOS Python locations
      paths.push('/usr/bin/python3');
      paths.push('/usr/local/bin/python3');
      paths.push('/opt/homebrew/bin/python3');
      paths.push('/usr/local/opt/python/bin/python3');
      
      // Homebrew Python versions
      for (let minor = 9; minor <= 12; minor++) {
        paths.push(`/usr/local/bin/python3.${minor}`);
        paths.push(`/opt/homebrew/bin/python3.${minor}`);
      }

      // MacPorts
      paths.push('/opt/local/bin/python3');

      // Conda/Anaconda on macOS
      const home = process.env.HOME;
      if (home) {
        paths.push(path.join(home, 'anaconda3', 'bin', 'python'));
        paths.push(path.join(home, 'miniconda3', 'bin', 'python'));
        paths.push(path.join(home, '.pyenv', 'shims', 'python'));
      }
    } else {
      // Linux Python locations
      paths.push('/usr/bin/python3');
      paths.push('/usr/local/bin/python3');
      paths.push('/bin/python3');
      
      // Version-specific paths
      for (let minor = 6; minor <= 12; minor++) {
        paths.push(`/usr/bin/python3.${minor}`);
        paths.push(`/usr/local/bin/python3.${minor}`);
      }

      // Conda/Anaconda on Linux
      const home = process.env.HOME;
      if (home) {
        paths.push(path.join(home, 'anaconda3', 'bin', 'python'));
        paths.push(path.join(home, 'miniconda3', 'bin', 'python'));
        paths.push(path.join(home, '.pyenv', 'shims', 'python'));
        paths.push(path.join(home, '.local', 'bin', 'python3'));
      }

      // Snap packages
      paths.push('/snap/bin/python3');
    }

    return paths.filter(p => fs.existsSync(p));
  }

  /**
   * Compare two version strings
   * @param {string} v1 - First version
   * @param {string} v2 - Second version
   * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  /**
   * Check if version meets minimum requirement
   * @param {string} version - Version to check
   * @returns {boolean} True if meets minimum version
   */
  meetsMinimumVersion(version) {
    return this.compareVersions(version, this.minPythonVersion) >= 0;
  }

  /**
   * Create a virtual environment
   * @param {string} venvPath - Path for virtual environment
   * @param {Object} pythonInfo - Python installation to use
   * @returns {boolean} True if successful
   */
  createVirtualEnvironment(venvPath, pythonInfo = null) {
    const python = pythonInfo || this.getBestPython();
    if (!python) {
      throw new Error('No suitable Python installation found');
    }

    try {
      execSync(`"${python.path}" -m venv "${venvPath}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to create virtual environment: ${error.message}`);
    }
  }

  /**
   * Get pip command for a Python installation
   * @param {Object} pythonInfo - Python installation info
   * @returns {string} Pip command
   */
  getPipCommand(pythonInfo) {
    if (!pythonInfo.hasPip) {
      throw new Error('pip is not available for this Python installation');
    }

    return `"${pythonInfo.path}" -m pip`;
  }

  /**
   * Install pip if not available
   * @param {Object} pythonInfo - Python installation info
   * @returns {boolean} True if successful
   */
  ensurePip(pythonInfo) {
    if (pythonInfo.hasPip) return true;

    try {
      execSync(`"${pythonInfo.path}" -m ensurepip --default-pip`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      pythonInfo.hasPip = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed Python environment info
   * @param {Object} pythonInfo - Python installation info
   * @returns {Object} Detailed environment information
   */
  getEnvironmentInfo(pythonInfo) {
    try {
      const script = `
import sys
import json
import platform
import sysconfig

info = {
    'version': sys.version,
    'version_info': list(sys.version_info),
    'platform': platform.platform(),
    'implementation': platform.python_implementation(),
    'prefix': sys.prefix,
    'executable': sys.executable,
    'paths': sysconfig.get_paths(),
    'pip_available': True
}

try:
    import pip
    info['pip_version'] = pip.__version__
except ImportError:
    info['pip_available'] = False
    info['pip_version'] = None

print(json.dumps(info))
`;

      const output = execSync(`"${pythonInfo.path}" -c "${script}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return JSON.parse(output);
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
const pythonDetector = new PythonDetector();

module.exports = {
  PythonDetector,
  pythonDetector
};