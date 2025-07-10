# API Reference

Complete API documentation for Claude Code Hooks programmatic usage.

## Table of Contents

- [CLI Commands](#cli-commands)
- [JavaScript API](#javascript-api)
- [Hook API](#hook-api)
- [Configuration Schema](#configuration-schema)
- [Event Types](#event-types)

## CLI Commands

### claude-code-hooks

Main command-line interface.

```bash
claude-code-hooks [command] [options]
```

#### Commands

##### install

Install Claude Code Hooks in a project.

```bash
claude-code-hooks install [path] [options]
```

**Arguments:**
- `path` - Target directory (default: current directory)

**Options:**
- `--yes, -y` - Skip all prompts, use defaults
- `--force, -f` - Force overwrite existing files
- `--preserve` - Preserve existing configuration
- `--pm <manager>` - Package manager (npm|pnpm|yarn|bun)
- `--preset <type>` - Project preset (nextjs|react|node|python)
- `--hooks <list>` - Comma-separated hook names to install
- `--skip-hooks <list>` - Hooks to skip
- `--no-linear` - Skip Linear integration
- `--interactive, -i` - Use interactive mode
- `--ci` - CI mode (no TTY, no prompts)

**Examples:**
```bash
# Interactive install
claude-code-hooks install

# Quick install with defaults
claude-code-hooks install --yes

# Install specific hooks only
claude-code-hooks install --hooks typescript-validator,api-standards

# Install for Next.js project
claude-code-hooks install --preset nextjs --pm pnpm
```

##### init

Initialize hooks in an existing installation.

```bash
claude-code-hooks init [options]
```

**Options:**
- `--reset` - Reset to default configuration
- `--update` - Update existing hooks

**Example:**
```bash
claude-code-hooks init --update
```

##### Parallel Development Scripts

The parallel development workflow uses individual scripts rather than subcommands:

**Cache Linear Issue:**
```bash
./scripts/cache-linear-issue.sh <LINEAR_ISSUE_ID>
```
Caches a Linear issue locally for offline access and decomposition.

**Decompose Issue:**
```bash
node scripts/decompose-parallel.cjs <LINEAR_ISSUE_ID>
```
Uses AI to analyze the cached issue and create a parallel deployment plan.

**Spawn Agent Worktrees:**
```bash
./scripts/spawn-agents.sh <DEPLOYMENT_PLAN_PATH>
```
Creates Git worktrees for each agent based on the deployment plan.

**Monitor Agents:**
```bash
./scripts/monitor-agents.sh
```
Shows progress across all active agent worktrees.

**Integrate Work:**
```bash
./scripts/integrate-parallel-work.sh
```
Merges completed agent work back to the main branch.

**Examples:**
```bash
# Complete parallel workflow
./scripts/cache-linear-issue.sh PROJ-123
node scripts/decompose-parallel.cjs PROJ-123
./scripts/spawn-agents.sh shared/deployment-plans/proj-123-deployment-plan.json
./scripts/monitor-agents.sh
```

##### doctor

Run diagnostics and health checks.

```bash
claude-code-hooks doctor [options]
```

**Options:**
- `--hooks` - Check hooks only
- `--scripts` - Check scripts only
- `--git` - Check Git configuration
- `--all` - Run all checks (default)

**Example:**
```bash
claude-code-hooks doctor --hooks
```

##### test-hooks

Test hook execution without Claude.

```bash
claude-code-hooks test-hooks [hook-name] [options]
```

**Options:**
- `--input <file>` - JSON input file
- `--all` - Test all hooks

**Example:**
```bash
claude-code-hooks test-hooks pre_tool_use --input sample.json
```

##### update

Update Claude Code Hooks to latest version.

```bash
claude-code-hooks update [options]
```

**Options:**
- `--check` - Check for updates only
- `--hooks` - Update hooks only
- `--scripts` - Update scripts only

##### uninstall

Remove Claude Code Hooks from project.

```bash
claude-code-hooks uninstall [options]
```

**Options:**
- `--keep-scripts` - Keep script files
- `--keep-config` - Keep configuration
- `--linear-only` - Remove Linear integration only

## JavaScript API

### Installer Class

Main installation interface.

```javascript
const { Installer } = require('claude-code-hooks');
```

#### Constructor

```javascript
new Installer(options)
```

**Options:**
```javascript
{
  projectPath: string,      // Target directory
  packageManager: string,   // 'npm' | 'pnpm' | 'yarn' | 'bun'
  skipPrompts: boolean,     // Skip interactive prompts
  force: boolean,          // Force overwrite
  preserve: boolean,       // Preserve existing config
  preset: string,          // Project preset
  hooks: string[],         // Specific hooks to install
  ci: boolean             // CI mode
}
```

#### Methods

##### install()

Run complete installation.

```javascript
await installer.install(targetDir, options)
```

**Example:**
```javascript
const installer = new Installer({
  packageManager: 'pnpm',
  skipPrompts: true
});

try {
  await installer.install('./my-project', {
    preset: 'nextjs',
    hooks: ['typescript-validator', 'api-standards']
  });
  console.log('Installation complete');
} catch (error) {
  console.error('Installation failed:', error);
}
```

##### detectProjectType()

Detect project framework and configuration.

```javascript
const projectInfo = await installer.detectProjectType(projectPath)
```

**Returns:**
```javascript
{
  type: 'nextjs' | 'react' | 'node' | 'python' | 'generic',
  confidence: number,  // 0-1
  packageManager: 'npm' | 'pnpm' | 'yarn',
  typescript: boolean,
  framework: string,
  version: string
}
```

##### detectPackageManager()

Detect package manager from lock files.

```javascript
const pm = await installer.detectPackageManager(projectPath)
// Returns: 'npm' | 'pnpm' | 'yarn' | 'bun'
```

### InstallSteps Class

Individual installation steps.

```javascript
const { InstallSteps } = require('claude-code-hooks');
const steps = new InstallSteps();
```

#### Methods

##### validateEnvironment()

Check system requirements.

```javascript
await steps.validateEnvironment()
// Throws if requirements not met
```

##### installHooks()

Install hook files.

```javascript
await steps.installHooks(targetDir, selectedHooks)
```

##### configureSettings()

Create/update settings.json.

```javascript
await steps.configureSettings(targetDir, config)
```

### InstallUtils Class

Utility functions.

```javascript
const { InstallUtils } = require('claude-code-hooks');
const utils = new InstallUtils();
```

#### Methods

##### copyDirectory()

Copy directory with filters.

```javascript
await utils.copyDirectory(source, dest, {
  filter: (path) => !path.includes('node_modules'),
  overwrite: false
})
```

##### updateGitignore()

Add entries to .gitignore.

```javascript
await utils.updateGitignore(projectPath, [
  '.linear-cache/',
  'logs/',
  '*.log'
])
```

## Hook API

### Hook Input Format

All hooks receive JSON input via stdin:

```json
{
  "tool": "Edit",
  "action": "pre_tool_use",
  "timestamp": "2024-01-15T10:30:00Z",
  "parameters": {
    "file_path": "/src/components/Button.tsx",
    "old_string": "const Button = () => {",
    "new_string": "const Button: React.FC = () => {"
  },
  "context": {
    "projectType": "nextjs",
    "typescript": true,
    "currentFile": "/src/components/Button.tsx"
  }
}
```

### Hook Output Format

Hooks should output JSON to stdout:

```json
{
  "status": "success" | "warning" | "error",
  "message": "Human-readable message",
  "data": {
    // Optional additional data
  },
  "suggestions": [
    // Optional improvement suggestions
  ]
}
```

### Hook Exit Codes

- `0` - Success, continue operation
- `1` - Error, block operation
- `2` - Warning, continue with caution

### Creating Custom Hooks

```python
#!/usr/bin/env python3
import json
import sys

def main():
    # Read input
    event = json.loads(sys.stdin.read())
    
    # Process event
    tool = event.get('tool')
    params = event.get('parameters', {})
    
    # Validate
    if tool == 'Edit' and params.get('file_path', '').endswith('.tsx'):
        # Your validation logic
        result = validate_typescript(params)
        
        # Output result
        print(json.dumps({
            'status': 'success' if result else 'error',
            'message': 'TypeScript validation ' + ('passed' if result else 'failed')
        }))
        
        # Exit with appropriate code
        sys.exit(0 if result else 1)

if __name__ == '__main__':
    main()
```

## Configuration Schema

### settings.json

Complete configuration schema:

```typescript
interface Settings {
  // Project information
  projectType?: 'nextjs' | 'react' | 'node' | 'python' | 'generic';
  framework?: string;
  version?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  
  // Hook configuration
  hooks?: {
    [hookName: string]: string | null | HookConfig;
  };
  
  // Validation settings
  validation?: {
    typescript?: boolean | TypeScriptConfig;
    eslint?: boolean | ESLintConfig;
    prettier?: boolean;
    tests?: boolean;
  };
  
  // Feature flags
  features?: {
    autoImports?: boolean;
    codeQualityReports?: boolean;
    testCoverage?: boolean;
    asyncHooks?: boolean;
    parallelHooks?: boolean;
  };
  
  // Performance
  performance?: {
    hookTimeout?: number;  // milliseconds
    maxFileSize?: string;  // e.g., "1MB"
    excludeDirs?: string[];
  };
  
  // Linear integration
  linear?: {
    apiKey?: string;
    cacheDir?: string;
    teamId?: string;
  };
}

interface HookConfig {
  script: string;
  enabled?: boolean;
  timeout?: number;
  conditions?: {
    files?: string[];     // glob patterns
    exclude?: string[];   // glob patterns
    tools?: string[];     // tool names
  };
}

interface TypeScriptConfig {
  enabled: boolean;
  strict?: boolean;
  compilerOptions?: any;
  exclude?: string[];
}
```

### Example Configurations

**Minimal:**
```json
{
  "projectType": "react",
  "packageManager": "npm"
}
```

**Advanced:**
```json
{
  "projectType": "nextjs",
  "packageManager": "pnpm",
  "typescript": true,
  "hooks": {
    "pre_tool_use": {
      "script": "python3 .claude/hooks/pre_tool_use.py",
      "timeout": 10000,
      "conditions": {
        "files": ["*.ts", "*.tsx"],
        "exclude": ["*.test.ts"]
      }
    }
  },
  "validation": {
    "typescript": {
      "enabled": true,
      "strict": true,
      "compilerOptions": {
        "noImplicitAny": true,
        "strictNullChecks": true
      }
    }
  },
  "features": {
    "asyncHooks": true,
    "codeQualityReports": true
  },
  "performance": {
    "hookTimeout": 5000,
    "excludeDirs": ["node_modules", ".next", "dist"]
  }
}
```

## Event Types

### Tool Events

Events triggered by Claude tool usage:

```typescript
interface ToolEvent {
  tool: 'Edit' | 'Write' | 'Read' | 'Bash' | 'Search';
  action: 'pre_tool_use' | 'post_tool_use';
  timestamp: string;
  parameters: Record<string, any>;
  result?: any;  // post_tool_use only
  error?: string;  // if tool failed
}
```

### Session Events

Events for Claude session lifecycle:

```typescript
interface SessionEvent {
  action: 'start' | 'stop' | 'subagent_stop';
  timestamp: string;
  sessionId: string;
  duration?: number;  // milliseconds, stop only
}
```

### Custom Events

Create custom events:

```javascript
// Emit custom event from hook
console.log(JSON.stringify({
  type: 'custom',
  name: 'code_quality_check',
  data: {
    complexity: 5,
    issues: [],
    suggestions: ['Consider extracting method']
  }
}));
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "TypeScript compilation failed",
    "details": {
      "file": "src/index.ts",
      "line": 42,
      "column": 13,
      "diagnostic": "Type 'string' is not assignable to type 'number'"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_FAILED` - Validation check failed
- `TIMEOUT` - Hook execution timeout
- `INVALID_INPUT` - Malformed input data
- `MISSING_DEPENDENCY` - Required tool not found
- `PERMISSION_DENIED` - Insufficient permissions
- `CONFIGURATION_ERROR` - Invalid configuration

## Examples

### Complete Installation Script

```javascript
const { Installer } = require('claude-code-hooks');

async function installForProject(projectPath) {
  const installer = new Installer({
    projectPath,
    skipPrompts: process.env.CI === 'true'
  });
  
  // Detect project type
  const projectInfo = await installer.detectProjectType(projectPath);
  console.log(`Detected: ${projectInfo.type} project`);
  
  // Install with appropriate preset
  await installer.install(projectPath, {
    preset: projectInfo.type,
    packageManager: projectInfo.packageManager
  });
  
  console.log('✅ Installation complete');
}

// Run installation
installForProject(process.cwd())
  .catch(console.error);
```

### Custom Hook Integration

```javascript
// custom-installer.js
const { Installer } = require('claude-code-hooks');
const path = require('path');

class CustomInstaller extends Installer {
  async installCustomHooks(targetDir) {
    // Add your custom hooks
    const customHooksDir = path.join(__dirname, 'my-hooks');
    await this.utils.copyDirectory(
      customHooksDir,
      path.join(targetDir, '.claude/hooks')
    );
    
    // Update configuration
    const settings = await this.loadSettings(targetDir);
    settings.hooks['my-custom-hook'] = 'python3 .claude/hooks/my-custom-hook.py';
    await this.saveSettings(targetDir, settings);
  }
}
```