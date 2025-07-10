/**
 * Cross-platform path resolution utilities
 * Handles path normalization across Windows, macOS, and Linux
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

class PathResolver {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isMacOS = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
  }

  /**
   * Normalize a path for the current platform
   * @param {string} inputPath - Path to normalize
   * @returns {string} Normalized path
   */
  normalizePath(inputPath) {
    if (!inputPath) return '';
    
    // Replace forward slashes with backslashes on Windows
    if (this.isWindows) {
      inputPath = inputPath.replace(/\//g, '\\');
    } else {
      // Replace backslashes with forward slashes on Unix-like systems
      inputPath = inputPath.replace(/\\/g, '/');
    }
    
    return path.normalize(inputPath);
  }

  /**
   * Resolve a path relative to the home directory
   * @param {string} relativePath - Path relative to home
   * @returns {string} Absolute path
   */
  resolveHome(relativePath) {
    if (!relativePath) return os.homedir();
    
    // Handle ~ prefix
    if (relativePath.startsWith('~')) {
      relativePath = relativePath.substring(1);
      if (relativePath.startsWith(path.sep) || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
        relativePath = relativePath.substring(1);
      }
    }
    
    return path.join(os.homedir(), relativePath);
  }

  /**
   * Get the appropriate directory for user-specific configuration
   * @param {string} appName - Application name
   * @returns {string} Configuration directory path
   */
  getConfigDir(appName) {
    if (this.isWindows) {
      // Windows: %APPDATA%\appName
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName);
    } else if (this.isMacOS) {
      // macOS: ~/Library/Application Support/appName
      return path.join(os.homedir(), 'Library', 'Application Support', appName);
    } else {
      // Linux/Unix: ~/.config/appName
      const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
      return path.join(xdgConfig, appName);
    }
  }

  /**
   * Get the appropriate directory for user-specific data
   * @param {string} appName - Application name
   * @returns {string} Data directory path
   */
  getDataDir(appName) {
    if (this.isWindows) {
      // Windows: %LOCALAPPDATA%\appName
      return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), appName);
    } else if (this.isMacOS) {
      // macOS: ~/Library/Application Support/appName
      return this.getConfigDir(appName);
    } else {
      // Linux/Unix: ~/.local/share/appName
      const xdgData = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
      return path.join(xdgData, appName);
    }
  }

  /**
   * Get the appropriate directory for temporary files
   * @param {string} appName - Application name
   * @returns {string} Temp directory path
   */
  getTempDir(appName) {
    const tempBase = os.tmpdir();
    return path.join(tempBase, appName);
  }

  /**
   * Ensure a directory exists, creating it if necessary
   * @param {string} dirPath - Directory path
   * @returns {boolean} True if directory exists or was created
   */
  ensureDir(dirPath) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return true;
    } catch (error) {
      if (error.code === 'EEXIST') {
        return true;
      }
      throw error;
    }
  }

  /**
   * Check if a path is absolute
   * @param {string} inputPath - Path to check
   * @returns {boolean} True if path is absolute
   */
  isAbsolute(inputPath) {
    return path.isAbsolute(inputPath);
  }

  /**
   * Join multiple path segments
   * @param {...string} segments - Path segments
   * @returns {string} Joined path
   */
  join(...segments) {
    return path.join(...segments);
  }

  /**
   * Resolve path segments into an absolute path
   * @param {...string} segments - Path segments
   * @returns {string} Resolved absolute path
   */
  resolve(...segments) {
    return path.resolve(...segments);
  }

  /**
   * Get the directory name of a path
   * @param {string} inputPath - Path
   * @returns {string} Directory name
   */
  dirname(inputPath) {
    return path.dirname(inputPath);
  }

  /**
   * Get the base name of a path
   * @param {string} inputPath - Path
   * @param {string} ext - Extension to remove
   * @returns {string} Base name
   */
  basename(inputPath, ext) {
    return path.basename(inputPath, ext);
  }

  /**
   * Get the extension of a path
   * @param {string} inputPath - Path
   * @returns {string} Extension including the dot
   */
  extname(inputPath) {
    return path.extname(inputPath);
  }

  /**
   * Convert a path to use forward slashes (for URLs and cross-platform compatibility)
   * @param {string} inputPath - Path to convert
   * @returns {string} Path with forward slashes
   */
  toPosixPath(inputPath) {
    if (!inputPath) return '';
    return inputPath.split(path.sep).join('/');
  }

  /**
   * Convert a path to use the platform's native separators
   * @param {string} inputPath - Path to convert
   * @returns {string} Path with native separators
   */
  toNativePath(inputPath) {
    if (!inputPath) return '';
    if (this.isWindows) {
      return inputPath.replace(/\//g, '\\');
    }
    return inputPath.replace(/\\/g, '/');
  }

  /**
   * Get platform-specific environment variable paths
   * @returns {Array<string>} Array of paths from PATH/Path environment variable
   */
  getEnvPaths() {
    const pathVar = process.env.PATH || process.env.Path || '';
    const separator = this.isWindows ? ';' : ':';
    return pathVar.split(separator).filter(p => p.length > 0);
  }

  /**
   * Find executable in PATH
   * @param {string} executable - Executable name
   * @returns {string|null} Full path to executable or null if not found
   */
  findInPath(executable) {
    const paths = this.getEnvPaths();
    const extensions = this.isWindows ? ['.exe', '.cmd', '.bat', ''] : [''];
    
    for (const dir of paths) {
      for (const ext of extensions) {
        const fullPath = path.join(dir, executable + ext);
        try {
          fs.accessSync(fullPath, fs.constants.X_OK);
          return fullPath;
        } catch {
          // Continue searching
        }
      }
    }
    
    return null;
  }

  /**
   * Get platform information
   * @returns {Object} Platform details
   */
  getPlatformInfo() {
    return {
      platform: this.platform,
      isWindows: this.isWindows,
      isMacOS: this.isMacOS,
      isLinux: this.isLinux,
      arch: os.arch(),
      homeDir: os.homedir(),
      tempDir: os.tmpdir(),
      pathSeparator: path.sep,
      delimiter: path.delimiter
    };
  }
}

// Export singleton instance
const pathResolver = new PathResolver();

module.exports = {
  PathResolver,
  pathResolver
};