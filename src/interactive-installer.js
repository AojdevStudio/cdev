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

      // Install components
      await this.installHooks(resolvedTargetDir, config);
      await this.installWorkflowScripts(resolvedTargetDir, config);
      await this.installAIDocs(resolvedTargetDir, config);
      await this.setupLinear(resolvedTargetDir, config);

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

    console.log(chalk.grey('ℹ️  Standard hooks (automatically installed):'));
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
            name: 'TypeScript validator (checks TypeScript syntax)',
            value: 'typescript-validator',
            checked: true,
          },
          {
            name: 'Import organizer (sorts imports)',
            value: 'import-organizer',
            checked: true,
          },
          {
            name: 'Code quality reporter (identifies code smells)',
            value: 'code-quality-reporter',
            checked: true,
          },
          {
            name: 'Task completion enforcer (tracks TODOs)',
            value: 'task-completion-enforcer',
            checked: true,
          },
          {
            name: 'Commit message validator (semantic commits)',
            value: 'commit-message-validator',
            checked: true,
          },
          {
            name: 'Command template guard (validates command usage)',
            value: 'command-template-guard',
            checked: true,
          },
          {
            name: 'pnpm enforcer (prevents npm/yarn usage)',
            value: 'pnpm-enforcer',
            checked: false,
          },
          {
            name: 'API standards checker (REST/GraphQL validation)',
            value: 'api-standards-checker',
            checked: false,
          },
          {
            name: 'Universal linter (multi-language linting)',
            value: 'universal-linter',
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

      // Standard hooks that are always installed
      const standardHooks = [
        'pre_tool_use.py',
        'post_tool_use.py',
        'notification.py',
        'stop.py',
        'subagent_stop.py',
      ];

      // Hook name mapping for files that don't match exactly
      const hookMapping = {
        'command-template-guard': 'pre_tool_use_command_template_guard.py',
      };

      // Install standard hooks
      for (const hookScript of standardHooks) {
        const sourceHook = path.join(this.packageRoot, '.claude', 'hooks', hookScript);
        const targetHook = path.join(hooksDir, hookScript);

        if (await fs.pathExists(sourceHook)) {
          await fs.copy(sourceHook, targetHook, { overwrite: true });
          spinner.text = `Installed standard hook: ${hookScript}`;
        } else {
          console.warn(chalk.yellow(`   ⚠ Hook file not found: ${hookScript}`));
        }
      }

      // Install selected optional hooks
      for (const hookName of config.hooks) {
        const hookScript = hookMapping[hookName] || `${hookName}.py`;
        const sourceHook = path.join(this.packageRoot, '.claude', 'hooks', hookScript);
        const targetHook = path.join(hooksDir, hookScript);

        if (await fs.pathExists(sourceHook)) {
          await fs.copy(sourceHook, targetHook, { overwrite: true });
          spinner.text = `Installed optional hook: ${hookScript}`;
        } else {
          console.warn(chalk.yellow(`   ⚠ Hook file not found: ${hookScript}`));
        }
      }

      // Copy utils directory if it exists
      const sourceUtils = path.join(this.packageRoot, '.claude', 'hooks', 'utils');
      const targetUtils = path.join(hooksDir, 'utils');

      if (await fs.pathExists(sourceUtils)) {
        await fs.copy(sourceUtils, targetUtils, { overwrite: true });
        spinner.text = 'Installed hook utilities';
      }

      spinner.succeed('Hooks installed successfully');
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
}

module.exports = InteractiveInstaller;
