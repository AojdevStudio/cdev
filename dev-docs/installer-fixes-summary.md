# CDEV Installer Fixes Summary

This document summarizes the fixes implemented to resolve two critical installer issues.

## Issues Resolved

### 1. Incomplete Installation

**Problem**: The installer was not installing all required components (commands, agents, and tier 1 hooks), leaving the system in a broken state.

**Root Cause**: The InteractiveInstaller class was missing methods to install commands and agents directories, only installing hooks, workflow scripts, and AI docs.

**Fix**:

- Added `installCommands()` method to copy `.claude/commands/` directory
- Added `installAgents()` method to copy `.claude/agents/` directory
- Updated main `install()` method to call these new methods

### 2. Selective Installation Failure

**Problem**: The installer was not respecting user choices during interactive prompts - it wasn't installing tier 1 hooks by default and wasn't properly categorizing hooks by tiers.

**Root Causes**:

- Hook installation logic didn't understand the tier system
- Tier 1 hooks weren't being installed automatically
- Hook categorizer had conflicting tier assignments

**Fix**:

- Implemented proper tier-based hook mapping in `installHooks()` method
- Tier 1 hooks (critical security/validation) are now always installed
- Tier 2 & 3 hooks are installed based on user selection
- Updated prompts to clearly show tier levels for each hook

## Code Changes

### 1. CLI Parser (`src/cli-parser.js`)

- Updated help text to show 'init' as the primary command
- Shows 'install' as an alias for 'init'
- Updated usage examples to use `cdev init`

### 2. CLI Commands (`src/cli-commands.js`)

- Added 'init' case to command switch statement
- Routes both 'init' and 'install' to `installCommand()`

### 3. Interactive Installer (`src/interactive-installer.js`)

#### Added installCommands() method:

```javascript
async installCommands(targetDir, config) {
  const spinner = ora('Installing commands...').start();

  try {
    const commandsDir = path.join(targetDir, '.claude', 'commands');
    await fs.ensureDir(commandsDir);

    const sourceCommands = path.join(this.packageRoot, '.claude', 'commands');
    if (await fs.pathExists(sourceCommands)) {
      await fs.copy(sourceCommands, commandsDir, { overwrite: true });
      spinner.succeed('Commands installed successfully');
    } else {
      spinner.warn('Commands not found in package');
    }
  } catch (error) {
    spinner.fail('Command installation failed');
    throw error;
  }
}
```

#### Added installAgents() method:

Similar structure to installCommands, copies `.claude/agents/` directory.

#### Updated installHooks() method:

- Defined tier-based hook organization
- Tier 1 hooks are always installed (critical for security & validation)
- Tier 2 & 3 hooks installed based on user selection
- Updated prompts to show tier levels in hook descriptions

#### Updated main install() flow:

```javascript
// Install components
await this.installHooks(resolvedTargetDir, config);
await this.installCommands(resolvedTargetDir, config); // NEW
await this.installAgents(resolvedTargetDir, config); // NEW
await this.installWorkflowScripts(resolvedTargetDir, config);
await this.installAIDocs(resolvedTargetDir, config);
await this.setupLinear(resolvedTargetDir, config);
```

## Tier System Implementation

### Tier 1 (Critical - Always Installed):

- pre_tool_use.py - Core pre-execution validation
- post_tool_use.py - Core post-execution processing
- notification.py - System notifications
- stop.py - Session cleanup
- subagent_stop.py - Sub-agent cleanup

### Tier 2 (Important - User Selected):

- code-quality-reporter.py
- api-standards-checker.py
- import-organizer.py
- universal-linter.py

### Tier 3 (Optional - User Selected):

- typescript-validator.py
- task-completion-enforcer.py
- commit-message-validator.py
- command-template-guard.py
- pnpm-enforcer.py

## Testing

Created comprehensive test script (`scripts/test-installer.sh`) that verifies:

1. 'init' command is recognized
2. Commands directory is installed
3. Agents directory is installed
4. Tier 1 hooks are always installed
5. User selections for optional hooks are respected
6. Source directories exist in the package

## Impact

These fixes ensure that:

1. **Complete Installation**: All required components (commands, agents, tier 1 hooks) are installed automatically, preventing broken installations
2. **User Choice Respect**: The installer properly respects user selections for optional components while ensuring critical components are always installed
3. **Clear Communication**: Users now see which tier each hook belongs to during installation
4. **Backward Compatibility**: Both 'init' and 'install' commands work as expected

## Next Steps

1. Run the test script to verify all fixes work correctly
2. Update automated tests to cover both 'init' and 'install' commands
3. Update documentation to reflect the tier system
4. Consider adding a `--minimal` flag for truly minimal installations
