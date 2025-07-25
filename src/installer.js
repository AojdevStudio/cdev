const path = require('path');

const chalk = require('chalk');
const inquirer = require('inquirer');

const { InstallSteps } = require('./install-steps');
const { InstallUtils } = require('./install-utils');

class Installer {
  constructor(options = {}) {
    this.options = options;
    this.steps = new InstallSteps();
    this.utils = new InstallUtils();
  }

  /**
   * Detects the project type based on package.json and configuration files
   * @param {string} projectPath - Path to the project directory
   * @returns {object} Project type object with type, confidence, and metadata
   */
  detectProjectType(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const fs = require('fs');

    try {
      // Check for Python first
      if (
        fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
        fs.existsSync(path.join(projectPath, 'pyproject.toml')) ||
        fs.existsSync(path.join(projectPath, 'setup.py'))
      ) {
        return {
          type: 'python',
          confidence: 0.9,
          runtime: 'python',
          framework: 'flask',
        };
      }

      if (!fs.existsSync(packageJsonPath)) {
        return {
          type: 'minimal',
          confidence: 0.8,
        };
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for Next.js with high confidence
      if (dependencies.next || fs.existsSync(path.join(projectPath, 'next.config.js'))) {
        return {
          type: 'nextjs',
          confidence: 0.95,
          framework: 'next',
          buildTool: 'next',
        };
      }

      // Check for Vite React
      if (dependencies.vite && dependencies.react) {
        return {
          type: 'react',
          confidence: 0.9,
          framework: 'react',
          buildTool: 'vite',
        };
      }

      // Check for monorepo
      if (packageJson.workspaces || fs.existsSync(path.join(projectPath, 'turbo.json'))) {
        return {
          type: 'monorepo',
          confidence: 0.9,
          workspaces: true,
        };
      }

      // Check for Express/Node.js
      if (dependencies.express || dependencies.fastify || dependencies.koa) {
        return {
          type: 'nodejs',
          confidence: 0.85,
          runtime: 'node',
          framework: 'express',
        };
      }

      return {
        type: 'minimal',
        confidence: 0.7,
      };
    } catch (error) {
      return {
        type: 'minimal',
        confidence: 0.5,
      };
    }
  }

  /**
   * Detects the package manager used in the project
   * @param {string} projectPath - Path to the project directory
   * @returns {string} Package manager (npm, yarn, pnpm)
   */
  detectPackageManager(projectPath) {
    const fs = require('fs');

    // Check for lock files
    if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) {
      return 'npm';
    }

    // Default to npm
    return 'npm';
  }

  async install(targetDir = '.', options = {}) {
    try {
      console.log(chalk.cyan('🚀 Installing Parallel Claude Development Workflow'));
      console.log('');

      const resolvedTargetDir = path.resolve(targetDir);

      // Phase 1: Pre-installation validation
      await this.preInstallValidation(resolvedTargetDir, options);

      // Phase 2: Interactive configuration (skip if requested)
      const config = options.skipPrompts
        ? this.getDefaultConfiguration(resolvedTargetDir, options)
        : await this.interactiveConfiguration(resolvedTargetDir);

      // Phase 3: Core installation
      await this.coreInstallation(resolvedTargetDir, config, options);

      // Phase 4: Post-installation setup
      await this.postInstallationSetup(resolvedTargetDir, config);

      // Phase 5: Success message
      if (!options.skipPrompts) {
        this.displaySuccessMessage(resolvedTargetDir, config);
      }
    } catch (error) {
      console.error(chalk.red('❌ Installation failed:'), error.message);
      if (!options.skipPrompts) {
        process.exit(1);
      } else {
        throw error; // Re-throw for tests
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
    console.log(
      chalk.cyan(
        '   ./workflows/paralell-development-claude/scripts/cache-linear-issue.sh TASK-123',
      ),
    );
    console.log('');

    console.log('3. Read the documentation:');
    console.log(chalk.cyan('   ./workflows/paralell-development-claude/README.md'));
    console.log('');

    console.log('4. Start with Claude Code:');
    console.log(chalk.cyan('   claude'));
    console.log('');

    console.log(chalk.blue('📚 Documentation and examples:'));
    console.log('   • README.md - Complete workflow guide');
    console.log('   • ai_docs/ - AI-specific documentation');
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
