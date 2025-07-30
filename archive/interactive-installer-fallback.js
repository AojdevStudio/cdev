// Fallback version that looks in both tier subdirectories and root directory

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
    for (const hookScript of tier1Hooks) {
      // Try tier1 subdirectory first
      let sourceHook = path.join(this.packageRoot, '.claude', 'hooks', 'tier1', hookScript);
      
      // Fallback to root directory if not found in tier1
      if (!(await fs.pathExists(sourceHook))) {
        sourceHook = path.join(this.packageRoot, '.claude', 'hooks', hookScript);
      }
      
      const targetHook = path.join(hooksDir, hookScript);

      if (await fs.pathExists(sourceHook)) {
        await fs.copy(sourceHook, targetHook, { overwrite: true });
      } else {
        console.warn(chalk.yellow(`   ⚠ Tier 1 hook file not found: ${hookScript}`));
      }
    }

    // TIER 2 & 3: Install based on user selection
    const tierMapping = {
      // Tier 2 hooks
      'code-quality-reporter': { tier: 'tier2', file: 'code-quality-reporter.py' },
      'api-standards-checker': { tier: 'tier2', file: 'api-standards-checker.py' },
      'universal-linter': { tier: 'tier2', file: 'universal-linter.py' },
      
      // Tier 3 hooks
      'import-organizer': { tier: 'tier3', file: 'import-organizer.py' },
      'typescript-validator': { tier: 'tier3', file: 'typescript-validator.py' },
      'task-completion-enforcer': { tier: 'tier3', file: 'task-completion-enforcer.py' },
      'commit-message-validator': { tier: 'tier3', file: 'commit-message-validator.py' },
      'command-template-guard': { tier: 'tier3', file: 'pre_tool_use_command_template_guard.py' },
      'pnpm-enforcer': { tier: 'tier3', file: 'pnpm-enforcer.py' },
    };

    spinner.text = 'Installing selected optional hooks...';
    for (const hookName of config.hooks) {
      const hookInfo = tierMapping[hookName];
      if (!hookInfo) {
        console.warn(chalk.yellow(`   ⚠ Unknown hook: ${hookName}`));
        continue;
      }

      // Try tier subdirectory first
      let sourceHook = path.join(this.packageRoot, '.claude', 'hooks', hookInfo.tier, hookInfo.file);
      
      // Fallback to root directory if not found in tier
      if (!(await fs.pathExists(sourceHook))) {
        sourceHook = path.join(this.packageRoot, '.claude', 'hooks', hookInfo.file);
      }
      
      const targetHook = path.join(hooksDir, hookInfo.file);

      if (await fs.pathExists(sourceHook)) {
        await fs.copy(sourceHook, targetHook, { overwrite: true });
        spinner.text = `Installed ${hookInfo.tier} hook: ${hookInfo.file}`;
      } else {
        console.warn(chalk.yellow(`   ⚠ Hook file not found: ${hookInfo.file}`));
      }
    }

    // Rest of the method remains the same...
  }
}