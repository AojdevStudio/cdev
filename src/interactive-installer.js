const path = require('path');

const fs = require('fs-extra');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');

class InteractiveInstaller {
  constructor() {
    this.packageRoot = path.join(__dirname, '..');
  }

  async install(targetDir = '.', options = {}) {
    console.log(chalk.cyan.bold('\n🚀 Welcome to cdev (Claude Development) Installation\n'));

    try {
      const resolvedTargetDir = path.resolve(targetDir);

      // Validate package structure before installation
      await this.validatePackageStructure();

      // Ensure target directory exists
      await fs.ensureDir(resolvedTargetDir);

      // Check if already installed
      const claudeDir = path.join(resolvedTargetDir, '.claude');
      if ((await fs.pathExists(claudeDir)) && !options.force) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: '.claude directory already exists. Overwrite?',
            default: false,
          },
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('Installation cancelled.'));
          return;
        }
      }

      // Get configuration
      const config = await this.getConfiguration();

      // Install components with better error isolation
      const installationSteps = [
        { name: 'hooks', fn: () => this.installHooks(resolvedTargetDir, config) },
        { name: 'commands', fn: () => this.installCommands(resolvedTargetDir, config) },
        { name: 'agents', fn: () => this.installAgents(resolvedTargetDir, config) },
        {
          name: 'workflow scripts',
          fn: () => this.installWorkflowScripts(resolvedTargetDir, config),
        },
        { name: 'AI docs', fn: () => this.installAIDocs(resolvedTargetDir, config) },
        { name: 'Linear setup', fn: () => this.setupLinear(resolvedTargetDir, config) },
      ];

      for (const step of installationSteps) {
        try {
          await step.fn();
        } catch (error) {
          console.error(chalk.red(`Failed to install ${step.name}:`), error.message);
          throw new Error(`Installation failed at step: ${step.name}`);
        }
      }

      console.log(chalk.green.bold('\n✅ cdev installation completed successfully!\n'));
      console.log(chalk.blue('Next steps:'));
      console.log(chalk.blue('1. Run `cdev status` to verify installation'));
      console.log(
        chalk.blue('2. Try `cdev task "your task description"` to start parallel development'),
      );

      if (config.setupLinear && !config.linearApiKey) {
        console.log(chalk.yellow('\n⚠️  Add your Linear API key to .claude/settings.json'));
      }
    } catch (error) {
      console.error(chalk.red('Installation failed:'), error.message);
      if (error.stack) {
        console.error(chalk.red('Stack trace:'), error.stack);
      }
      throw error;
    }
  }

  async getConfiguration() {
    console.log(chalk.blue("📋 Let's configure your cdev installation:\n"));

    console.log(
      chalk.grey(
        'ℹ️  Tier 1 hooks (automatically installed - critical for security & validation):',
      ),
    );
    console.log(chalk.grey('   • pre_tool_use.py - Core pre-execution validation'));
    console.log(chalk.grey('   • post_tool_use.py - Core post-execution processing'));
    console.log(chalk.grey('   • notification.py - System notifications'));
    console.log(chalk.grey('   • stop.py - Session cleanup'));
    console.log(chalk.grey('   • subagent_stop.py - Sub-agent cleanup\n'));

    const config = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'hooks',
        message:
          'Select optional hooks to install: (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)',
        choices: [
          {
            name: 'Code quality reporter (identifies code smells) [TIER 2]',
            value: 'code-quality-reporter',
            checked: true,
          },
          {
            name: 'Import organizer (sorts imports) [TIER 3]', // Changed from TIER 2
            value: 'import-organizer',
            checked: true,
          },
          {
            name: 'API standards checker (REST/GraphQL validation) [TIER 2]',
            value: 'api-standards-checker',
            checked: false,
          },
          {
            name: 'Universal linter (multi-language linting) [TIER 2]',
            value: 'universal-linter',
            checked: false,
          },
          {
            name: 'TypeScript validator (checks TypeScript syntax) [TIER 3]',
            value: 'typescript-validator',
            checked: true,
          },
          {
            name: 'Task completion enforcer (tracks TODOs) [TIER 3]',
            value: 'task-completion-enforcer',
            checked: true,
          },
          {
            name: 'Commit message validator (semantic commits) [TIER 3]',
            value: 'commit-message-validator',
            checked: true,
          },
          {
            name: 'Command template guard (validates command usage) [TIER 3]',
            value: 'command-template-guard',
            checked: true,
          },
          {
            name: 'pnpm enforcer (prevents npm/yarn usage) [TIER 3]',
            value: 'pnpm-enforcer',
            checked: false,
          },
        ],
      },
      {
        type: 'confirm',
        name: 'installWorkflowScripts',
        message: 'Install parallel workflow scripts (for Linear integration)?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'installAIDocs',
        message: 'Install AI documentation templates?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'setupLinear',
        message: 'Do you use Linear for issue tracking?',
        default: true,
      },
      {
        type: 'input',
        name: 'linearApiKey',
        message: 'Linear API key (optional, can be added later):',
        when: (answers) => answers.setupLinear,
        validate: (input) => {
          if (input && !input.startsWith('lin_api_')) {
            return 'Linear API key should start with "lin_api_"';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'engineerName',
        message: 'Your name (for commit messages and documentation):',
        default: 'Engineer',
      },
      {
        type: 'list',
        name: 'branchNamingStyle',
        message: 'Preferred branch naming style:',
        choices: [
          { name: 'feature/description (default)', value: 'simple' },
          { name: 'feature/linear-id-description', value: 'linear' },
          { name: 'user/feature/description', value: 'user' },
        ],
        default: 'simple',
      },
    ]);

    return config;
  }

  async installHooks(targetDir, config) {
    const spinner = ora('Installing hooks...').start();

    try {
      const hooksDir = path.join(targetDir, '.claude', 'hooks');
      await fs.ensureDir(hooksDir);

      // TIER 1: Always install critical hooks
      const tier1Hooks = [
        'pre_tool_use.py',
        'post_tool_use.py',
        'notification.py',
        'stop.py',
        'subagent_stop.py',
      ];

      spinner.text = 'Installing Tier 1 (critical) hooks...';
      let installedTier1 = 0;
      for (const hookScript of tier1Hooks) {
        const sourceHook = path.join(this.packageRoot, '.claude', 'hooks', hookScript);
        const targetHook = path.join(hooksDir, hookScript);

        if (await fs.pathExists(sourceHook)) {
          await fs.copy(sourceHook, targetHook, { overwrite: true });
          installedTier1++;
        } else {
          console.warn(chalk.yellow(`   ⚠ Critical hook not found: ${hookScript}`));
        }
      }

      // TIER 2 & 3: Install based on user selection
      const hookFileMapping = {
        // Tier 2 hooks
        'code-quality-reporter': 'code-quality-reporter.py',
        'api-standards-checker': 'api-standards-checker.py',
        'universal-linter': 'universal-linter.py',
        'import-organizer': 'import-organizer.py',

        // Tier 3 hooks
        'typescript-validator': 'typescript-validator.py',
        'task-completion-enforcer': 'task-completion-enforcer.py',
        'commit-message-validator': 'commit-message-validator.py',
        'command-template-guard': 'pre_tool_use_command_template_guard.py',
        'pnpm-enforcer': 'pnpm-enforcer.py',
      };

      spinner.text = `Installing selected optional hooks (${config.hooks.length} selected)...`;
      let installedOptional = 0;
      for (const hookName of config.hooks) {
        const hookFile = hookFileMapping[hookName];
        if (!hookFile) {
          console.warn(chalk.yellow(`   ⚠ Unknown hook: ${hookName}`));
          continue;
        }

        const sourceHook = path.join(this.packageRoot, '.claude', 'hooks', hookFile);
        const targetHook = path.join(hooksDir, hookFile);

        if (await fs.pathExists(sourceHook)) {
          await fs.copy(sourceHook, targetHook, { overwrite: true });
          installedOptional++;
          spinner.text = `Installed optional hook: ${hookFile} (${installedOptional}/${config.hooks.length})`;
        } else {
          console.warn(chalk.yellow(`   ⚠ Optional hook not found: ${hookFile}`));
        }
      }

      // Copy utils directory if it exists
      const sourceUtils = path.join(this.packageRoot, '.claude', 'hooks', 'utils');
      const targetUtils = path.join(hooksDir, 'utils');

      if (await fs.pathExists(sourceUtils)) {
        await fs.copy(sourceUtils, targetUtils, { overwrite: true });
        spinner.text = 'Installed hook utilities';
      }

      spinner.succeed(
        `Hooks installed successfully (${installedTier1} critical, ${installedOptional} optional)`,
      );
    } catch (error) {
      spinner.fail('Hook installation failed');
      throw error;
    }
  }

  async installWorkflowScripts(targetDir, config) {
    if (!config.installWorkflowScripts) {
      return;
    }

    const spinner = ora('Installing workflow scripts...').start();

    try {
      const scriptsDir = path.join(targetDir, '.claude', 'scripts');
      await fs.ensureDir(scriptsDir);

      const sourceScripts = path.join(this.packageRoot, '.claude', 'scripts');
      if (await fs.pathExists(sourceScripts)) {
        await fs.copy(sourceScripts, scriptsDir, { overwrite: true });
        spinner.succeed('Workflow scripts installed');
      } else {
        spinner.warn('Workflow scripts not found in package');
      }
    } catch (error) {
      spinner.fail('Workflow script installation failed');
      throw error;
    }
  }

  async installAIDocs(targetDir, config) {
    if (!config.installAIDocs) {
      return;
    }

    const spinner = ora('Installing AI documentation templates...').start();

    try {
      const docsDir = path.join(targetDir, 'ai-docs');
      await fs.ensureDir(docsDir);

      const sourceDocs = path.join(this.packageRoot, 'ai-docs');
      if (await fs.pathExists(sourceDocs)) {
        await fs.copy(sourceDocs, docsDir, { overwrite: true });
        spinner.succeed('AI documentation templates installed');
      } else {
        spinner.warn('AI documentation templates not found in package');
      }
    } catch (error) {
      spinner.fail('AI docs installation failed');
      throw error;
    }
  }

  async setupLinear(targetDir, config) {
    if (!config.setupLinear) {
      return;
    }

    const spinner = ora('Setting up Linear integration...').start();

    try {
      const claudeDir = path.join(targetDir, '.claude');
      const settingsFile = path.join(claudeDir, 'settings.json');

      const settings = {
        linear: {
          apiKey: config.linearApiKey || '',
          workspaceId: '',
          teamId: '',
        },
        engineer: {
          name: config.engineerName,
          branchNamingStyle: config.branchNamingStyle,
        },
        workflow: {
          enableParallelDevelopment: true,
          autoCreateBranches: true,
          enforceLinearIssueFormat: config.branchNamingStyle === 'linear',
        },
      };

      await fs.writeJson(settingsFile, settings, { spaces: 2 });
      spinner.succeed('Linear integration configured');
    } catch (error) {
      spinner.fail('Linear setup failed');
      throw error;
    }
  }

  async installCommands(targetDir, config) {
    const spinner = ora('Installing commands...').start();

    try {
      const commandsDir = path.join(targetDir, '.claude', 'commands');
      await fs.ensureDir(commandsDir);

      const sourceCommands = path.join(this.packageRoot, '.claude', 'commands');
      if (await fs.pathExists(sourceCommands)) {
        await fs.copy(sourceCommands, commandsDir, { overwrite: true });

        // Future: Could filter commands based on config.features
        if (config.setupLinear) {
          spinner.text = 'Configuring Linear integration commands...';
          // Add Linear-specific command configuration
        }

        spinner.succeed('Commands installed successfully');
      } else {
        spinner.warn('Commands not found in package');
      }
    } catch (error) {
      spinner.fail('Command installation failed');
      throw error;
    }
  }

  async installAgents(targetDir, config) {
    const spinner = ora('Installing agents...').start();

    try {
      const agentsDir = path.join(targetDir, '.claude', 'agents');
      await fs.ensureDir(agentsDir);

      const sourceAgents = path.join(this.packageRoot, '.claude', 'agents');
      if (await fs.pathExists(sourceAgents)) {
        await fs.copy(sourceAgents, agentsDir, { overwrite: true });

        // Future: Could configure agents based on project type
        if (config.projectType) {
          spinner.text = `Configuring agents for ${config.projectType} project...`;
          // Add project-specific agent configuration
        }

        spinner.succeed('Agents installed successfully');
      } else {
        spinner.warn('Agents not found in package');
      }
    } catch (error) {
      spinner.fail('Agent installation failed');
      throw error;
    }
  }

  async validatePackageStructure() {
    const requiredPaths = ['.claude/hooks', '.claude/commands', '.claude/agents'];

    // Check required directories
    for (const requiredPath of requiredPaths) {
      const fullPath = path.join(this.packageRoot, requiredPath);
      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`Package structure invalid: missing ${requiredPath}`);
      }
    }

    // Validate critical hooks exist
    const criticalHooks = [
      'pre_tool_use.py',
      'post_tool_use.py',
      'notification.py',
      'stop.py',
      'subagent_stop.py',
    ];

    for (const hook of criticalHooks) {
      const hookPath = path.join(this.packageRoot, '.claude', 'hooks', hook);
      if (!(await fs.pathExists(hookPath))) {
        throw new Error(`Critical hook missing from package: ${hook}`);
      }
    }
  }
}

module.exports = InteractiveInstaller;
