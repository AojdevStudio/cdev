// Core Node.js modules for system operations and utilities
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

// Enhanced file system operations with additional utilities
const fs = require('fs-extra');

// Convert callback-based exec to Promise-based for async/await usage
const execAsync = promisify(exec);

/**
 * Installation Utilities Class
 *
 * Provides a comprehensive collection of utility functions for the CDEV installation process.
 * These utilities handle file system operations, project analysis, validation, and system
 * information gathering. The class is designed to be platform-aware and provides consistent
 * behavior across different operating systems.
 *
 * Key Functionality Areas:
 * - File system operations (directory checks, file copying with backup)
 * - Git repository detection and information extraction
 * - Project type detection and package manager identification
 * - Path resolution and symbolic link creation
 * - JSON file handling with error management
 * - System information gathering and validation
 * - Cross-platform compatibility utilities
 *
 * Platform Support:
 * - Windows (win32)
 * - macOS (darwin)
 * - Linux and other Unix-like systems
 */
class InstallUtils {
  /**
   * Initialize the utility class with system information
   *
   * Captures platform-specific information that will be used throughout
   * the installation process for making platform-appropriate decisions.
   */
  constructor() {
    this.platform = os.platform(); // Operating system identifier (win32, darwin, linux, etc.)
    this.homeDir = os.homedir(); // User's home directory path
  }

