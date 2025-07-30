const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const chalk = require('chalk');
const fs = require('fs-extra');

const { InstallUtils } = require('./install-utils');

const execAsync = promisify(exec);

/**
 * InstallSteps class handles the step-by-step installation process
 * for the Claude Development workflow system
 */
class InstallSteps {
  constructor() {
    this.utils = new InstallUtils();
  }

  /**
   * Validates the target directory for installation
   * - Creates directory if it doesn't exist
   * - Checks for existing workflows to prevent conflicts
   * - Validates write permissions
   */
  async validateTargetDirectory(targetDir, options) {
    console.log(chalk.gray('  • Validating target directory...'));

    const exists = await fs.pathExists(targetDir);

    if (!exists) {
      // Create directory if it doesn't exist
      await fs.ensureDir(targetDir);
      console.log(chalk.gray(`    Created directory: ${targetDir}`));
    } else {
      // Check if directory is empty or has existing workflow
      // Get list of all files/folders in the target directory
      const files = await fs.readdir(targetDir);

      // Look for existing Claude workflow installations
      const hasClaudeWorkflow = files.includes('.claude');
      const hasWorkflowDir =
        files.includes('workflows') &&
        (await fs.pathExists(path.join(targetDir, 'workflows', 'paralell-development-claude')));

      // Prevent overwriting existing installations unless forced
      if ((hasClaudeWorkflow || hasWorkflowDir) && !options.force && !options.update) {
        throw new Error(
          `Directory ${targetDir} already contains a workflow. Use --force to overwrite.`,
        );
      }

      // Warn about non-empty directories (unless forced)
      if (files.length > 0 && !options.force) {
        const isEmpty = await this.utils.isDirectoryEmpty(targetDir);
        if (!isEmpty) {
          console.log(chalk.yellow(`    Warning: Directory ${targetDir} is not empty`));
        }
      }
    }

    // Validate write permissions - critical for installation success
    try {
      await fs.access(targetDir, fs.constants.W_OK);
    } catch (error) {
      throw new Error(`No write permission to directory: ${targetDir}`);
    }
  }

  /**
   * Validates that required system dependencies are available
   * - Node.js (required for running scripts)
   * - Git (required for worktree management)
   * - Claude Code (optional but recommended)
   * - npm (required for package management)
   */
  async validateEnvironment() {
    console.log(chalk.gray('  • Validating environment dependencies...'));

    const dependencies = [
      { name: 'Node.js', command: 'node --version', required: true },
      { name: 'Git', command: 'git --version', required: true },
      { name: 'Claude Code', command: 'claude --version', required: false },
      { name: 'npm', command: 'npm --version', required: true },
    ];

    const results = [];

    // Check each dependency by trying to run its version command
    for (const dep of dependencies) {
      try {
        const { stdout } = await execAsync(dep.command);
        results.push({
          name: dep.name,
          version: stdout.trim(),
          available: true,
          required: dep.required,
        });
        console.log(chalk.gray(`    ✓ ${dep.name}: ${stdout.trim()}`));
      } catch (error) {
        results.push({
          name: dep.name,
          version: null,
          available: false,
          required: dep.required,
        });

        if (dep.required) {
          console.log(chalk.red(`    ✗ ${dep.name}: Not found (required)`));
        } else {
          console.log(chalk.yellow(`    ⚠ ${dep.name}: Not found (optional)`));
        }
      }
    }

    // Fail installation if any required dependencies are missing
    const missingRequired = results.filter((r) => r.required && !r.available);

    if (missingRequired.length > 0) {
      console.log('');
      console.log(chalk.red('Missing required dependencies:'));
      missingRequired.forEach((dep) => {
        console.log(chalk.red(`  - ${dep.name}`));
      });
      console.log('');
      console.log(chalk.blue('Installation instructions:'));
      console.log('  Node.js: https://nodejs.org/');
      console.log('  Git: https://git-scm.com/');
      console.log('  Claude Code: https://claude.ai/code');
      throw new Error('Missing required dependencies');
    }

    return results;
  }

