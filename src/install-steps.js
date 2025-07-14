const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const chalk = require('chalk');
const fs = require('fs-extra');

const { InstallUtils } = require('./install-utils');

const execAsync = promisify(exec);

class InstallSteps {
  constructor() {
    this.utils = new InstallUtils();
  }

  async validateTargetDirectory(targetDir, options) {
    console.log(chalk.gray('  • Validating target directory...'));

    const exists = await fs.pathExists(targetDir);

    if (!exists) {
      // Create directory if it doesn't exist
      await fs.ensureDir(targetDir);
      console.log(chalk.gray(`    Created directory: ${targetDir}`));
    } else {
      // Check if directory is empty or has existing workflow
      const files = await fs.readdir(targetDir);
      const hasWorkflow =
        files.includes('workflows') || files.includes('paralell-development-claude');

      if (hasWorkflow && !options.force) {
        throw new Error(
          `Directory ${targetDir} already contains a workflow. Use --force to overwrite.`,
        );
      }

      if (files.length > 0 && !options.force) {
        const isEmpty = await this.utils.isDirectoryEmpty(targetDir);
        if (!isEmpty) {
          console.log(chalk.yellow(`    Warning: Directory ${targetDir} is not empty`));
        }
      }
    }

    // Validate write permissions
    try {
      await fs.access(targetDir, fs.constants.W_OK);
    } catch (error) {
      throw new Error(`No write permission to directory: ${targetDir}`);
    }
  }

  async validateEnvironment() {
    console.log(chalk.gray('  • Validating environment dependencies...'));

    const dependencies = [
      { name: 'Node.js', command: 'node --version', required: true },
      { name: 'Git', command: 'git --version', required: true },
      { name: 'Claude Code', command: 'claude --version', required: false },
      { name: 'npm', command: 'npm --version', required: true },
    ];

    const results = [];

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

  async createDirectoryStructure(targetDir) {
    console.log(chalk.gray('  • Creating directory structure...'));

    const directories = [
      'workflows',
      'workflows/paralell-development-claude',
      'workflows/paralell-development-claude/scripts',
      'workflows/paralell-development-claude/ai_docs',
      'shared',
      'shared/deployment-plans',
      'shared/coordination',
      'shared/reports',
      '.linear-cache',
    ];

    for (const dir of directories) {
      const fullPath = path.join(targetDir, dir);
      await fs.ensureDir(fullPath);
      console.log(chalk.gray(`    Created: ${dir}`));
    }
  }

  async copyWorkflowTemplates(targetDir) {
    console.log(chalk.gray('  • Copying workflow templates...'));

    const templateDir = path.join(__dirname, '..', 'templates');
    const workflowDir = path.join(targetDir, 'workflows', 'paralell-development-claude');

    // Copy all template files
    const templateFiles = [
      'scripts/cache-linear-issue.sh',
      'scripts/decompose-parallel.cjs',
      'scripts/spawn-agents.sh',
      'scripts/agent-commit-enhanced.sh',
      'scripts/deploy.sh',
      'scripts/integrate-parallel-work.sh',
      'scripts/monitor-agents.sh',
      'scripts/resolve-conflicts.sh',
      'scripts/validate-parallel-work.sh',
      'scripts/intelligent-agent-generator.js',
      'utils/llm-decomposer.js',
      'README.md',
      'CLAUDE.md',
      'ai_docs/claude-code-hooks-documentation.md',
      'ai_docs/custom-command-template.md',
      'ai_docs/emoji-commit-ref.md',
      'ai_docs/linear-issue-template.md',
      'ai_docs/readme-template.md',
      'ai_docs/astral-uv-scripting-documentation.md',
    ];

    // If templates directory doesn't exist, copy from current workflow
    const sourceDir = (await fs.pathExists(templateDir)) ? templateDir : path.join(__dirname, '..');

    for (const file of templateFiles) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(workflowDir, file);

      if (await fs.pathExists(sourcePath)) {
        await fs.ensureDir(path.dirname(targetPath));
        await fs.copy(sourcePath, targetPath);
        console.log(chalk.gray(`    Copied: ${file}`));
      } else {
        console.log(chalk.yellow(`    Warning: Template file not found: ${file}`));
      }
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

    // Create CLAUDE.md in .claude directory
    const claudeDir = path.join(targetDir, '.claude');
    await fs.ensureDir(claudeDir);

    const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
    const claudeMdContent = `# ${config.projectName} - Parallel Claude Development

This project uses the Parallel Claude Development Workflow.

## Custom Slash Commands

### /agent-start [workspace-path]
Load agent workspace context and begin working on assigned tasks.

### /agent-commit [workspace-path] [custom-message]
Commit completed agent work and merge back to main branch.

### /agent-status [filter]
Check status of all agent worktrees and their progress.

## Workflow Commands

Start with caching a Linear issue:
\`\`\`bash
./workflows/paralell-development-claude/scripts/cache-linear-issue.sh TASK-123
\`\`\`

Decompose into parallel agents:
\`\`\`bash
node workflows/paralell-development-claude/scripts/decompose-parallel.cjs TASK-123
\`\`\`

Spawn all agents:
\`\`\`bash
./workflows/paralell-development-claude/scripts/spawn-agents.sh shared/deployment-plans/task-123-deployment-plan.json
\`\`\`

## Import Workflow Documentation

- @workflows/paralell-development-claude/README.md - Complete workflow guide
- @workflows/paralell-development-claude/CLAUDE.md - Claude Code instructions
- @workflows/paralell-development-claude/ai_docs/ - AI-specific documentation
`;

    await fs.writeFile(claudeMdPath, claudeMdContent);
    console.log(chalk.gray(`    Created: .claude/CLAUDE.md`));

    // Create package.json if it doesn't exist
    const packageJsonPath = path.join(targetDir, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      const packageJson = {
        name: config.projectName,
        version: '1.0.0',
        description: 'Project using Parallel Claude Development Workflow',
        main: 'index.js',
        scripts: {
          decompose: 'node workflows/paralell-development-claude/scripts/decompose-parallel.cjs',
          'spawn-agents': 'workflows/paralell-development-claude/scripts/spawn-agents.sh',
          'cache-issue': 'workflows/paralell-development-claude/scripts/cache-linear-issue.sh',
        },
        dependencies: {
          dotenv: '^16.6.1',
        },
        devDependencies: {},
        keywords: ['claude', 'parallel', 'development', 'workflow'],
        author: '',
        license: 'MIT',
      };

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(chalk.gray(`    Created: package.json`));
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

  async createExampleFiles(targetDir, config) {
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

  async finalValidation(targetDir, config) {
    console.log(chalk.gray('  • Running final validation...'));

    const requiredFiles = [
      'workflows/paralell-development-claude/README.md',
      'workflows/paralell-development-claude/CLAUDE.md',
      'workflows/paralell-development-claude/scripts/cache-linear-issue.sh',
      'workflows/paralell-development-claude/scripts/decompose-parallel.cjs',
      'workflows/paralell-development-claude/scripts/spawn-agents.sh',
      '.claude/CLAUDE.md',
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

    const filesToRemove = ['.claude/CLAUDE.md', '.env.example'];

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
