# @aojdevstudio/cdev API Reference

> **Complete API documentation for cdev's programmatic usage, CLI commands, and hook system**

## Table of Contents

- [Quick Start](#quick-start)
- [CLI Commands](#cli-commands)
- [JavaScript API](#javascript-api)
- [Hook API](#hook-api)
- [Configuration Schema](#configuration-schema)
- [Event Types](#event-types)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Quick Start

### Installation

```bash
# Install globally
npm install -g @aojdevstudio/cdev

# Or use directly with npx
npx @aojdevstudio/cdev install
```

### Basic Usage

```bash
# Interactive installation
cdev install

# Quick install with defaults
cdev install --yes

# Get Linear issue and decompose
cdev get PROJ-123
cdev split PROJ-123

# Monitor agent progress
cdev status
```

## CLI Commands

### Main Command

```bash
cdev [command] [options]
```

### Global Options

- `--help, -h` - Show help information
- `--version, -v` - Show version number
- `--verbose` - Enable verbose logging
- `--quiet` - Suppress non-error output

### Commands

#### `install`

Install cdev in your project with intelligent setup detection.

```bash
cdev install [path] [options]
```

**Arguments:**

- `path` - Target directory (default: current directory)

**Options:**

- `--yes, -y` - Skip all prompts, use defaults
- `--force, -f` - Force overwrite existing files
- `--preserve` - Preserve existing configuration
- `--hooks <list>` - Comma-separated hook names to install
- `--skip-hooks <list>` - Hooks to skip
- `--no-linear` - Skip Linear integration
- `--interactive, -i` - Use interactive mode (default)

**Examples:**

```bash
# Interactive install (recommended)
cdev install

# Quick install with defaults
cdev install --yes

# Install specific hooks only
cdev install --hooks typescript-validator,pre_tool_use

# Install in specific directory
cdev install ./my-project --preserve
```

#### `get` (alias: `cache`)

Cache a Linear issue locally for offline access and parallel decomposition.

```bash
cdev get <issue-id> [options]
```

**Arguments:**

- `issue-id` - Linear issue ID (e.g., PROJ-123)

**Options:**

- `--refresh` - Force refresh even if cached
- `--include-comments` - Include issue comments
- `--include-attachments` - Download attachments

**Examples:**

```bash
# Cache issue for decomposition
cdev get PROJ-123

# Force refresh with comments
cdev get PROJ-123 --refresh --include-comments
```

#### `split` (alias: `decompose`)

Decompose a cached Linear issue into parallel agent tasks using AI analysis.

```bash
cdev split <issue-id> [options]
```

**Arguments:**

- `issue-id` - Linear issue ID to decompose

**Options:**

- `--max-agents <n>` - Maximum number of agents (default: 8)
- `--strategy <type>` - Decomposition strategy: 'feature' | 'layer' | 'auto'
- `--output <path>` - Custom output path for deployment plan

**Examples:**

```bash
# Auto-decompose with smart defaults
cdev split PROJ-123

# Limit to 4 agents with feature-based split
cdev split PROJ-123 --max-agents 4 --strategy feature
```

#### `run` (alias: `spawn`)

Create git worktrees and spawn parallel agents based on deployment plan.

```bash
cdev run <plan-file> [options]
```

**Arguments:**

- `plan-file` - Path to deployment plan JSON

**Options:**

- `--dry-run` - Show what would be created without doing it
- `--open-in <editor>` - Open worktrees in: 'cursor' | 'vscode' | 'terminal'
- `--sequential` - Create agents one at a time

**Examples:**

```bash
# Spawn agents from deployment plan
cdev run shared/deployment-plans/proj-123-deployment-plan.json

# Dry run to preview
cdev run plan.json --dry-run

# Open in terminal instead of Cursor
cdev run plan.json --open-in terminal
```

#### `status`

Monitor progress across all active agent worktrees.

```bash
cdev status [options]
```

**Options:**

- `--watch, -w` - Auto-refresh every 5 seconds
- `--format <type>` - Output format: 'table' | 'json' | 'minimal'
- `--filter <status>` - Filter by status: 'active' | 'complete' | 'blocked'

**Examples:**

```bash
# Show current status
cdev status

# Watch mode with auto-refresh
cdev status --watch

# JSON output for scripting
cdev status --format json
```

#### `commit`

Validate and merge completed agent work back to main branch.

```bash
cdev commit <agent-name> [options]
```

**Arguments:**

- `agent-name` - Name of agent to commit

**Options:**

- `--message <msg>` - Custom commit message
- `--no-validate` - Skip validation checks
- `--squash` - Squash commits before merge

**Examples:**

```bash
# Commit agent with validation
cdev commit backend_api_agent

# Custom message
cdev commit frontend_agent --message "feat: implement user dashboard"
```

#### `doctor`

Run diagnostics and health checks on your cdev installation.

```bash
cdev doctor [options]
```

**Options:**

- `--fix` - Attempt to fix issues automatically
- `--hooks` - Check hooks only
- `--config` - Check configuration only

**Examples:**

```bash
# Full health check
cdev doctor

# Fix issues automatically
cdev doctor --fix
```

## JavaScript API

### Core Classes

#### Installer

Main installation and setup interface.

```javascript
const { Installer } = require('@aojdevstudio/cdev');
```

##### Constructor

```javascript
const installer = new Installer(options);
```

**Options:**

```javascript
{
  projectPath: string,      // Target directory
  packageManager: string,   // 'npm' | 'pnpm' | 'yarn' | 'bun'
  skipPrompts: boolean,     // Skip interactive prompts
  force: boolean,          // Force overwrite
  preserve: boolean,       // Preserve existing config
  hooks: string[],         // Specific hooks to install
  ci: boolean             // CI mode
}
```

##### Methods

###### `install(targetDir, options)`

Run complete installation process.

```javascript
await installer.install('./my-project', {
  hooks: ['typescript-validator', 'pre_tool_use'],
  skipLinear: false,
});
```

###### `detectProjectType(projectPath)`

Intelligently detect project framework and configuration.

```javascript
const projectInfo = await installer.detectProjectType('./');
// Returns:
{
  type: 'nextjs',        // 'nextjs' | 'react' | 'node' | 'python' | 'generic'
  confidence: 0.95,      // 0-1 confidence score
  packageManager: 'pnpm',
  typescript: true,
  framework: 'Next.js',
  version: '14.0.0'
}
```

#### InteractiveInstaller

Enhanced installer with interactive CLI prompts.

```javascript
const InteractiveInstaller = require('@aojdevstudio/cdev');

const installer = new InteractiveInstaller();
await installer.run('./my-project');
```

#### HookManager

Manage hook lifecycle and execution.

```javascript
const { HookManager } = require('@aojdevstudio/cdev');

const manager = new HookManager({
  projectRoot: process.cwd(),
  timeout: 5000,
});

// List available hooks
const hooks = await manager.listHooks();

// Enable/disable hooks
await manager.enableHook('typescript-validator');
await manager.disableHook('notification');

// Test hook execution
const result = await manager.testHook('pre_tool_use', {
  tool: 'Edit',
  parameters: { file_path: 'test.ts' },
});
```

#### Validator

Validation system for configuration and installation.

```javascript
const { Validator } = require('@aojdevstudio/cdev');

const validator = new Validator();

// Validate installation
const results = await validator.validateInstallation('./');
if (!results.valid) {
  console.error('Issues found:', results.errors);
}

// Validate configuration
const configValid = await validator.validateConfig(config);
```

#### ConfigManager

Configuration management and persistence.

```javascript
const { ConfigManager } = require('@aojdevstudio/cdev');

const config = new ConfigManager('./project');

// Load configuration
await config.load();

// Update settings
config.set('hooks.typescript-validator', {
  enabled: true,
  strict: true,
});

// Save changes
await config.save();
```

## Hook API

### Hook Development

Hooks are Python or JavaScript scripts that intercept Claude's actions.

#### Python Hook Template

```python
#!/usr/bin/env python3
"""
Hook Name: my-custom-hook
Purpose: Validate specific patterns in code
Tier: 2 (can be disabled)
"""

import json
import sys
import re

def main():
    try:
        # Read input from Claude
        input_data = json.load(sys.stdin)

        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})

        # Your validation logic
        if tool_name == 'Edit':
            file_path = tool_input.get('file_path', '')
            new_content = tool_input.get('new_string', '')

            # Example: Check for console.log in production
            if file_path.endswith('.js') and 'console.log' in new_content:
                print("WARNING: console.log detected in production code", file=sys.stderr)
                sys.exit(2)  # Warning but allow

        # Success - allow action
        sys.exit(0)

    except Exception as e:
        # Fail gracefully
        print(f"Hook error: {str(e)}", file=sys.stderr)
        sys.exit(0)  # Don't block on errors

if __name__ == '__main__':
    main()
```

#### JavaScript Hook Template

```javascript
#!/usr/bin/env node
/**
 * Hook Name: my-custom-hook
 * Purpose: Validate specific patterns
 * Tier: 2 (can be disabled)
 */

const fs = require('fs');

// Read input from stdin
let inputData = '';
process.stdin.on('data', (chunk) => (inputData += chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(inputData);
    const { tool_name, tool_input } = data;

    // Your validation logic
    if (tool_name === 'Edit' && tool_input.file_path?.endsWith('.tsx')) {
      // Example validation
      if (!tool_input.new_string.includes('React.FC')) {
        console.error('WARNING: Consider using React.FC for type safety');
        process.exit(2); // Warning
      }
    }

    // Success
    process.exit(0);
  } catch (error) {
    console.error(`Hook error: ${error.message}`);
    process.exit(0); // Don't block on errors
  }
});
```

### Hook Input Schema

```typescript
interface HookInput {
  tool_name: 'Edit' | 'Write' | 'Read' | 'Bash' | 'Task';
  tool_input: {
    // For Edit tool
    file_path?: string;
    old_string?: string;
    new_string?: string;

    // For Write tool
    content?: string;

    // For Bash tool
    command?: string;

    // For Read tool
    limit?: number;
    offset?: number;
  };
  context?: {
    project_type: string;
    current_file: string;
    git_branch: string;
  };
}
```

### Hook Exit Codes

- `0` - Success, allow action
- `1` - Error, block action (reserved, use 2 instead)
- `2` - Block action with message
- `3-255` - Custom codes for specific scenarios

## Configuration Schema

### `.cdev/config.json`

Main configuration file for cdev.

```typescript
interface CdevConfig {
  // Project settings
  project: {
    type: 'nextjs' | 'react' | 'node' | 'python' | 'generic';
    name: string;
    version: string;
    packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  };

  // Hook configuration
  hooks: {
    tiers: {
      1: boolean; // Always true (cannot disable)
      2: boolean; // Productivity hooks
      3: boolean; // Optional features
    };
    custom: string[]; // Paths to custom hooks
    disabled: string[]; // Specific hooks to disable
    config: {
      [hookName: string]: any; // Hook-specific config
    };
  };

  // Linear integration
  linear?: {
    enabled: boolean;
    apiKey?: string; // Can use env var LINEAR_API_KEY
    teamId?: string;
    cacheDir: string;
  };

  // Agent configuration
  agents: {
    maxConcurrent: number; // Max parallel agents
    defaultStrategy: string; // Decomposition strategy
    worktreePrefix: string; // Prefix for worktree names
    openIn: 'cursor' | 'vscode' | 'terminal';
  };

  // Performance settings
  performance: {
    hookTimeout: number; // Milliseconds
    maxFileSize: string; // e.g., "10MB"
    excludeDirs: string[]; // Dirs to ignore
  };
}
```

### Example Configuration

```json
{
  "project": {
    "type": "nextjs",
    "name": "my-app",
    "version": "1.0.0",
    "packageManager": "pnpm"
  },
  "hooks": {
    "tiers": {
      "1": true,
      "2": true,
      "3": false
    },
    "disabled": ["notification"],
    "config": {
      "typescript-validator": {
        "strict": true,
        "noImplicitAny": true
      },
      "commit-message-validator": {
        "maxLength": 72,
        "requireEmoji": true
      }
    }
  },
  "linear": {
    "enabled": true,
    "teamId": "TEAM-123",
    "cacheDir": ".linear-cache"
  },
  "agents": {
    "maxConcurrent": 8,
    "defaultStrategy": "auto",
    "worktreePrefix": "agent",
    "openIn": "cursor"
  },
  "performance": {
    "hookTimeout": 5000,
    "maxFileSize": "10MB",
    "excludeDirs": ["node_modules", ".next", "dist"]
  }
}
```

## Event Types

### Tool Events

Events emitted when Claude uses tools.

```typescript
interface ToolEvent {
  type: 'tool';
  action: 'pre' | 'post';
  tool: string;
  timestamp: number;
  data: any;
  result?: any; // post events only
  error?: Error; // if failed
}
```

### Hook Events

Events from hook execution.

```typescript
interface HookEvent {
  type: 'hook';
  name: string;
  action: 'start' | 'complete' | 'error' | 'timeout';
  duration?: number; // milliseconds
  exitCode?: number;
  message?: string;
}
```

### Agent Events

Events from parallel agent system.

```typescript
interface AgentEvent {
  type: 'agent';
  agentId: string;
  action: 'created' | 'started' | 'progress' | 'completed' | 'failed';
  data: {
    worktreePath?: string;
    progress?: number; // 0-100
    message?: string;
    error?: Error;
  };
}
```

## Error Handling

### Error Classes

```javascript
const {
  InstallationError,
  ConfigurationError,
  HookExecutionError,
  LinearIntegrationError,
  ValidationError,
} = require('@aojdevstudio/cdev/errors');
```

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    suggestions?: string[];
  };
}
```

### Common Error Codes

| Code                   | Description                  | Suggested Action                  |
| ---------------------- | ---------------------------- | --------------------------------- |
| `INSTALL_FAILED`       | Installation process failed  | Check permissions and retry       |
| `INVALID_CONFIG`       | Configuration file invalid   | Validate JSON syntax              |
| `HOOK_TIMEOUT`         | Hook execution timeout       | Increase timeout or optimize hook |
| `HOOK_ERROR`           | Hook returned error          | Check hook logs                   |
| `LINEAR_AUTH`          | Linear authentication failed | Verify API key                    |
| `PROJECT_TYPE_UNKNOWN` | Cannot detect project type   | Specify type manually             |
| `PERMISSION_DENIED`    | Insufficient permissions     | Run with appropriate permissions  |

## Examples

### Complete Installation Script

```javascript
const { Installer, ConfigManager } = require('@aojdevstudio/cdev');

async function setupProject() {
  // Create installer
  const installer = new Installer({
    skipPrompts: process.env.CI === 'true',
    packageManager: 'pnpm',
  });

  try {
    // Detect project
    const projectInfo = await installer.detectProjectType('.');
    console.log(`Detected: ${projectInfo.type} project`);

    // Install with appropriate settings
    await installer.install('.', {
      hooks: ['typescript-validator', 'pre_tool_use'],
      preserve: true,
    });

    // Configure Linear integration
    const config = new ConfigManager('.');
    await config.load();
    config.set('linear.enabled', true);
    config.set('linear.teamId', process.env.LINEAR_TEAM_ID);
    await config.save();

    console.log('✅ Setup complete!');
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

setupProject();
```

### Custom Hook Registration

```javascript
const { HookManager } = require('@aojdevstudio/cdev');

async function registerCustomHook() {
  const manager = new HookManager({
    projectRoot: process.cwd(),
  });

  // Register custom hook
  await manager.registerHook({
    name: 'my-security-checker',
    script: '.cdev/hooks/security-check.py',
    tier: 2,
    enabled: true,
    config: {
      scanPatterns: ['*.js', '*.ts'],
      excludePatterns: ['*.test.js'],
    },
  });

  // Test the hook
  const result = await manager.testHook('my-security-checker', {
    tool_name: 'Edit',
    tool_input: {
      file_path: 'src/api.js',
      new_string: 'const apiKey = "sk-1234";',
    },
  });

  console.log('Hook test result:', result);
}
```

### Parallel Workflow Automation

```javascript
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

async function automateWorkflow(issueId) {
  try {
    // 1. Cache Linear issue
    console.log('📥 Caching issue...');
    await exec(`cdev get ${issueId}`);

    // 2. Decompose into agents
    console.log('🔄 Decomposing...');
    await exec(`cdev split ${issueId}`);

    // 3. Spawn agents
    console.log('🚀 Spawning agents...');
    const planPath = `shared/deployment-plans/${issueId.toLowerCase()}-deployment-plan.json`;
    await exec(`cdev run ${planPath}`);

    // 4. Monitor progress
    console.log('📊 Monitoring progress...');
    const monitor = spawn('cdev', ['status', '--watch'], {
      stdio: 'inherit',
    });

    // Handle exit
    process.on('SIGINT', () => {
      monitor.kill();
      process.exit();
    });
  } catch (error) {
    console.error('Workflow failed:', error);
  }
}

// Usage
automateWorkflow('PROJ-123');
```

---

## Next Steps

1. **Install cdev**: `npm install -g @aojdevstudio/cdev`
2. **Run setup**: `cdev install`
3. **Configure Linear**: Set up API key for issue integration
4. **Customize hooks**: Add project-specific validations
5. **Start developing**: Use parallel agents for faster delivery

For more information:

- [GitHub Repository](https://github.com/AOJDevStudio/cdev)
- [Hook Examples](.claude/hooks/)
- [Troubleshooting Guide](./troubleshooting.md)

**Last Updated**: July 2025