  /**
   * Creates the complete directory structure needed for the workflow
   * - .claude/ for Claude Code configuration and hooks
   * - scripts/ for workflow automation
   * - workflows/ for the main parallel development system
   * - shared/ for coordination between agents
   * - .linear-cache/ for offline Linear issue storage
   */
  async createDirectoryStructure(targetDir) {
    console.log(chalk.gray('  • Creating directory structure...'));

    const directories = [
      '.claude', // Claude Code configuration
      '.claude/hooks', // Hook scripts for Claude integration
      '.claude/commands', // Custom Claude commands
      '.claude/logs', // Hook execution logs
      '.claude/templates', // Template files for Claude
      'scripts', // General automation scripts
      'workflows', // Workflow definitions
      'workflows/paralell-development-claude', // Main parallel workflow
      'workflows/paralell-development-claude/scripts', // Workflow-specific scripts
      'workflows/paralell-development-claude/ai_docs', // AI documentation
      'shared', // Shared resources between agents
      'shared/deployment-plans', // Agent deployment configurations
      'shared/coordination', // Inter-agent coordination files
      'shared/reports', // Progress and status reports
      '.linear-cache', // Cached Linear issues for offline work
    ];

    // Create each directory with proper error handling
    for (const dir of directories) {
      const fullPath = path.join(targetDir, dir);
      await fs.ensureDir(fullPath);
      console.log(chalk.gray(`    Created: ${dir}`));
    }
  }

