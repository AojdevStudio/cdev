// Core Node.js modules for file system operations and path handling
const path = require('path');

// External dependencies for enhanced CLI experience and user interaction
const chalk = require('chalk');
const inquirer = require('inquirer');

// Internal modules for installation workflow and utility functions
const { InstallSteps } = require('./install-steps');
const { InstallUtils } = require('./install-utils');

/**
 * Main Installer Class - Orchestrates the CDEV installation process
 *
 * This class serves as the central coordinator for installing the Claude Development (CDEV)
 * system into any project. It handles project type detection, interactive configuration,
 * and manages the complete installation workflow through distinct phases.
 *
 * The installer is designed to be flexible and robust, supporting various project types
 * including Node.js, Python, monorepos, and more. It provides both interactive and
 * programmatic installation modes for different use cases.
 *
 * Installation Architecture:
 * - Phase 1: Pre-installation validation (dependencies, permissions, environment)
 * - Phase 2: Interactive configuration (project settings, preferences)
 * - Phase 3: Core installation (files, templates, scripts)
 * - Phase 4: Post-installation setup (hooks, environment, examples)
 * - Phase 5: Success messaging and guidance
 */
class Installer {
  /**
   * Initialize the installer with configuration options
   *
   * @param {object} options - Installation configuration options
   * @param {boolean} options.skipPrompts - Skip interactive prompts for automated installation
   * @param {string} options.packageManager - Override package manager detection
   */
  constructor(options = {}) {
    this.options = options;
    this.steps = new InstallSteps(); // Handles individual installation steps
    this.utils = new InstallUtils(); // Provides utility functions for file operations
  }

  /**
   * Intelligent Project Type Detection
   *
   * Analyzes the project directory structure and configuration files to determine
   * the project type, framework, and build tools. This information is used to
   * customize the installation process and select appropriate hooks and templates.
   *
   * Detection Strategy:
   * 1. Check for Python project indicators first (requirements.txt, pyproject.toml, setup.py)
   * 2. Look for Node.js package.json and analyze dependencies
   * 3. Detect specific frameworks (Next.js, React, Express) based on dependencies and config files
   * 4. Identify monorepo structures (workspaces, turbo.json)
   * 5. Fall back to minimal setup if no clear indicators are found
   *
   * @param {string} projectPath - Absolute path to the project directory to analyze
   * @returns {object} Project type metadata with confidence scoring
   * @returns {string} returns.type - Project type (python, nextjs, react, nodejs, monorepo, minimal)
   * @returns {number} returns.confidence - Confidence score from 0.5 to 0.95
   * @returns {string} returns.runtime - Runtime environment (python, node)
   * @returns {string} returns.framework - Primary framework (flask, next, react, express)
   * @returns {string} returns.buildTool - Build tool used (next, vite, webpack)
   */
  detectProjectType(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const fs = require('fs');

    try {
      // Priority 1: Python Project Detection
      // Python projects are checked first as they don't use package.json
      // and may coexist with Node.js in some polyglot projects
      if (
        fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
        fs.existsSync(path.join(projectPath, 'pyproject.toml')) ||
        fs.existsSync(path.join(projectPath, 'setup.py'))
      ) {
        return {
          type: 'python',
          confidence: 0.9,
          runtime: 'python',
          framework: 'flask', // Default assumption, could be Django, FastAPI, etc.
        };
      }

      // Priority 2: Check for package.json existence
      // If no package.json exists, this is likely a minimal project or non-Node.js project
      if (!fs.existsSync(packageJsonPath)) {
        return {
          type: 'minimal',
          confidence: 0.8,
        };
      }

      // Priority 3: Parse package.json and analyze dependencies
      // Combine both dependencies and devDependencies for comprehensive analysis
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Priority 4: Framework-specific detection with high confidence
      // Next.js detection - check both dependency and config file for highest accuracy
      if (dependencies.next || fs.existsSync(path.join(projectPath, 'next.config.js'))) {
        return {
          type: 'nextjs',
          confidence: 0.95,
          framework: 'next',
          buildTool: 'next',
        };
      }

      // React with Vite detection - modern React setup
      if (dependencies.vite && dependencies.react) {
        return {
          type: 'react',
          confidence: 0.9,
          framework: 'react',
          buildTool: 'vite',
        };
      }

      // Priority 5: Monorepo detection
      // Check for workspace configuration or Turbo.js monorepo setup
      if (packageJson.workspaces || fs.existsSync(path.join(projectPath, 'turbo.json'))) {
        return {
          type: 'monorepo',
          confidence: 0.9,
          workspaces: true,
        };
      }

      // Priority 6: Backend framework detection
      // Common Node.js backend frameworks
      if (dependencies.express || dependencies.fastify || dependencies.koa) {
        return {
          type: 'nodejs',
          confidence: 0.85,
          runtime: 'node',
          framework: 'express', // Default to Express, most common
        };
      }

      // Priority 7: Default fallback for Node.js projects without clear framework
      return {
        type: 'minimal',
        confidence: 0.7,
      };
    } catch (error) {
      // Error handling: JSON parsing errors or file system access issues
      // Return minimal setup with low confidence to allow installation to proceed
      return {
        type: 'minimal',
        confidence: 0.5,
      };
    }
  }

