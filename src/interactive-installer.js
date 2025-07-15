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

      // Interactive configuration
      const config = await this.getConfiguration();

      // Installation with progress
      const spinner = ora('Installing cdev files...').start();

      // Create directory structure
      spinner.text = 'Creating directory structure...';
      await this.createDirectoryStructure(resolvedTargetDir);

      // Install hooks based on user selection
      spinner.text = 'Installing selected hooks...';
      await this.installHooks(resolvedTargetDir, config);

      // Copy command templates
      spinner.text = 'Installing command templates...';
      await this.copyCommandTemplates(resolvedTargetDir);

      // Copy workflow scripts if requested
      if (config.installWorkflowScripts) {
        spinner.text = 'Installing workflow scripts...';
        await this.copyWorkflowScripts(resolvedTargetDir);
      }

      // Copy AI documentation if requested
      if (config.installAIDocs) {
        spinner.text = 'Installing AI documentation...';
        await this.copyAIDocs(resolvedTargetDir);
      }

      // Create environment configuration
      spinner.text = 'Creating environment configuration...';
      await this.createEnvironmentConfig(resolvedTargetDir, config);

      // Set permissions
      spinner.text = 'Setting file permissions...';
      await this.setPermissions(resolvedTargetDir);

      spinner.succeed('Installation complete!');

      // Display success message
      this.displaySuccessMessage(resolvedTargetDir, config);
    } catch (error) {
      console.error(chalk.red('\n❌ Installation failed:'), error.message);
      process.exit(1);
    }
  }

  async getConfiguration() {
    console.log(chalk.blue("📋 Let's configure your cdev installation:\n"));

    const config = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'hooks',
        message: 'Select hooks to install:',
        choices: [
          {
            name: 'Pre-bash validator (blocks dangerous commands)',
            value: 'pre-bash-validator',
            checked: true,
          },
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
            name: 'Notification system (desktop alerts)',
            value: 'notification',
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
        message: 'Your name (for personalized notifications):',
        default: 'Developer',
      },
      {
        type: 'list',
        name: 'defaultEditor',
        message: 'Default code editor:',
        choices: ['cursor', 'code', 'vim', 'emacs', 'other'],
        default: 'cursor',
      },
    ]);

    return config;
  }

  async createDirectoryStructure(targetDir) {
    const dirs = [
      '.claude',
      '.claude/hooks',
      '.claude/commands',
      '.claude/logs',
      '.claude/templates',
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(targetDir, dir));
    }
  }

  async installHooks(targetDir, config) {
    const claudeDir = path.join(targetDir, '.claude');

    // Map of hook names to their configurations
    const hookConfigs = {
      'pre-bash-validator': {
        event: 'PreToolUse',
        matcher: 'Bash',
        script: 'pre-bash-validator.py',
      },
      'typescript-validator': {
        event: 'PreToolUse',
        matcher: 'Write|Edit|MultiEdit',
        script: 'typescript-validator.py',
      },
      'import-organizer': {
        event: 'PostToolUse',
        matcher: 'Write|Edit|MultiEdit',
        script: 'import-organizer.py',
      },
      'code-quality-reporter': {
        event: 'PostToolUse',
        matcher: 'Write|Edit|MultiEdit',
        script: 'code-quality-reporter.py',
      },
      'task-completion-enforcer': {
        event: 'Stop',
        matcher: '',
        script: 'task-completion-enforcer.py',
      },
      'commit-message-validator': {
        event: 'PreToolUse',
        matcher: 'Bash',
        script: 'commit-message-validator.py',
      },
      notification: {
        event: 'Notification',
        matcher: '',
        script: 'notification.py',
      },
      'pnpm-enforcer': {
        event: 'PreToolUse',
        matcher: 'Bash',
        script: 'pnpm-enforcer.py',
      },
      'api-standards-checker': {
        event: 'PostToolUse',
        matcher: 'Write|Edit|MultiEdit',
        script: 'api-standards-checker.py',
      },
      'universal-linter': {
        event: 'PostToolUse',
        matcher: 'Write|Edit|MultiEdit',
        script: 'universal-linter.py',
      },
    };

    // Build settings.json based on selected hooks
    const settings = {
      permissions: {
        allow: [
          'Bash(mkdir:*)',
          'Bash(uv:*)',
          'Bash(find:*)',
          'Bash(mv:*)',
          'Bash(grep:*)',
          'Bash(npm:*)',
          'Bash(ls:*)',
          'Bash(cp:*)',
          'Write',
          'Edit',
          'Bash(chmod:*)',
          'Bash(touch:*)',
        ],
        deny: [],
      },
      hooks: {},
    };

    // Group hooks by event
    for (const hookName of config.hooks) {
      const hookConfig = hookConfigs[hookName];
      if (!hookConfig) {
        continue;
      }

      const { event, matcher, script } = hookConfig;

      if (!settings.hooks[event]) {
        settings.hooks[event] = [];
      }

      // Find or create matcher group
      let matcherGroup = settings.hooks[event].find((g) => g.matcher === matcher);
      if (!matcherGroup) {
        matcherGroup = { matcher, hooks: [] };
        settings.hooks[event].push(matcherGroup);
      }

      matcherGroup.hooks.push({
        type: 'command',
        command: `uv run .claude/hooks/${script}`,
      });
    }

    // Write settings.json
    await fs.writeJson(path.join(claudeDir, 'settings.json'), settings, { spaces: 2 });

    // Copy hook scripts
    const hooksDir = path.join(claudeDir, 'hooks');
    const hooksSourceDir = path.join(this.packageRoot, '.claude', 'hooks');

    // If hook scripts exist in the package, copy them
    if (await fs.pathExists(hooksSourceDir)) {
      for (const hookName of config.hooks) {
        const hookConfig = hookConfigs[hookName];
        if (!hookConfig) {
          continue;
        }

        const sourcePath = path.join(hooksSourceDir, hookConfig.script);
        const targetPath = path.join(hooksDir, hookConfig.script);

        if (await fs.pathExists(sourcePath)) {
          await fs.copy(sourcePath, targetPath);
        } else {
          // Create basic hook script if not found
          await this.createHookScript(targetPath, hookName);
        }
      }
    } else {
      // Create all selected hook scripts
      for (const hookName of config.hooks) {
        const hookConfig = hookConfigs[hookName];
        if (!hookConfig) {
          continue;
        }

        const targetPath = path.join(hooksDir, hookConfig.script);
        await this.createHookScript(targetPath, hookName);
      }
    }
  }

  async createHookScript(filePath, hookType) {
    // Create appropriate hook script based on type
    const hookScripts = {
      'pre-bash-validator': `#!/usr/bin/env python3
import json
import sys
import re

# Dangerous command patterns
DANGEROUS_PATTERNS = [
    (r'\\brm\\s+-rf\\s+/', 'Dangerous rm -rf command detected'),
    (r'\\b(sudo|su)\\b', 'Sudo/su commands require manual execution'),
    (r':\\s*\\(\\s*\\)\\s*\\{.*\\}\\s*;\\s*:', 'Fork bomb pattern detected'),
    (r'\\b(chmod|chown)\\s+777', 'Overly permissive file permissions'),
]

try:
    input_data = json.load(sys.stdin)
    tool_input = input_data.get('tool_input', {})
    command = tool_input.get('command', '')
    
    for pattern, message in DANGEROUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            print(message, file=sys.stderr)
            sys.exit(2)  # Block the command
            
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`,
      'typescript-validator': `#!/usr/bin/env python3
import json
import sys
import re

try:
    input_data = json.load(sys.stdin)
    tool_input = input_data.get('tool_input', {})
    file_path = tool_input.get('file_path', '')
    
    # Only check TypeScript files
    if not file_path.endswith(('.ts', '.tsx')):
        sys.exit(0)
    
    content = tool_input.get('content', '') or tool_input.get('new_string', '')
    
    # Basic TypeScript checks
    if 'any' in content and not '// @ts-ignore' in content:
        print("Warning: Avoid using 'any' type. Consider using 'unknown' or a more specific type.", file=sys.stderr)
        
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`,
      notification: `#!/usr/bin/env python3
import json
import sys
import subprocess
import platform

try:
    input_data = json.load(sys.stdin)
    message = input_data.get('message', 'Claude Code notification')
    
    if platform.system() == 'Darwin':  # macOS
        subprocess.run(['osascript', '-e', f'display notification "{message}" with title "Claude Code"'])
    elif platform.system() == 'Linux':
        subprocess.run(['notify-send', 'Claude Code', message])
    # Windows would use different notification method
    
except Exception as e:
    print(f"Notification error: {e}", file=sys.stderr)
    sys.exit(1)
`,
      // Add more hook scripts as needed
    };

    const script =
      hookScripts[hookType] ||
      `#!/usr/bin/env python3
# ${hookType} hook
import json
import sys

try:
    input_data = json.load(sys.stdin)
    # Hook implementation goes here
    print(f"${hookType} hook executed", file=sys.stdout)
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    await fs.writeFile(filePath, script);
  }

  async copyCommandTemplates(targetDir) {
    const commandsDir = path.join(targetDir, '.claude', 'commands');
    const commandsSourceDir = path.join(this.packageRoot, '.claude', 'commands');

    // Copy commands if they exist in the package
    if (await fs.pathExists(commandsSourceDir)) {
      await fs.copy(commandsSourceDir, commandsDir);
    } else {
      // Create basic command scripts
      await this.createBasicCommands(commandsDir);
    }
  }

  async createBasicCommands(commandsDir) {
    // Create basic command implementations
    const commands = {
      'agent-start.sh': `#!/bin/bash
# /agent-start command implementation
echo "Loading agent context..."
if [ -f "./agent_context.json" ]; then
    cat "./agent_context.json"
fi
`,
      'agent-commit.sh': `#!/bin/bash
# /agent-commit command implementation
git add -A
git commit -m "$1"
echo "✅ Changes committed"
`,
      'agent-status.sh': `#!/bin/bash
# /agent-status command implementation
echo "Checking agent status..."
git status
`,
    };

    for (const [filename, content] of Object.entries(commands)) {
      await fs.writeFile(path.join(commandsDir, filename), content);
    }
  }

  async copyWorkflowScripts(targetDir) {
    const scriptsDir = path.join(targetDir, 'scripts');
    await fs.ensureDir(scriptsDir);

    const scriptsSourceDir = path.join(this.packageRoot, 'scripts');
    const essentialScripts = [
      'cache-linear-issue.sh',
      'decompose-parallel.cjs',
      'spawn-agents.sh',
      'monitor-agents.sh',
      'agent-commit-enhanced.sh',
      'intelligent-agent-generator.js',
    ];

    for (const script of essentialScripts) {
      const sourcePath = path.join(scriptsSourceDir, script);
      const targetPath = path.join(scriptsDir, script);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, targetPath);
      }
    }

    // Also copy the utils directory since scripts depend on it
    const utilsDir = path.join(targetDir, 'utils');
    await fs.ensureDir(utilsDir);

    const utilsSourceDir = path.join(this.packageRoot, 'utils');
    if (await fs.pathExists(utilsSourceDir)) {
      await fs.copy(utilsSourceDir, utilsDir);
    }
  }

  async copyAIDocs(targetDir) {
    const aiDocsDir = path.join(targetDir, 'ai-docs');
    await fs.ensureDir(aiDocsDir);

    const sourceAiDocs = path.join(this.packageRoot, 'ai-docs');
    if (await fs.pathExists(sourceAiDocs)) {
      await fs.copy(sourceAiDocs, aiDocsDir);
    }
  }

  async createEnvironmentConfig(targetDir, config) {
    // Copy the actual .env.example from the package
    const envExampleSource = path.join(this.packageRoot, '.env.example');
    const envExampleTarget = path.join(targetDir, '.env.example');

    if (await fs.pathExists(envExampleSource)) {
      await fs.copy(envExampleSource, envExampleTarget);
    }

    // If user provided Linear API key, create .env with it
    if (config.linearApiKey) {
      const envPath = path.join(targetDir, '.env');
      const envContent = await fs.readFile(envExampleTarget, 'utf8');
      const updatedContent = envContent
        .replace('<your-linear-api-key>', config.linearApiKey)
        .replace('YourName', config.engineerName)
        .replace('cursor', config.defaultEditor);

      await fs.writeFile(envPath, updatedContent);
    }
  }

  async setPermissions(targetDir) {
    const executableDirs = [
      path.join(targetDir, 'scripts'),
      path.join(targetDir, '.claude', 'commands'),
      path.join(targetDir, '.claude', 'hooks'),
    ];

    for (const dir of executableDirs) {
      if (await fs.pathExists(dir)) {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.sh') || file.endsWith('.py') || file.endsWith('.cjs')) {
            const filePath = path.join(dir, file);
            await fs.chmod(filePath, '755');
          }
        }
      }
    }
  }

  displaySuccessMessage(targetDir, config) {
    console.log('');
    console.log(chalk.green.bold('✅ cdev installation complete!'));
    console.log('');
    console.log(chalk.yellow('📁 Installed files:'));
    console.log('   • .claude/           - Claude Code configuration');
    console.log(`   • .claude/hooks/     - ${config.hooks.length} hooks installed`);
    console.log('   • .claude/commands/  - Custom Claude commands');
    if (config.installWorkflowScripts) {
      console.log('   • scripts/           - Workflow automation scripts');
      console.log('   • utils/             - Script utilities and helpers');
    }
    if (config.installAIDocs) {
      console.log('   • ai-docs/           - AI documentation templates');
    }
    console.log('   • .env.example       - Environment configuration template');
    console.log('');
    console.log(chalk.cyan('🚀 Next steps:'));

    let step = 1;
    if (config.setupLinear && !config.linearApiKey) {
      console.log(`   ${step++}. Copy .env.example to .env and add your Linear API key`);
    }
    console.log(`   ${step++}. Run ${chalk.bold('claude')} to start using Claude Code with hooks`);
    console.log(`   ${step++}. Review .claude/settings.json to customize hook behavior`);

    console.log('');
    console.log(chalk.blue('📚 Documentation:'));
    console.log('   • Hook reference: https://docs.anthropic.com/en/docs/claude-code/hooks');
    console.log('   • cdev GitHub: https://github.com/AOJDevStudio/cdev');
    console.log('');
  }
}

module.exports = { InteractiveInstaller };