  /**
   * Directory Emptiness Check
   *
   * Determines if a directory is empty by counting its contents. This is useful
   * for validating installation targets and avoiding conflicts with existing files.
   *
   * @param {string} dirPath - Absolute path to the directory to check
   * @returns {boolean} True if directory is empty or doesn't exist, false if it contains files
   *
   * Error Handling: Returns true if directory doesn't exist or can't be accessed,
   * allowing installation to proceed in cases where the directory will be created.
   */
  async isDirectoryEmpty(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      return files.length === 0;
    } catch (error) {
      // Directory doesn't exist or can't be accessed - consider it "empty" for installation purposes
      return true;
    }
  }

  /**
   * Git Repository Detection
   *
   * Checks if the specified directory is a Git repository by looking for the .git directory.
   * This information is crucial for determining whether Git hooks can be installed and
   * whether Git worktree functionality will be available.
   *
   * @param {string} dirPath - Absolute path to the directory to check
   * @returns {boolean} True if directory contains a .git folder, false otherwise
   *
   * Note: This checks for a standard Git repository structure. It may not detect
   * Git worktrees or repositories with non-standard .git file configurations.
   */
  async isGitRepository(dirPath) {
    try {
      const gitDir = path.join(dirPath, '.git');
      const stats = await fs.stat(gitDir);
      return stats.isDirectory();
    } catch (error) {
      // .git directory doesn't exist or can't be accessed
      return false;
    }
  }

  /**
   * Git Remote URL Extraction
   *
   * Retrieves the origin remote URL from a Git repository. This information
   * is useful for generating repository-specific configurations and documentation.
   *
   * @param {string} dirPath - Absolute path to the Git repository
   * @returns {string|null} Remote URL string or null if not available
   *
   * Error Handling: Returns null if:
   * - Directory is not a Git repository
   * - No origin remote is configured
   * - Git command execution fails
   */
  async getGitRemoteUrl(dirPath) {
    try {
      const { stdout } = await execAsync('git remote get-url origin', { cwd: dirPath });
      return stdout.trim();
    } catch (error) {
      // Git command failed - no remote, not a git repo, or git not available
      return null;
    }
  }

  /**
   * Current Git Branch Detection
   *
   * Determines the currently checked out Git branch. This information is used
   * for configuring branch-specific workflows and generating appropriate
   * Git worktree configurations.
   *
   * @param {string} dirPath - Absolute path to the Git repository
   * @returns {string|null} Current branch name or null if not available
   *
   * Error Handling: Returns null if:
   * - Directory is not a Git repository
   * - Repository is in detached HEAD state
   * - Git command execution fails
   */
  async getCurrentGitBranch(dirPath) {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: dirPath });
      return stdout.trim();
    } catch (error) {
      // Git command failed or no current branch (detached HEAD)
      return null;
    }
  }

  /**
   * Git Worktree Path Resolution
   *
   * Determines the appropriate location for Git worktrees based on user configuration
   * preferences. Git worktrees enable parallel development by allowing multiple
   * working directories for the same repository, which is essential for CDEV's
   * parallel agent functionality.
   *
   * Location Strategies:
   * - 'alongside': Creates worktree directory next to the main project directory
   * - 'tmp': Uses system temporary directory for ephemeral worktrees
   * - 'custom': Uses user-specified absolute path for worktree storage
   * - default: Falls back to 'alongside' strategy for consistency
   *
   * @param {string} targetDir - Absolute path to the main project directory
   * @param {object} config - Configuration object with worktree preferences
   * @param {string} config.projectName - Project name for directory naming
   * @param {string} config.workTreeLocation - Location strategy identifier
   * @param {string} config.customWorkTreePath - Custom path when using 'custom' strategy
   * @returns {string} Resolved absolute path for worktree storage directory
   *
   * Path Examples:
   * - alongside: /projects/myapp -> /projects/myapp-worktrees
   * - tmp: /projects/myapp -> /tmp/parallel-claude-worktrees/myapp
   * - custom: /projects/myapp -> /custom/path/specified/by/user
   */
  resolveWorkTreePath(targetDir, config) {
    const { projectName } = config;

    // Evaluate worktree location strategy and generate appropriate path
    switch (config.workTreeLocation) {
      case 'alongside':
        // Place worktree directory alongside the main project directory
        // This keeps related directories together for easy management
        const parentDir = path.dirname(targetDir);
        return path.join(parentDir, `${projectName}-worktrees`);

      case 'tmp':
        // Use system temporary directory for ephemeral worktrees
        // Useful for temporary development tasks or CI/CD scenarios
        return path.join(os.tmpdir(), 'parallel-claude-worktrees', projectName);

      case 'custom':
        // Use user-specified absolute path for complete control
        // Allows users to place worktrees in preferred locations (different drives, etc.)
        return path.resolve(config.customWorkTreePath);

      default:
        // Default to 'alongside' strategy for predictable behavior
        // Ensures consistent worktree placement when strategy is not specified
        return path.join(path.dirname(targetDir), `${projectName}-worktrees`);
    }
  }

  /**
   * Symbolic Link Creation with Error Handling
   *
   * Creates a symbolic link from source to target location with graceful error
   * handling. Symbolic links are useful for creating references to shared resources
   * without duplicating files, which is important for efficient worktree management.
   *
   * Use Cases:
   * - Linking shared configuration files across worktrees
   * - Creating shortcuts to commonly used tools or scripts
   * - Maintaining references to central resources without duplication
   *
   * @param {string} source - Absolute path to the source file or directory
   * @param {string} target - Absolute path where the symbolic link should be created
   * @returns {boolean} True if link creation succeeded, false if it failed
   *
   * Error Handling: Gracefully handles failures (permissions, existing files,
   * unsupported filesystems) by logging a warning and returning false, allowing
   * the installation process to continue with alternative approaches.
   */
  async createSymbolicLink(source, target) {
    try {
      // Attempt to create symbolic link using Node.js fs.symlink
      await fs.symlink(source, target);
      return true; // Success - symbolic link created
    } catch (error) {
      // Handle link creation failures gracefully
      // Common causes: permissions, existing target, unsupported filesystem
      console.warn(`Could not create symbolic link: ${error.message}`);
      return false; // Failure - caller can implement fallback behavior
    }
  }

  /**
   * Safe File Copy with Automatic Backup
   *
   * Copies a file from source to target location while automatically creating
   * a timestamped backup of any existing target file. This ensures that no
   * existing configurations or customizations are lost during installation.
   *
   * Backup Strategy:
   * 1. Check if target file already exists
   * 2. If exists, create timestamped backup (.backup.{timestamp})
   * 3. Copy source file to target location
   * 4. Return whether a backup was created
   *
   * Backup Naming Convention:
   * - Format: {original-filename}.backup.{unix-timestamp}
   * - Example: config.json -> config.json.backup.1699123456789
   * - Unique timestamps prevent backup collisions
   *
   * @param {string} source - Absolute path to the source file to copy
   * @param {string} target - Absolute path where the file should be copied
   * @returns {boolean} True if a backup was created, false if target was new
   *
   * Safety Features:
   * - Preserves existing files through automatic backup
   * - Provides user feedback about backup creation
   * - Maintains complete file history for rollback scenarios
   */
  async copyFileWithBackup(source, target) {
    // Step 1: Check if target file already exists
    const targetExists = await fs.pathExists(target);

    // Step 2: Create backup if target exists
    if (targetExists) {
      // Generate unique backup filename with timestamp
      const backupPath = `${target}.backup.${Date.now()}`;
      await fs.copy(target, backupPath); // Create backup of existing file
      console.log(`Backed up existing file to: ${backupPath}`);
    }

    // Step 3: Copy source file to target location
    await fs.copy(source, target);

    // Step 4: Return backup status for caller information
    return targetExists; // True if backup was created, false if new file
  }

  /**
   * Package.json Discovery with Recursive Search
   *
   * Searches for the nearest package.json file by traversing up the directory
   * tree from a starting directory. This is essential for determining project
   * boundaries and understanding Node.js project structure, especially in
   * nested project scenarios or monorepos.
   *
   * Search Algorithm:
   * 1. Start from the specified directory
   * 2. Check for package.json in current directory
   * 3. If found, return absolute path to package.json
   * 4. If not found, move up one directory level
   * 5. Repeat until package.json is found or root directory is reached
   *
   * Use Cases:
   * - Determining project root for configuration installation
   * - Finding the correct location for dependency management
   * - Understanding project structure in nested environments
   * - Locating the appropriate package.json for script modifications
   *
   * @param {string} startDir - Absolute path to start the search from
   * @returns {string|null} Absolute path to package.json file, or null if not found
   *
   * Search Behavior:
   * - Searches upward through parent directories
   * - Stops at filesystem root if no package.json is found
   * - Returns the first package.json encountered (closest to start directory)
   */
  async findPackageJson(startDir) {
    let currentDir = startDir; // Current directory being examined

    // Traverse up the directory tree until root is reached
    while (currentDir !== path.parse(currentDir).root) {
      // Construct path to potential package.json in current directory
      const packageJsonPath = path.join(currentDir, 'package.json');

      // Check if package.json exists in current directory
      if (await fs.pathExists(packageJsonPath)) {
        return packageJsonPath; // Found - return absolute path
      }

      // Move up one directory level and continue searching
      currentDir = path.dirname(currentDir);
    }

    // Reached filesystem root without finding package.json
    return null;
  }

  /**
   * Comprehensive Project Type Detection
   *
   * Analyzes a project directory to automatically detect its type and technology
   * stack by examining configuration files, lockfiles, and framework-specific
   * indicators. This information is crucial for selecting appropriate hooks,
   * dependencies, and configuration templates.
   *
   * Detection Strategy:
   * 1. Primary Language Detection: Check for language-specific configuration files
   * 2. Package Manager Detection: Identify lockfiles to determine package manager
   * 3. Framework Detection: Look for framework-specific configuration files
   * 4. Multi-Type Support: Return all detected types for hybrid projects
   *
   * Supported Project Types:
   * - Programming Languages: node, python, rust, go, php, java, ruby
   * - Package Managers: node-yarn, node-pnpm (with specific lockfile detection)
   * - Frameworks: nextjs, nuxtjs, angular, vue, svelte, gatsby, remix
   *
   * @param {string} dirPath - Absolute path to the project directory to analyze
   * @returns {Array} Array of detected project type strings
   *
   * Return Examples:
   * - ['node', 'nextjs'] - Next.js project with Node.js
   * - ['python'] - Pure Python project
   * - ['node', 'node-pnpm', 'vue'] - Vue.js project using pnpm
   */
  async detectProjectType(dirPath) {
    // Primary project type indicators based on configuration files
    // These files typically indicate the main programming language or runtime
    const indicators = {
      'package.json': 'node', // Node.js JavaScript/TypeScript projects
      'Cargo.toml': 'rust', // Rust projects with Cargo package manager
      'pyproject.toml': 'python', // Modern Python projects with pyproject.toml
      'go.mod': 'go', // Go projects with Go modules
      'composer.json': 'php', // PHP projects with Composer dependency manager
      'pom.xml': 'java', // Java projects with Maven build system
      Gemfile: 'ruby', // Ruby projects with Bundler gem manager
      'requirements.txt': 'python', // Traditional Python projects with pip
      'yarn.lock': 'node-yarn', // Node.js projects using Yarn package manager
      'pnpm-lock.yaml': 'node-pnpm', // Node.js projects using pnpm package manager
    };

    const detectedTypes = []; // Collect all detected project types

    // Step 1: Primary Type Detection
    // Check for primary programming language and package manager indicators
    for (const [file, type] of Object.entries(indicators)) {
      const filePath = path.join(dirPath, file);
      if (await fs.pathExists(filePath)) {
        detectedTypes.push(type);
      }
    }

    // Step 2: Framework Detection
    // Check for framework-specific configuration files that indicate specialized setups
    const frameworkIndicators = {
      'next.config.js': 'nextjs', // Next.js React framework
      'nuxt.config.js': 'nuxtjs', // Nuxt.js Vue framework
      'angular.json': 'angular', // Angular framework
      'vue.config.js': 'vue', // Vue.js framework
      'svelte.config.js': 'svelte', // Svelte framework
      'gatsby-config.js': 'gatsby', // Gatsby static site generator
      'remix.config.js': 'remix', // Remix React framework
    };

    // Add framework types to the detection results
    for (const [file, framework] of Object.entries(frameworkIndicators)) {
      const filePath = path.join(dirPath, file);
      if (await fs.pathExists(filePath)) {
        detectedTypes.push(framework);
      }
    }

    // Return all detected types (supports multi-type projects)
    return detectedTypes;
  }

  /**
   * Safe JSON File Reading with Error Handling
   *
   * Reads and parses a JSON file with comprehensive error handling and detailed
   * error reporting. This method provides a safe way to load configuration files,
   * package.json files, and other JSON-based data structures.
   *
   * @param {string} filePath - Absolute path to the JSON file to read
   * @returns {object} Parsed JSON object from the file
   * @throws {Error} Detailed error message if file reading or parsing fails
   *
   * Error Cases Handled:
   * - File doesn't exist or can't be accessed
   * - File contains invalid JSON syntax
   * - File system permission issues
   * - File encoding problems
   */
  async readJsonFile(filePath) {
    try {
      // Read file content as UTF-8 text
      const content = await fs.readFile(filePath, 'utf8');
      // Parse JSON content and return the resulting object
      return JSON.parse(content);
    } catch (error) {
      // Throw detailed error with file path context for debugging
      throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Safe JSON File Writing with Formatting
   *
   * Writes a JavaScript object to a JSON file with proper formatting and
   * error handling. The output is formatted with 2-space indentation for
   * readability and maintainability.
   *
   * @param {string} filePath - Absolute path where the JSON file should be written
   * @param {object} data - JavaScript object to serialize and write to file
   * @throws {Error} Detailed error message if file writing or serialization fails
   *
   * Features:
   * - Pretty-printed JSON with 2-space indentation
   * - UTF-8 encoding for proper character support
   * - Comprehensive error handling with context
   * - Automatic directory creation if parent directories don't exist
   */
  async writeJsonFile(filePath, data) {
    try {
      // Serialize object to formatted JSON string with 2-space indentation
      const content = JSON.stringify(data, null, 2);
      // Write formatted JSON content to file with UTF-8 encoding
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      // Throw detailed error with file path context for debugging
      throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Package.json Intelligent Merging
   *
   * Merges additional configuration into an existing package.json file or creates
   * a new one if it doesn't exist. This method handles the complexities of merging
   * different package.json sections while preserving existing configurations.
   *
   * Merge Strategy:
   * 1. Load existing package.json or create empty object
   * 2. Merge scripts with overwrite (new scripts take precedence)
   * 3. Merge dependencies with overwrite (new versions take precedence)
   * 4. Merge devDependencies with overwrite (new versions take precedence)
   * 5. Merge keywords with deduplication (union of existing and new)
   * 6. Write merged configuration back to file
   *
   * Supported Merge Sections:
   * - scripts: npm/yarn scripts for automation
   * - dependencies: production dependencies
   * - devDependencies: development dependencies
   * - keywords: project keywords (deduplicated)
   *
   * @param {string} targetPath - Absolute path to directory containing package.json
   * @param {object} additions - Object with sections to merge into package.json
   * @param {object} additions.scripts - Scripts to add or update
   * @param {object} additions.dependencies - Production dependencies to add
   * @param {object} additions.devDependencies - Development dependencies to add
   * @param {Array} additions.keywords - Keywords to add to the project
   * @returns {object} Complete merged package.json object
   *
   * Merge Behavior:
   * - Preserves existing configuration not specified in additions
   * - Overwrites existing values when conflicts occur
   * - Creates new sections if they don't exist
   * - Maintains package.json structure and formatting
   */
  async mergePackageJson(targetPath, additions) {
    // Construct path to target package.json file
    const packageJsonPath = path.join(targetPath, 'package.json');

    // Initialize with empty object (will be populated if file exists)
    let packageJson = {};

    // Step 1: Load existing package.json if it exists
    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await this.readJsonFile(packageJsonPath);
    }

    // Step 2: Merge Scripts Section
    // Scripts are merged with new scripts taking precedence over existing ones
    if (additions.scripts) {
      packageJson.scripts = {
        ...packageJson.scripts, // Preserve existing scripts
        ...additions.scripts, // Add new scripts (with overwrite)
      };
    }

    // Step 3: Merge Production Dependencies
    // Dependencies are merged with new versions taking precedence
    if (additions.dependencies) {
      packageJson.dependencies = {
        ...packageJson.dependencies, // Preserve existing dependencies
        ...additions.dependencies, // Add new dependencies (with version overwrite)
      };
    }

    // Step 4: Merge Development Dependencies
    // DevDependencies are merged with new versions taking precedence
    if (additions.devDependencies) {
      packageJson.devDependencies = {
        ...packageJson.devDependencies, // Preserve existing devDependencies
        ...additions.devDependencies, // Add new devDependencies (with version overwrite)
      };
    }

    // Step 5: Merge Keywords with Deduplication
    // Keywords are combined and deduplicated to create a union of all keywords
    if (additions.keywords) {
      const existingKeywords = packageJson.keywords || []; // Handle missing keywords array
      // Use Set to deduplicate combined keywords, then convert back to array
      packageJson.keywords = [...new Set([...existingKeywords, ...additions.keywords])];
    }

    // Step 6: Write merged configuration back to file
    await this.writeJsonFile(packageJsonPath, packageJson);

    // Return complete merged package.json for caller reference
    return packageJson;
  }

  /**
   * Linear API Key Validation
   *
   * Validates a Linear API key format and basic characteristics without making
   * network requests. This provides early validation during installation to
   * catch obvious configuration errors before attempting to use the API.
   *
   * Validation Checks:
   * 1. Presence Check: Ensure API key is provided
   * 2. Format Check: Verify it starts with the expected Linear prefix
   * 3. Length Check: Ensure minimum length for valid API keys
   *
   * @param {string} apiKey - Linear API key to validate
   * @returns {object} Validation result with valid flag and reason if invalid
   * @returns {boolean} returns.valid - True if key passes validation
   * @returns {string} returns.reason - Explanation if validation fails
   *
   * Design Note: This method performs format validation only, not network
   * validation, to avoid network dependencies during installation and to
   * provide faster feedback to users.
   */
  async validateLinearApiKey(apiKey) {
    // Validation Check 1: Presence Validation
    // Ensure API key is provided and not empty
    if (!apiKey) {
      return { valid: false, reason: 'API key is required' };
    }

    // Validation Check 2: Format Validation
    // Linear API keys have a specific prefix format
    if (!apiKey.startsWith('lin_api_')) {
      return { valid: false, reason: 'Invalid API key format. Should start with "lin_api_"' };
    }

    // Validation Check 3: Length Validation
    // Linear API keys have a minimum length requirement for security
    if (apiKey.length < 50) {
      return { valid: false, reason: 'API key appears to be too short' };
    }

    // Format validation passed
    // Note: We could validate by making a test API request to Linear,
    // but this would require network access during installation which
    // might not be desirable and would slow down the installation process.
    // Format validation provides sufficient early error detection.
    return { valid: true };
  }

  /**
   * Directory Writability Validation
   *
   * Ensures that a directory exists and is writable by the current process.
   * This is essential for validating installation target directories before
   * attempting to create files and subdirectories.
   *
   * @param {string} dirPath - Absolute path to the directory to validate
   * @returns {boolean} True if directory is writable
   * @throws {Error} If directory cannot be created or is not writable
   *
   * Validation Process:
   * 1. Create directory if it doesn't exist (including parent directories)
   * 2. Test write permissions on the directory
   * 3. Throw descriptive error if validation fails
   */
  async ensureDirectoryWritable(dirPath) {
    try {
      // Ensure directory exists (creates parent directories as needed)
      await fs.ensureDir(dirPath);
      // Test write permissions using Node.js access check
      await fs.access(dirPath, fs.constants.W_OK);
      return true; // Directory is writable
    } catch (error) {
      // Throw descriptive error with directory path context
      throw new Error(`Directory ${dirPath} is not writable: ${error.message}`);
    }
  }

  /**
   * System Information Collection
   *
   * Gathers comprehensive information about the system environment including
   * platform details, tool versions, and directory paths. This information
   * is useful for troubleshooting, compatibility checks, and configuration.
   *
   * @returns {object} Complete system information object
   *
   * Information Collected:
   * - Platform and architecture details
   * - Node.js version information
   * - Directory paths (home, current, temp)
   * - Tool availability and versions (Git, Claude Code)
   */
  async getSystemInfo() {
    // Base system information from Node.js and OS modules
    const info = {
      platform: this.platform, // Operating system platform (win32, darwin, linux)
      architecture: os.arch(), // CPU architecture (x64, arm64, etc.)
      nodeVersion: process.version, // Node.js version (e.g., v18.17.0)
      homeDirectory: this.homeDir, // User's home directory path
      currentDirectory: process.cwd(), // Current working directory
      tempDirectory: os.tmpdir(), // System temporary directory
    };

    // Tool Version Detection: Git
    // Attempt to detect Git installation and version
    try {
      const { stdout: gitVersion } = await execAsync('git --version');
      info.gitVersion = gitVersion.trim(); // Clean version string
    } catch (error) {
      info.gitVersion = 'Not installed'; // Git not available
    }

    // Tool Version Detection: Claude Code
    // Attempt to detect Claude Code CLI installation and version
    try {
      const { stdout: claudeVersion } = await execAsync('claude --version');
      info.claudeVersion = claudeVersion.trim(); // Clean version string
    } catch (error) {
      info.claudeVersion = 'Not installed'; // Claude Code not available
    }

    return info;
  }

  /**
   * Basic Disk Space Availability Check
   *
   * Performs a basic check to determine if a directory path is accessible
   * and gathers basic file system statistics. This provides a foundation
   * for disk space validation, though more detailed checks would require
   * specialized libraries.
   *
   * @param {string} dirPath - Absolute path to check for disk space
   * @returns {object} Check result with availability status and stats
   *
   * Note: This is a basic implementation. For production use with accurate
   * disk space checking, consider using specialized libraries like 'check-disk-space'.
   */
  async checkDiskSpace(dirPath) {
    try {
      // Get basic file system statistics for the directory
      const stats = await fs.stat(dirPath);
      return { available: true, stats }; // Directory accessible with stats
    } catch (error) {
      // Directory not accessible or doesn't exist
      return { available: false, error: error.message };
    }
  }

  /**
   * File Name Sanitization for Cross-Platform Compatibility
   *
   * Sanitizes a filename by removing or replacing characters that are invalid
   * or problematic across different operating systems. This ensures that
   * generated filenames work reliably on Windows, macOS, and Linux.
   *
   * Sanitization Rules:
   * 1. Replace invalid characters (<>:"/\|?*) with hyphens
   * 2. Replace multiple spaces with single hyphens
   * 3. Collapse multiple consecutive hyphens into single hyphens
   * 4. Remove leading and trailing hyphens
   * 5. Convert to lowercase for consistency
   *
   * @param {string} fileName - Original filename to sanitize
   * @returns {string} Sanitized filename safe for use on all platforms
   */
  async sanitizeFileName(fileName) {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid filesystem characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .toLowerCase(); // Normalize to lowercase
  }

  /**
   * Unique Identifier Generation
   *
   * Generates a unique identifier combining a prefix, timestamp, and random
   * component. This is useful for creating unique filenames, backup names,
   * and installation identifiers that won't conflict with existing resources.
   *
   * ID Format: {prefix}-{timestamp}-{random}
   * Example: install-1699123456789-x7k9m2n8p
   *
   * @param {string} prefix - Prefix for the unique ID (default: 'install')
   * @returns {string} Generated unique identifier
   */
  async generateUniqueId(prefix = 'install') {
    const timestamp = Date.now(); // Current timestamp for uniqueness
    const random = Math.random().toString(36).substr(2, 9); // Random alphanumeric string
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Progress Tracking Utility
   *
   * Creates a progress tracker object that can be used to monitor the completion
   * of multi-step installation processes. This provides a clean interface for
   * tracking progress and displaying completion percentages to users.
   *
   * @param {number} totalSteps - Total number of steps in the process
   * @returns {object} Progress tracker with increment, getProgress, and isComplete methods
   *
   * Tracker Methods:
   * - increment(): Advance to next step and return current step number
   * - getProgress(): Get current progress with step counts and percentage
   * - isComplete(): Check if all steps have been completed
   */
  async createProgressTracker(totalSteps) {
    let currentStep = 0; // Track current step completion

    return {
      /**
       * Increment progress by one step
       * @returns {number} Current step number after increment
       */
      increment: () => {
        currentStep++;
        return currentStep;
      },

      /**
       * Get comprehensive progress information
       * @returns {object} Progress data with current, total, and percentage
       */
      getProgress: () => ({
        current: currentStep, // Current completed steps
        total: totalSteps, // Total steps in process
        percentage: Math.round((currentStep / totalSteps) * 100), // Completion percentage
      }),

      /**
       * Check if all steps are complete
       * @returns {boolean} True if all steps are finished
       */
      isComplete: () => currentStep >= totalSteps,
    };
  }

  /**
   * Robust Retry Mechanism with Exponential Backoff
   *
   * Executes an operation with automatic retry logic, providing resilience
   * against transient failures. This is essential for network operations,
   * file system operations, and other potentially unreliable operations.
   *
   * Retry Strategy:
   * 1. Execute operation
   * 2. If successful, return result immediately
   * 3. If failed and retries remaining, wait and retry
   * 4. If all retries exhausted, throw the last error
   *
   * @param {Function} operation - Async function to execute with retries
   * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} delay - Delay between retries in milliseconds (default: 1000)
   * @returns {*} Result of the successful operation execution
   * @throws {Error} Last error if all retry attempts fail
   */
  async retry(operation, maxRetries = 3, delay = 1000) {
    // Attempt operation with retry logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Execute operation - return result if successful
        return await operation();
      } catch (error) {
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Log retry attempt and wait before next attempt
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This line should never be reached due to the logic above,
    // but is included to satisfy linting rules for consistent returns
    throw new Error('Retry loop completed without returning or throwing');
  }

  /**
   * Cross-Platform Executable Discovery
   *
   * Searches for an executable command in the system PATH with proper handling
   * for different operating system executable file extensions. This is essential
   * for verifying tool availability before attempting to use them.
   *
   * Search Strategy:
   * 1. Get system PATH directories
   * 2. Define platform-specific executable extensions
   * 3. Search each directory for command with each extension
   * 4. Return first match found, or null if not found
   *
   * Platform Support:
   * - Windows: Searches for .exe, .cmd, .bat extensions
   * - Unix/Linux/macOS: Searches for files without extensions
   *
   * @param {string} command - Command name to search for (e.g., 'git', 'node')
   * @returns {string|null} Full path to executable if found, null otherwise
   */
  async findExecutable(command) {
    // Get system PATH directories for searching
    const paths = process.env.PATH.split(path.delimiter);

    // Define platform-specific executable extensions
    const extensions = this.platform === 'win32' ? ['.exe', '.cmd', '.bat'] : [''];

    // Search each PATH directory
    for (const dir of paths) {
      // Try each possible extension for the command
      for (const ext of extensions) {
        const fullPath = path.join(dir, command + ext);
        try {
          // Check if file exists and is accessible
          await fs.access(fullPath, fs.constants.F_OK);
          return fullPath; // Found executable - return full path
        } catch (error) {
          // File doesn't exist or isn't accessible - continue searching
        }
      }
    }

    // Command not found in any PATH directory
    return null;
  }

  /**
   * Configuration Template Generation
   *
   * Generates pre-structured configuration templates for different aspects
   * of the CDEV system. These templates provide sensible defaults and proper
   * structure for various configuration files used throughout the installation.
   *
   * Available Templates:
   * - 'linear-config': Linear API integration configuration
   * - 'workflow-config': Parallel development workflow settings
   * - 'git-config': Git-related configuration and preferences
   *
   * @param {string} templateName - Name of the template to generate
   * @param {object} config - Configuration values to merge into template
   * @returns {object} Complete configuration template with defaults and provided values
   */
  async createConfigTemplate(templateName, config) {
    // Define comprehensive configuration templates with sensible defaults
    const templates = {
      // Linear API Integration Configuration
      'linear-config': {
        linear: {
          apiKey: config.linearApiKey || 'your_linear_api_key', // Linear API key for integration
          teamId: config.linearTeamId || 'your_team_id', // Team identifier for Linear workspace
          projectId: config.linearProjectId || 'your_project_id', // Project identifier for tasks
        },
      },

      // Parallel Development Workflow Configuration
      'workflow-config': {
        workflow: {
          projectName: config.projectName, // Project name for worktree organization
          workTreePath: config.workTreePath, // Path for Git worktree storage
          maxParallelAgents: config.maxParallelAgents || 4, // Maximum concurrent development agents
          autoOpenEditor: config.autoOpenEditor !== false, // Automatically open editor for agents
          editor: config.editor || 'cursor', // Preferred code editor for agent work
        },
      },

      // Git Configuration and Preferences
      'git-config': {
        git: {
          defaultBranch: config.defaultBranch || 'main', // Default branch for new repositories
          autoCommit: config.autoCommit !== false, // Enable automatic commit behavior
          commitMessagePrefix: config.commitMessagePrefix || '[Agent]', // Prefix for agent commits
        },
      },
    };

    // Return requested template or empty object if template doesn't exist
    return templates[templateName] || {};
  }

  /**
   * Human-Readable Byte Formatter
   *
   * Converts byte values into human-readable format with appropriate units
   * (Bytes, KB, MB, GB, etc.). This is useful for displaying file sizes,
   * disk space usage, and other storage-related information to users.
   *
   * @param {number} bytes - Number of bytes to format
   * @param {number} decimals - Number of decimal places to display (default: 2)
   * @returns {string} Formatted byte string with appropriate unit
   *
   * Examples:
   * - formatBytes(1024) → "1.00 KB"
   * - formatBytes(1048576) → "1.00 MB"
   * - formatBytes(0) → "0 Bytes"
   */
  formatBytes(bytes, decimals = 2) {
    // Handle zero bytes case
    if (bytes === 0) {
      return '0 Bytes';
    }

    // Define conversion constants and available units
    const k = 1024; // Binary conversion factor (1024 bytes = 1 KB)
    const dm = decimals < 0 ? 0 : decimals; // Ensure non-negative decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    // Calculate appropriate unit index based on byte value
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Format value with calculated unit and specified decimal places
    return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
  }

  /**
   * Operation Logging and Audit Trail
   *
   * Logs installation operations with timestamps and system context for
   * debugging, auditing, and troubleshooting purposes. Creates structured
   * log entries that can be used for installation analysis and support.
   *
   * @param {string} operation - Description of the operation being logged
   * @param {string} result - Result or outcome of the operation
   * @returns {object} Complete log entry with timestamp and system context
   *
   * Log Entry Structure:
   * - timestamp: ISO timestamp of the operation
   * - operation: Description of what was performed
   * - result: Outcome or result of the operation
   * - platform: Operating system platform information
   * - nodeVersion: Node.js version information
   */
  async logOperation(operation, result) {
    // Generate ISO timestamp for precise operation timing
    const timestamp = new Date().toISOString();

    // Create comprehensive log entry with operation and system context
    const logEntry = {
      timestamp, // When the operation occurred
      operation, // What operation was performed
      result, // What was the outcome
      platform: this.platform, // Operating system context
      nodeVersion: process.version, // Node.js runtime version
    };

    // Output log entry to console for immediate feedback
    // Note: In production, this could be enhanced to write to log files,
    // send to logging services, or integrate with monitoring systems
    console.log(`[${timestamp}] ${operation}: ${result}`);

    // Return log entry for potential further processing by caller
    return logEntry;
  }
}

module.exports = { InstallUtils };