  /**
   * Package Manager Detection
   *
   * Determines which package manager is being used in the project by checking
   * for specific lock files. This information is crucial for running the correct
   * package manager commands during installation and in generated scripts.
   *
   * Detection Priority:
   * 1. pnpm-lock.yaml (pnpm - fast, disk efficient)
   * 2. yarn.lock (Yarn - popular alternative to npm)
   * 3. package-lock.json (npm - Node.js default)
   * 4. Default to npm if no lock files found
   *
   * @param {string} projectPath - Absolute path to the project directory
   * @returns {string} Package manager identifier ('pnpm', 'yarn', 'npm')
   */
  detectPackageManager(projectPath) {
    const fs = require('fs');

    // Priority order matters - check most specific first
    // pnpm is checked first as it's often used in monorepos for performance
    if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }

    // Yarn is common in React and modern frontend projects
    if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }

    // npm is the default Node.js package manager
    if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) {
      return 'npm';
    }

    // Fallback to npm if no lock files are present
    // This allows installation to proceed even in new projects
    return 'npm';
  }

  /**
   * Main Installation Orchestrator
   *
   * This is the primary entry point for the CDEV installation process. It coordinates
   * all installation phases in a specific order to ensure a reliable and user-friendly
   * installation experience. The method is designed to be fault-tolerant and provides
   * clear feedback at each stage.
   *
   * Installation Flow:
   * 1. Pre-installation validation ensures environment readiness
   * 2. Interactive configuration gathers user preferences (skippable for automation)
   * 3. Core installation deploys files, templates, and scripts
   * 4. Post-installation setup configures hooks and environment
   * 5. Success messaging provides next steps and guidance
   *
   * Error Handling Strategy:
   * - Catches all errors to prevent unhandled rejections
   * - Provides clear error messages with context
   * - Exits gracefully in interactive mode
   * - Re-throws errors in programmatic mode for proper test handling
   *
   * @param {string} targetDir - Target directory for installation (default: current directory)
   * @param {object} options - Installation options and overrides
   * @param {boolean} options.skipPrompts - Skip interactive prompts for automated installation
   * @param {string} options.packageManager - Override package manager detection
   */
  async install(targetDir = '.', options = {}) {
    try {
      // Welcome message with clear branding
      console.log(chalk.cyan('🚀 Installing Parallel Claude Development Workflow'));
      console.log('');

      // Convert relative path to absolute for consistent path handling throughout installation
      const resolvedTargetDir = path.resolve(targetDir);

      // Phase 1: Pre-installation Validation
      // Validates environment dependencies, target directory permissions, and prerequisites
      // This phase prevents installation from proceeding if critical requirements aren't met
      await this.preInstallValidation(resolvedTargetDir, options);

      // Phase 2: Interactive Configuration
      // Gathers user preferences through interactive prompts or uses defaults
      // Can be skipped for automated installations (CI/CD, testing, etc.)
      const config = options.skipPrompts
        ? this.getDefaultConfiguration(resolvedTargetDir, options)
        : await this.interactiveConfiguration(resolvedTargetDir);

      // Phase 3: Core Installation
      // Deploys the core CDEV files, templates, and scripts to the target directory
      // Creates the essential directory structure and copies workflow templates
      await this.coreInstallation(resolvedTargetDir, config, options);

      // Phase 4: Post-installation Setup
      // Configures environment variables, sets up Git hooks, creates examples
      // This phase makes the installation immediately usable
      await this.postInstallationSetup(resolvedTargetDir, config);

      // Phase 5: Success Messaging and Guidance
      // Provides clear next steps and usage instructions to the user
      // Skipped in programmatic mode to avoid polluting test output
      if (!options.skipPrompts) {
        this.displaySuccessMessage(resolvedTargetDir, config);
      }
    } catch (error) {
      // Comprehensive error handling with user-friendly messaging
      console.error(chalk.red('❌ Installation failed:'), error.message);

      if (!options.skipPrompts) {
        // Interactive mode: exit cleanly with error code
        process.exit(1);
      } else {
        // Programmatic mode: re-throw for proper test error handling
        // This allows calling code to handle the error appropriately
        throw error;
      }
    }
  }

  /**
   * Gets default configuration when prompts are skipped
   * @param {string} targetDir - Target directory path
   * @param {object} options - Installation options
   * @returns {object} Default configuration
   */
  getDefaultConfiguration(targetDir, options = {}) {
    return {
      projectName: path.basename(targetDir) || 'parallel-claude-project',
      setupLinear: true,
      linearApiKey: null,
      setupGitHooks: true,
      workTreeLocation: 'alongside',
      customWorkTreePath: null,
      workTreePath: this.utils.resolveWorkTreePath(targetDir, {
        workTreeLocation: 'alongside',
      }),
      packageManager: options.packageManager || this.detectPackageManager(targetDir),
      projectType: this.detectProjectType(targetDir).type,
    };
  }

  async preInstallValidation(targetDir, options) {
    console.log(chalk.blue('📋 Phase 1: Pre-installation validation'));

    // Validate target directory
    await this.steps.validateTargetDirectory(targetDir, options);

    // Validate environment dependencies
    await this.steps.validateEnvironment();

    console.log(chalk.green('✅ Pre-installation validation complete'));
    console.log('');
  }

  async interactiveConfiguration(targetDir) {
    console.log(chalk.blue('🔧 Phase 2: Interactive configuration'));

    const config = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: path.basename(targetDir) || 'parallel-claude-project',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Project name is required';
          }
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'setupLinear',
        message: 'Setup Linear integration?',
        default: true,
      },
      {
        type: 'input',
        name: 'linearApiKey',
        message: 'Linear API key (optional, can be set later):',
        when: (answers) => answers.setupLinear,
        validate: (input) => {
          if (input && !input.startsWith('lin_api_')) {
            return 'Linear API key should start with "lin_api_"';
          }
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'setupGitHooks',
        message: 'Setup Git hooks for enhanced workflow?',
        default: true,
      },
      {
        type: 'list',
        name: 'workTreeLocation',
        message: 'Where should Git worktrees be created?',
        choices: [
          { name: 'Alongside project (../project-name-worktrees)', value: 'alongside' },
          { name: 'In tmp directory (/tmp/worktrees)', value: 'tmp' },
          { name: 'Custom location', value: 'custom' },
        ],
        default: 'alongside',
      },
      {
        type: 'input',
        name: 'customWorkTreePath',
        message: 'Custom worktree path:',
        when: (answers) => answers.workTreeLocation === 'custom',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Custom path is required';
          }
          return true;
        },
      },
    ]);

    // Process configuration
    config.workTreePath = this.utils.resolveWorkTreePath(targetDir, config);

    console.log(chalk.green('✅ Configuration complete'));
    console.log('');

    return config;
  }

  async coreInstallation(targetDir, config, _options) {
    console.log(chalk.blue('📦 Phase 3: Core installation'));

    // Create directory structure
    await this.steps.createDirectoryStructure(targetDir);

    // Copy workflow templates
    await this.steps.copyWorkflowTemplates(targetDir);

    // Setup scripts and permissions
    await this.steps.setupScriptsAndPermissions(targetDir);

    // Create configuration files
    await this.steps.createConfigurationFiles(targetDir, config);

    console.log(chalk.green('✅ Core installation complete'));
    console.log('');
  }

  async postInstallationSetup(targetDir, config) {
    console.log(chalk.blue('🔧 Phase 4: Post-installation setup'));

    // Setup environment variables
    await this.steps.setupEnvironmentVariables(targetDir, config);

    // Setup Git hooks if requested
    if (config.setupGitHooks) {
      await this.steps.setupGitHooks(targetDir);
    }

    // Create example files
    await this.steps.createExampleFiles(targetDir, config);

    // Final validation
    await this.steps.finalValidation(targetDir, config);

    console.log(chalk.green('✅ Post-installation setup complete'));
    console.log('');
  }

  displaySuccessMessage(targetDir, config) {
    console.log(chalk.green('🎉 Installation complete!'));
    console.log('');
    console.log(chalk.yellow('Next steps:'));
    console.log('');

    if (config.setupLinear && !config.linearApiKey) {
      console.log('1. Set your Linear API key:');
      console.log(chalk.cyan('   export LINEAR_API_KEY="your_key_here"'));
      console.log('');
    }

    console.log('2. Try the workflow:');
    if (config.setupLinear) {
      console.log(chalk.cyan('   ./scripts/python/cache-linear-issue.py TASK-123'));
      console.log(chalk.cyan('   ./scripts/python/decompose-parallel.py TASK-123'));
    }
    console.log(chalk.cyan('   ./scripts/python/spawn-agents.py'));
    console.log('');

    console.log('3. Read the documentation:');
    console.log(chalk.cyan('   ./scripts/python/README.md'));
    console.log('');

    console.log(chalk.blue('📚 Available Python scripts:'));
    console.log('   • scripts/python/ - All UV-based Python scripts');
    console.log('   • scripts/wrappers/ - Shell/JS compatibility wrappers');
    console.log('');

    console.log(chalk.magenta('🚀 Happy parallel development!'));
  }

  async uninstall(targetDir = '.') {
    console.log(chalk.yellow('🗑️  Uninstalling Parallel Claude Development Workflow'));

    const resolvedTargetDir = path.resolve(targetDir);

    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmUninstall',
        message: 'Are you sure you want to uninstall the workflow?',
        default: false,
      },
    ]);

    if (!confirm.confirmUninstall) {
      console.log(chalk.blue('Uninstall cancelled'));
      return;
    }

    try {
      // Remove workflow directories
      await this.steps.removeWorkflowDirectories(resolvedTargetDir);

      // Clean up worktrees
      await this.steps.cleanupWorktrees(resolvedTargetDir);

      // Remove configuration files
      await this.steps.removeConfigurationFiles(resolvedTargetDir);

      console.log(chalk.green('✅ Uninstall complete'));
    } catch (error) {
      console.error(chalk.red('❌ Uninstall failed:'), error.message);
      process.exit(1);
    }
  }
}

module.exports = { Installer };