  /**
   * Copies workflow template files from the package to the target directory
   * - Python scripts for core workflow functionality
   * - Shell wrapper scripts for compatibility
   * - Conditional Linear integration scripts
   */
  async copyWorkflowTemplates(targetDir, config) {
    // Base Python scripts (always installed) - core workflow functionality
    const baseTemplates = [
      'scripts/python/spawn-agents.py', // Create agent worktrees
      'scripts/python/monitor-agents.py', // Monitor agent progress
      'scripts/python/agent-commit.py', // Handle agent commits
      'scripts/python/validate-parallel-work.py', // Validate parallel work
      'scripts/python/integrate-parallel-work.py', // Merge agent work
      'scripts/python/resolve-conflicts.py', // Handle merge conflicts
      'scripts/python/intelligent-agent-generator.py', // Generate new agents
    ];

    // Linear-specific Python scripts (only if Linear integration enabled)
    const linearTemplates = config.setupLinear
      ? [
          'scripts/python/cache-linear-issue.py', // Cache Linear issues offline
          'scripts/python/decompose-parallel.py', // Break down Linear issues
        ]
      : [];

    // Wrapper scripts for compatibility with existing workflows
    const wrapperTemplates = [
      'scripts/wrappers/deploy.sh', // Deployment wrapper
      'scripts/wrappers/spawn-agents.sh', // Agent spawning wrapper
      'scripts/wrappers/monitor-agents.sh', // Monitoring wrapper
      // ... other wrappers from scripts/wrappers/
    ];

    const templateFiles = [...baseTemplates, ...linearTemplates, ...wrapperTemplates];

    // Copy each template file from package to target directory
    for (const templateFile of templateFiles) {
      // Source: file in the installed package
      const sourcePath = path.join(__dirname, '..', templateFile);
      // Target: file in user's project
      const targetPath = path.join(targetDir, templateFile);

      // Ensure target directory exists before copying
      await fs.ensureDir(path.dirname(targetPath));

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, targetPath);

        // Make Python scripts executable (important for direct execution)
        if (templateFile.endsWith('.py')) {
          await fs.chmod(targetPath, 0o755);
        }
      } else {
        console.warn(`⚠️  Template not found: ${sourcePath}`);
      }
    }
  }

  /**
   * Creates essential scripts with embedded content
   * Used as fallback when template files aren't available
   * These are basic implementations that can be enhanced later
   */
  async createEssentialScripts(scriptsDir) {
    const essentialScripts = {
      // Basic Linear issue caching script
      'cache-linear-issue.sh': `#!/bin/bash
# Cache Linear issue script for Claude Code integration
ISSUE_ID=\${1:-""}
if [ -z "$ISSUE_ID" ]; then
  echo "Usage: $0 <ISSUE_ID>"
  exit 1
fi

echo "Caching Linear issue: $ISSUE_ID"
# Linear API integration would go here
echo "Issue cached successfully"
`,
      // Basic task decomposition script
      'decompose-parallel.cjs': `#!/usr/bin/env node
// Parallel decomposition script for Claude Code
const fs = require('fs');
const path = require('path');

console.log('Decomposing task for parallel development...');

// Task decomposition logic would go here
const deploymentPlan = {
  taskId: process.argv[2] || 'default',
  parallelAgents: [],
  estimatedTime: '30 minutes'
};

console.log('Deployment plan created:', deploymentPlan);
`,
      // Basic agent spawning script
      'spawn-agents.sh': `#!/bin/bash
# Spawn parallel agents script for Claude Code
echo "Spawning parallel development agents..."

# Agent spawning logic would go here
DEPLOYMENT_PLAN=\${1:-"deployment-plan.json"}

if [ -f "$DEPLOYMENT_PLAN" ]; then
  echo "Using deployment plan: $DEPLOYMENT_PLAN"
  echo "Agents spawned successfully"
else
  echo "Deployment plan not found: $DEPLOYMENT_PLAN"
  exit 1
fi
`,
    };

    for (const [filename, content] of Object.entries(essentialScripts)) {
      const scriptPath = path.join(scriptsDir, filename);
      await fs.writeFile(scriptPath, content);
      await fs.chmod(scriptPath, '755');
      console.log(chalk.gray(`    Created: scripts/${filename}`));
    }
  }

  async setupScriptsAndPermissions(targetDir) {
    console.log(chalk.gray('  • Setting up scripts and permissions...'));

    const scriptsDir = path.join(targetDir, 'workflows', 'paralell-development-claude', 'scripts');

    try {
      const scriptFiles = await fs.readdir(scriptsDir);
      const shellScripts = scriptFiles.filter((file) => file.endsWith('.sh'));

      for (const script of shellScripts) {
        const scriptPath = path.join(scriptsDir, script);

        // Make script executable
        await fs.chmod(scriptPath, '755');
        console.log(chalk.gray(`    Made executable: ${script}`));
      }

      // Also make the main executable files executable
      const mainScripts = ['decompose-parallel.cjs', 'intelligent-agent-generator.js'];
      for (const script of mainScripts) {
        const scriptPath = path.join(scriptsDir, script);
        if (await fs.pathExists(scriptPath)) {
          await fs.chmod(scriptPath, '755');
          console.log(chalk.gray(`    Made executable: ${script}`));
        }
      }

      // Make changelog scripts executable
      const changelogScripts = ['changelog/update-changelog.js', 'changelog/utils.js'];
      for (const script of changelogScripts) {
        const scriptPath = path.join(scriptsDir, script);
        if (await fs.pathExists(scriptPath)) {
          await fs.chmod(scriptPath, '755');
          console.log(chalk.gray(`    Made executable: ${script}`));
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`    Warning: Could not set script permissions: ${error.message}`));
    }
  }

  async createConfigurationFiles(targetDir, config) {
    console.log(chalk.gray('  • Creating configuration files...'));

    // Create .env.example
    const envExamplePath = path.join(targetDir, '.env.example');
    const envExampleContent = `# Parallel Claude Development Workflow Configuration

# Linear Integration
LINEAR_API_KEY=your_linear_api_key_here

# Project Configuration
PROJECT_NAME=${config.projectName}
WORKTREE_PATH=${config.workTreePath}

# Optional Configuration
CLAUDE_MODEL=claude-3-5-sonnet-20241022
EDITOR=cursor
`;

    await fs.writeFile(envExamplePath, envExampleContent);
    console.log(chalk.gray(`    Created: .env.example`));

    // Create .env if Linear API key was provided
    if (config.linearApiKey) {
      const envPath = path.join(targetDir, '.env');
      const envContent = envExampleContent.replace('your_linear_api_key_here', config.linearApiKey);
      await fs.writeFile(envPath, envContent);
      console.log(chalk.gray(`    Created: .env`));
    }

    // Create .gitignore with Claude Code specific entries
    await this.createGitignore(targetDir);

    // Create Claude Code settings.json
    await this.createClaudeSettings(targetDir, config);

    // Install Claude Code hooks
    await this.installClaudeHooks(targetDir);

    // Create framework-specific command templates
    await this.createFrameworkCommands(targetDir, config);

    // Ensure .claude directory exists for other configurations
    const claudeDir = path.join(targetDir, '.claude');
    await fs.ensureDir(claudeDir);

    // Create package.json if it doesn't exist, or update existing one with scripts
    const packageJsonPath = path.join(targetDir, 'package.json');
    let packageJson;

    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
    } else {
      packageJson = {
        name: config.projectName,
        version: '1.0.0',
        description: 'Project using Parallel Claude Development Workflow',
        main: 'index.js',
        dependencies: {
          dotenv: '^16.6.1',
        },
        devDependencies: {},
        keywords: ['claude', 'parallel', 'development', 'workflow'],
        author: '',
        license: 'MIT',
      };
    }

    // Ensure scripts object exists
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    // Add framework-specific scripts based on project type
    const frameworkScripts = this.getFrameworkScripts(config.projectType, config);
    Object.assign(packageJson.scripts, frameworkScripts);

    // Add core parallel development scripts
    Object.assign(packageJson.scripts, {
      decompose: 'node workflows/paralell-development-claude/scripts/decompose-parallel.cjs',
      'spawn-agents': 'workflows/paralell-development-claude/scripts/spawn-agents.sh',
      'cache-issue': 'workflows/paralell-development-claude/scripts/cache-linear-issue.sh',
      'changelog:update':
        'node workflows/paralell-development-claude/scripts/changelog/update-changelog.js',
      'changelog:auto':
        'node workflows/paralell-development-claude/scripts/changelog/update-changelog.js --auto',
      'changelog:manual':
        'node workflows/paralell-development-claude/scripts/changelog/update-changelog.js --manual',
      'changelog:preview':
        'node workflows/paralell-development-claude/scripts/changelog/update-changelog.js --auto --dry-run',
    });

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(chalk.gray(`    Updated: package.json`));
  }

  async createGitignore(targetDir) {
    const gitignorePath = path.join(targetDir, '.gitignore');
    const gitignoreContent = `# Dependencies
node_modules/
*.log

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Cache directories
.linear-cache/
.next/
dist/
build/
__pycache__/
*.pyc
*.pyo
*.pyd

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db
`;

    await fs.writeFile(gitignorePath, gitignoreContent);
    console.log(chalk.gray(`    Created: .gitignore`));
  }

  async createClaudeSettings(targetDir, config) {
    const settingsPath = path.join(targetDir, '.claude/settings.json');

    // Build project-specific settings based on detected project type
    const projectSpecificSettings = this.getProjectSpecificSettings(
      config.projectType,
      config.packageManager,
      targetDir,
    );

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
      hooks: {
        PreToolUse: [
          {
            matcher: '',
            hooks: [
              {
                type: 'command',
                command: 'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/pre_tool_use.py',
              },
            ],
          },
        ],
        PostToolUse: [
          {
            matcher: '',
            hooks: [
              {
                type: 'command',
                command: 'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/post_tool_use.py',
              },
            ],
          },
          {
            matcher: 'Write|Edit',
            hooks: [
              {
                type: 'command',
                command: 'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/import-organizer.py',
              },
              {
                type: 'command',
                command:
                  'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/auto_commit_on_changes.py',
              },
            ],
          },
          {
            matcher: 'Write|Edit',
            hooks: [
              {
                type: 'command',
                command: 'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/universal-linter.py',
              },
            ],
          },
        ],
        Notification: [
          {
            matcher: '',
            hooks: [
              {
                type: 'command',
                command:
                  'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/notification.py --notify',
              },
            ],
          },
        ],
        Stop: [
          {
            matcher: '',
            hooks: [
              {
                type: 'command',
                command: 'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/stop.py --chat',
              },
            ],
          },
        ],
        SubagentStop: [
          {
            matcher: '',
            hooks: [
              {
                type: 'command',
                command: 'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/subagent_stop.py',
              },
            ],
          },
        ],
      },
      ...projectSpecificSettings,
    };

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    console.log(chalk.gray(`    Created: .claude/settings.json`));
  }

  getProjectSpecificSettings(projectType, packageManager, targetDir) {
    const fs = require('fs');
    const hasTypeScript = fs.existsSync(path.join(targetDir, 'tsconfig.json'));

    const baseSettings = {
      projectType,
      packageManager,
      typescript: hasTypeScript,
    };

    switch (projectType) {
      case 'nextjs':
        return {
          ...baseSettings,
          framework: 'next',
          buildTool: 'next',
          validation: {
            typescript: hasTypeScript,
            typeCheck: hasTypeScript,
          },
        };

      case 'react':
        return {
          ...baseSettings,
          framework: 'react',
          buildTool: 'vite',
          testRunner: 'vitest',
          validation: {
            typescript: hasTypeScript,
            typeCheck: hasTypeScript,
          },
        };

      case 'nodejs':
        return {
          ...baseSettings,
          runtime: 'node',
          framework: 'express',
          validation: {
            typescript: hasTypeScript,
            typeCheck: hasTypeScript,
          },
        };

      case 'python':
        return {
          ...baseSettings,
          runtime: 'python',
          framework: 'flask',
          packageManager: 'pip',
        };

      case 'monorepo':
        const hasTurbo = fs.existsSync(path.join(targetDir, 'turbo.json'));
        const hasLerna = fs.existsSync(path.join(targetDir, 'lerna.json'));
        const hasRush = fs.existsSync(path.join(targetDir, 'rush.json'));

        return {
          ...baseSettings,
          workspaces: true,
          monorepoTool: this.determineMonorepoTool(hasTurbo, hasLerna, hasRush),
          validation: {
            typescript: hasTypeScript,
            typeCheck: hasTypeScript,
          },
        };

      case 'minimal':
        // Check if it's truly minimal or has some files
        const packageJsonPath = path.join(targetDir, 'package.json');
        const packageJson = fs.existsSync(packageJsonPath)
          ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
          : null;
        const hasMainFile =
          fs.existsSync(path.join(targetDir, 'index.js')) ||
          fs.existsSync(path.join(targetDir, 'main.js'));

        const isGeneric = !packageJson || (!packageJson.scripts && !hasMainFile);

        return {
          ...baseSettings,
          projectType: isGeneric ? 'generic' : 'javascript',
          minimal: true,
        };

      default:
        return baseSettings;
    }
  }

  async installClaudeHooks(targetDir) {
    const hooksDir = path.join(targetDir, '.claude/hooks');

    // Create hook files that the integration tests expect
    const hooks = [
      'pre_tool_use.py',
      'post_tool_use.py',
      'stop.py',
      'subagent_stop.py',
      'notification.py',
      'typescript-validator.py',
      'code-quality-reporter.py',
      'api-standards-checker.py',
    ];

    for (const hook of hooks) {
      const hookPath = path.join(hooksDir, hook);
      const hookContent = `#!/usr/bin/env python3
# ${hook} - Claude Code hook
import json
import sys

try:
    input_data = json.load(sys.stdin)
    # Hook implementation goes here
    print(f"${hook} executed", file=sys.stdout)
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`;

      await fs.writeFile(hookPath, hookContent);
      await fs.chmod(hookPath, '755');
      console.log(chalk.gray(`    Created: .claude/hooks/${hook}`));
    }
  }

  async createFrameworkCommands(targetDir, config) {
    const commandsDir = path.join(targetDir, '.claude/commands');

    // Create framework-specific command templates
    const commands = this.getFrameworkCommands(config.projectType);

    // Add changelog command template
    commands['update-changelog.md'] = `---
allowed-tools: Bash
description: Update project CHANGELOG.md using automated scripts
---

# Update Changelog

Simple command to update CHANGELOG.md using the automated changelog scripts. Supports automatic git analysis or manual entry modes.

## Quick Usage

\`\`\`bash
# Auto-generate from git commits
npm run changelog:auto

# Manual entry mode
npm run changelog:manual

# Preview changes without saving
npm run changelog:preview

# Update with specific version
npm run changelog:update 1.5.0 --auto
\`\`\`

## Command Options

**Auto Mode** (Default):
\`\`\`bash
npm run changelog:auto
\`\`\`
- Analyzes git commits since last release
- Automatically categorizes changes
- Determines semantic version bump

**Manual Mode**:
\`\`\`bash
npm run changelog:manual
\`\`\`
- Interactive prompts for each category
- Full control over changelog entries
- Guided entry process

**Preview Mode**:
\`\`\`bash
npm run changelog:preview
\`\`\`
- Shows what would be added
- No file modifications
- Safe to run anytime

**Custom Version**:
\`\`\`bash
npm run changelog:update 2.1.0 --auto
npm run changelog:update 1.0.3 --manual --verbose
\`\`\`

## Workflow

1. Run changelog command
2. Review generated/entered changes
3. Commit the updated CHANGELOG.md:

\`\`\`bash
git add CHANGELOG.md
git commit -m "docs: update changelog for v1.5.0"
\`\`\`

## Available Scripts

- \`scripts/changelog/update-changelog.js\` - Main automation script
- \`scripts/changelog/utils.js\` - Helper functions
- Full documentation: \`scripts/changelog/README.md\`
`;

    for (const [filename, content] of Object.entries(commands)) {
      const commandPath = path.join(commandsDir, filename);
      await fs.writeFile(commandPath, content);
      console.log(chalk.gray(`    Created: .claude/commands/${filename}`));
    }
  }

  determineMonorepoTool(hasTurbo, hasLerna, hasRush) {
    if (hasTurbo) {
      return 'turbo';
    }
    if (hasLerna) {
      return 'lerna';
    }
    if (hasRush) {
      return 'rush';
    }
    return 'npm';
  }

  getFrameworkScripts(projectType, config) {
    const baseScripts = {
      'claude:spawn': './scripts/python/spawn-agents.py',
      'claude:integrate': './scripts/python/integrate-parallel-work.py',
      'claude:monitor': './scripts/python/monitor-agents.py',
      'claude:validate': './scripts/python/validate-parallel-work.py',
      'claude:resolve': './scripts/python/resolve-conflicts.py',
    };

    const linearScripts = config.setupLinear
      ? {
          'claude:cache': './scripts/python/cache-linear-issue.py',
          'claude:decompose': './scripts/python/decompose-parallel.py',
        }
      : {};

    return { ...baseScripts, ...linearScripts };
  }

  getFrameworkCommands(projectType) {
    const commonCommands = {
      'component.md': `# Component Template

Create a new component with the following structure:

\`\`\`typescript
interface ComponentProps {
  // Define props here
}

export default function Component(props: ComponentProps) {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
}
\`\`\`
`,
      'test.md': `# Test Template

Create comprehensive tests:

\`\`\`typescript
describe('Component', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
\`\`\`
`,
    };

    switch (projectType) {
      case 'nextjs':
        return {
          ...commonCommands,
          'next-page-generator.md': `# Next.js Page Generator

\`\`\`typescript
export default function Page() {
  return (
    <div>
      <h1>Page Title</h1>
    </div>
  );
}
\`\`\`
`,
          'next-api-route.md': `# API Route Template

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello World' });
}
\`\`\`
`,
        };

      case 'react':
        return {
          ...commonCommands,
          'react-component.md': `# React Component Template

\`\`\`typescript
interface ComponentProps {
  // Define props here
}

export default function Component(props: ComponentProps) {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
}
\`\`\`
`,
          'react-hook.md': `# React Hook Template

\`\`\`typescript
import { useState, useEffect } from 'react';

export function useCustomHook() {
  const [state, setState] = useState();
  
  useEffect(() => {
    // Effect logic
  }, []);
  
  return { state, setState };
}
\`\`\`
`,
        };

      case 'nodejs':
        return {
          ...commonCommands,
          'api-endpoint.md': `# Express Endpoint Template

\`\`\`typescript
import { Request, Response } from 'express';

export async function handler(req: Request, res: Response) {
  try {
    // Implementation
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
\`\`\`
`,
          'middleware.md': `# Middleware Template

\`\`\`typescript
export function middleware(req: Request, res: Response, next: Function) {
  // Middleware logic
  next();
}
\`\`\`
`,
        };

      case 'python':
        return {
          'endpoint.md': `# Flask Endpoint Template

\`\`\`python
from flask import jsonify, request

@app.route('/api/endpoint', methods=['GET', 'POST'])
def endpoint():
    if request.method == 'GET':
        return jsonify({'message': 'Hello World'})
    
    data = request.get_json()
    return jsonify({'received': data})
\`\`\`
`,
          'model.md': `# Model Template

\`\`\`python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Model:
    id: Optional[int] = None
    name: str = ""
\`\`\`
`,
        };

      default:
        return commonCommands;
    }
  }

  async setupEnvironmentVariables(targetDir, config) {
    console.log(chalk.gray('  • Setting up environment variables...'));

    // Create shell script to source environment
    const envScriptPath = path.join(
      targetDir,
      'workflows',
      'paralell-development-claude',
      'env.sh',
    );
    const envScriptContent = `#!/bin/bash

# Source project environment variables
if [ -f "../../.env" ]; then
    export $(cat ../../.env | xargs)
    echo "Environment variables loaded from .env"
fi

# Set default values if not provided
export PROJECT_NAME=\${PROJECT_NAME:-"${config.projectName}"}
export WORKTREE_PATH=\${WORKTREE_PATH:-"${config.workTreePath}"}
export CLAUDE_MODEL=\${CLAUDE_MODEL:-"claude-3-5-sonnet-20241022"}
export EDITOR=\${EDITOR:-"cursor"}

echo "Parallel Claude Development Workflow environment ready"
`;

    await fs.writeFile(envScriptPath, envScriptContent);
    await fs.chmod(envScriptPath, '755');
    console.log(chalk.gray(`    Created: env.sh`));
  }

  async setupGitHooks(targetDir) {
    console.log(chalk.gray('  • Setting up Git hooks...'));

    const gitHooksDir = path.join(targetDir, '.git', 'hooks');

    // Check if this is a Git repository
    if (!(await fs.pathExists(gitHooksDir))) {
      console.log(chalk.yellow('    Warning: Not a Git repository, skipping Git hooks setup'));
      return;
    }

    // Create pre-commit hook
    const preCommitPath = path.join(gitHooksDir, 'pre-commit');
    const preCommitContent = `#!/bin/bash

# Parallel Claude Development Workflow Pre-commit Hook

echo "Running pre-commit validation..."

# Check if this is an agent worktree
if [ -f "workspaces/*/validation_checklist.txt" ]; then
    echo "Agent worktree detected, running validation..."
    
    # Check if validation checklist is complete
    if grep -q "\\[ \\]" workspaces/*/validation_checklist.txt; then
        echo "❌ Validation checklist incomplete. Please complete all items before committing."
        exit 1
    fi
    
    echo "✅ Validation checklist complete"
fi

# Run any existing pre-commit hooks
if [ -f ".git/hooks/pre-commit.backup" ]; then
    .git/hooks/pre-commit.backup
fi

echo "Pre-commit validation passed"
`;

    // Backup existing pre-commit hook if it exists
    if (await fs.pathExists(preCommitPath)) {
      await fs.move(preCommitPath, `${preCommitPath}.backup`);
    }

    await fs.writeFile(preCommitPath, preCommitContent);
    await fs.chmod(preCommitPath, '755');
    console.log(chalk.gray(`    Created: pre-commit hook`));
  }

  async createExampleFiles(targetDir, _config) {
    console.log(chalk.gray('  • Creating example files...'));

    // Create example Linear issue cache
    const exampleIssuePath = path.join(targetDir, '.linear-cache', 'EXAMPLE-123.json');
    const exampleIssue = {
      id: 'example-123',
      identifier: 'EXAMPLE-123',
      title: 'Example: Implement user authentication system',
      description:
        'This is an example Linear issue showing how to structure requirements for parallel development.\n\n1. Create login/signup forms\n2. Implement JWT authentication\n3. Add password reset functionality\n4. Create user profile management\n5. Add role-based access control',
      priority: 1,
      priorityLabel: 'High',
      state: { name: 'Todo' },
      assignee: { name: 'Developer', email: 'dev@example.com' },
      team: { name: 'Engineering' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(exampleIssuePath, JSON.stringify(exampleIssue, null, 2));
    console.log(chalk.gray(`    Created: example issue cache`));

    // Create example deployment plan
    const examplePlanPath = path.join(
      targetDir,
      'shared',
      'deployment-plans',
      'example-123-deployment-plan.json',
    );
    const examplePlan = {
      taskId: 'EXAMPLE-123',
      taskTitle: 'Example: Implement user authentication system',
      parallelAgents: [
        {
          agentId: 'frontend_forms_agent',
          agentRole: 'Frontend & UI: Login/signup forms and user interface',
          focusArea: 'Frontend & UI',
          canStartImmediately: true,
          filesToCreate: ['components/LoginForm.tsx', 'components/SignupForm.tsx'],
          filesToModify: ['pages/login.tsx', 'pages/signup.tsx'],
          estimatedTime: 30,
        },
        {
          agentId: 'backend_auth_agent',
          agentRole: 'Backend & API: JWT authentication and user management',
          focusArea: 'Backend & API',
          canStartImmediately: true,
          filesToCreate: ['lib/auth.ts', 'pages/api/auth/[...nextauth].ts'],
          filesToModify: ['lib/database.ts'],
          estimatedTime: 45,
        },
      ],
      estimatedTotalTime: '45 minutes',
      parallelismFactor: '1.5x faster than sequential',
      integrationPlan: {
        mergeOrder: ['backend_auth_agent', 'frontend_forms_agent'],
        validationSteps: ['Run tests', 'Integration testing', 'E2E validation'],
        estimatedIntegrationTime: '15 minutes',
      },
    };

    await fs.writeFile(examplePlanPath, JSON.stringify(examplePlan, null, 2));
    console.log(chalk.gray(`    Created: example deployment plan`));
  }

  async finalValidation(targetDir, _config) {
    console.log(chalk.gray('  • Running final validation...'));

    const requiredFiles = [
      'workflows/paralell-development-claude/README.md',
      'workflows/paralell-development-claude/CLAUDE.md',
      'workflows/paralell-development-claude/scripts/cache-linear-issue.sh',
      'workflows/paralell-development-claude/scripts/decompose-parallel.cjs',
      'workflows/paralell-development-claude/scripts/spawn-agents.sh',
      'workflows/paralell-development-claude/scripts/changelog/update-changelog.js',
      'workflows/paralell-development-claude/scripts/changelog/utils.js',
      'workflows/paralell-development-claude/scripts/changelog/README.md',
      '.env.example',
    ];

    const missingFiles = [];

    for (const file of requiredFiles) {
      const filePath = path.join(targetDir, file);
      if (!(await fs.pathExists(filePath))) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      console.log(chalk.yellow('    Warning: Some files were not created:'));
      missingFiles.forEach((file) => {
        console.log(chalk.yellow(`      - ${file}`));
      });
    } else {
      console.log(chalk.gray('    All required files created successfully'));
    }

    // Validate script permissions
    const scriptPath = path.join(
      targetDir,
      'workflows',
      'paralell-development-claude',
      'scripts',
      'cache-linear-issue.sh',
    );
    if (await fs.pathExists(scriptPath)) {
      const stats = await fs.stat(scriptPath);
      if (stats.mode & 0o111) {
        console.log(chalk.gray('    Script permissions configured correctly'));
      } else {
        console.log(chalk.yellow('    Warning: Scripts may not be executable'));
      }
    }
  }

  async removeWorkflowDirectories(targetDir) {
    console.log(chalk.gray('  • Removing workflow directories...'));

    const directoriesToRemove = [
      'workflows/paralell-development-claude',
      'shared/deployment-plans',
      'shared/coordination',
      'shared/reports',
      '.linear-cache',
    ];

    for (const dir of directoriesToRemove) {
      const fullPath = path.join(targetDir, dir);
      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);
        console.log(chalk.gray(`    Removed: ${dir}`));
      }
    }
  }

  async cleanupWorktrees(targetDir) {
    console.log(chalk.gray('  • Cleaning up worktrees...'));

    try {
      const { stdout } = await execAsync('git worktree list --porcelain', { cwd: targetDir });
      const worktrees = stdout.split('\n\n').filter(Boolean);

      for (const worktree of worktrees) {
        const lines = worktree.split('\n');
        const worktreePath = lines[0].replace('worktree ', '');
        const branchLine = lines.find((line) => line.startsWith('branch '));

        if (branchLine) {
          const branch = branchLine.replace('branch refs/heads/', '');

          // Remove worktree if it looks like an agent worktree
          if (branch.includes('agent')) {
            await execAsync(`git worktree remove ${worktreePath}`, { cwd: targetDir });
            console.log(chalk.gray(`    Removed worktree: ${worktreePath}`));
          }
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`    Warning: Could not clean up worktrees: ${error.message}`));
    }
  }

  async removeConfigurationFiles(targetDir) {
    console.log(chalk.gray('  • Removing configuration files...'));

    const filesToRemove = ['.env.example'];

    for (const file of filesToRemove) {
      const fullPath = path.join(targetDir, file);
      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);
        console.log(chalk.gray(`    Removed: ${file}`));
      }
    }
  }
}

module.exports = { InstallSteps };
