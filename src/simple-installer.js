const path = require('path');

const fs = require('fs-extra');
const chalk = require('chalk');
const ora = require('ora');

class SimpleInstaller {
  constructor() {
    this.packageRoot = path.join(__dirname, '..');
  }

  async install(targetDir = '.') {
    const spinner = ora('Installing cdev files to your project...').start();

    try {
      const resolvedTargetDir = path.resolve(targetDir);

      // Ensure target directory exists
      await fs.ensureDir(resolvedTargetDir);

      // Create .claude directory structure
      spinner.text = 'Creating .claude directory structure...';
      await this.createClaudeDirectory(resolvedTargetDir);

      // Copy hook configurations
      spinner.text = 'Setting up hooks...';
      await this.copyHookConfigurations(resolvedTargetDir);

      // Copy command templates
      spinner.text = 'Installing command templates...';
      await this.copyCommandTemplates(resolvedTargetDir);

      // Copy workflow scripts
      spinner.text = 'Installing workflow scripts...';
      await this.copyWorkflowScripts(resolvedTargetDir);

      // Copy AI documentation
      spinner.text = 'Installing AI documentation...';
      await this.copyAIDocs(resolvedTargetDir);

      // Create example configuration
      spinner.text = 'Creating example configuration...';
      await this.createExampleConfig(resolvedTargetDir);

      // Set permissions
      spinner.text = 'Setting file permissions...';
      await this.setPermissions(resolvedTargetDir);

      spinner.succeed('cdev installation complete!');

      console.log('');
      console.log(chalk.green('✅ Successfully installed cdev files to your project!'));
      console.log('');
      console.log(chalk.yellow('Files installed:'));
      console.log('  • .claude/              - Claude Code configuration directory');
      console.log('  • .claude/hooks/        - Hook scripts and configurations');
      console.log('  • .claude/commands/     - Custom Claude commands');
      console.log('  • scripts/              - Workflow automation scripts');
      console.log('  • ai-docs/              - AI documentation templates');
      console.log('  • .env.example          - Example environment configuration');
      console.log('');
      console.log(chalk.cyan('Next steps:'));
      console.log('  1. Review .claude/settings.json to customize hooks');
      console.log('  2. Copy .env.example to .env and add your Linear API key');
      console.log('  3. Run: claude (to start using Claude Code with hooks)');
      console.log('');
    } catch (error) {
      spinner.fail('Installation failed');
      throw error;
    }
  }

  async createClaudeDirectory(targetDir) {
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

  async copyHookConfigurations(targetDir) {
    const claudeDir = path.join(targetDir, '.claude');

    // Create settings.json with hook configurations
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
            matcher: 'Bash',
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
            matcher: 'Bash|Write|Edit|MultiEdit|TodoWrite',
            hooks: [
              {
                type: 'command',
                command: 'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/post_tool_use.py',
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
                command: 'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/notification.py',
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
                command: 'cd "$CLAUDE_PROJECT_DIR" && uv run .claude/hooks/stop.py',
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
    };

    await fs.writeJson(path.join(claudeDir, 'settings.json'), settings, { spaces: 2 });

    // Copy hook scripts from templates
    const hooksDir = path.join(claudeDir, 'hooks');
    const hooksSourceDir = path.join(this.packageRoot, '.claude', 'hooks');

    // Copy all hooks from package if they exist
    if (await fs.pathExists(hooksSourceDir)) {
      await fs.copy(hooksSourceDir, hooksDir, {
        overwrite: true,
        errorOnExist: false,
      });
    } else {
      // Create minimal hook scripts if source doesn't exist
      console.warn('Warning: Hook source directory not found. Creating minimal hooks.');
      await this.createMinimalHooks(hooksDir);
    }
  }

  async createMinimalHooks(hooksDir) {
    // Pre-tool use hook
    const preToolUse = `#!/usr/bin/env python3
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
    tool_name = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})
    
    if tool_name == 'Bash':
        command = tool_input.get('command', '')
        
        for pattern, message in DANGEROUS_PATTERNS:
            if re.search(pattern, command, re.IGNORECASE):
                print(message, file=sys.stderr)
                sys.exit(2)  # Block the command
            
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    await fs.writeFile(path.join(hooksDir, 'pre_tool_use.py'), preToolUse);

    // TypeScript validator
    const tsValidator = `#!/usr/bin/env python3
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
        # Don't block, just warn
        
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    await fs.writeFile(path.join(hooksDir, 'typescript-validator.py'), tsValidator);

    // Import organizer
    const importOrganizer = `#!/usr/bin/env python3
import json
import sys

try:
    input_data = json.load(sys.stdin)
    # This is a placeholder - actual import organization would be more complex
    print("✓ Import organization check completed", file=sys.stdout)
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    await fs.writeFile(path.join(hooksDir, 'import-organizer.py'), importOrganizer);

    // Notification hook
    const notification = `#!/usr/bin/env python3
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
`;

    await fs.writeFile(path.join(hooksDir, 'notification.py'), notification);

    // Post tool use hook
    const postToolUse = `#!/usr/bin/env python3
import json
import sys

try:
    input_data = json.load(sys.stdin)
    print("✓ Tool execution completed", file=sys.stdout)
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    await fs.writeFile(path.join(hooksDir, 'post_tool_use.py'), postToolUse);

    // Stop hook
    const stopHook = `#!/usr/bin/env python3
import json
import sys

try:
    input_data = json.load(sys.stdin)
    print("Session ended", file=sys.stdout)
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    await fs.writeFile(path.join(hooksDir, 'stop.py'), stopHook);

    // Subagent stop hook
    const subagentStopHook = `#!/usr/bin/env python3
import json
import sys

try:
    input_data = json.load(sys.stdin)
    print("Subagent session ended", file=sys.stdout)
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    await fs.writeFile(path.join(hooksDir, 'subagent_stop.py'), subagentStopHook);

    // Task completion enforcer
    const taskEnforcer = `#!/usr/bin/env python3
import json
import sys
import os

try:
    input_data = json.load(sys.stdin)
    transcript_path = input_data.get('transcript_path', '')
    
    # Check for TODO markers in the current directory
    todo_count = 0
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith(('.js', '.ts', '.jsx', '.tsx', '.py')):
                try:
                    with open(os.path.join(root, file), 'r') as f:
                        content = f.read()
                        todo_count += content.count('TODO')
                        todo_count += content.count('FIXME')
                except:
                    pass
    
    if todo_count > 0:
        print(f"Found {todo_count} TODO/FIXME markers in the codebase", file=sys.stdout)
        
except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    await fs.writeFile(path.join(hooksDir, 'task-completion-enforcer.py'), taskEnforcer);
  }

  async copyCommandTemplates(targetDir) {
    const commandsDir = path.join(targetDir, '.claude', 'commands');

    // Create agent-start command
    const agentStartCmd = `#!/bin/bash
# /agent-start command implementation

WORKSPACE_PATH="$1"

if [ -z "$WORKSPACE_PATH" ]; then
    WORKSPACE_PATH="."
fi

# Load agent context
if [ -f "$WORKSPACE_PATH/agent_context.json" ]; then
    echo "Loading agent context..."
    cat "$WORKSPACE_PATH/agent_context.json"
fi

# Display validation checklist
if [ -f "$WORKSPACE_PATH/validation_checklist.txt" ]; then
    echo ""
    echo "Validation Checklist:"
    cat "$WORKSPACE_PATH/validation_checklist.txt"
fi

# Display files to work on
if [ -f "$WORKSPACE_PATH/files_to_work_on.txt" ]; then
    echo ""
    echo "Files to work on:"
    cat "$WORKSPACE_PATH/files_to_work_on.txt"
fi
`;

    await fs.writeFile(path.join(commandsDir, 'agent-start.sh'), agentStartCmd);

    // Create agent-commit command
    const agentCommitCmd = `#!/bin/bash
# /agent-commit command implementation

WORKSPACE_PATH="$1"
CUSTOM_MESSAGE="$2"

if [ -z "$WORKSPACE_PATH" ]; then
    WORKSPACE_PATH="."
fi

# Validate checklist completion
if [ -f "$WORKSPACE_PATH/validation_checklist.txt" ]; then
    INCOMPLETE=$(grep -c "\\[ \\]" "$WORKSPACE_PATH/validation_checklist.txt" || echo "0")
    if [ "$INCOMPLETE" -gt 0 ]; then
        echo "Error: $INCOMPLETE incomplete checklist items found"
        exit 1
    fi
fi

# Generate commit message
if [ -z "$CUSTOM_MESSAGE" ] && [ -f "$WORKSPACE_PATH/agent_context.json" ]; then
    AGENT_ID=$(jq -r '.agentId' "$WORKSPACE_PATH/agent_context.json")
    TASK_ID=$(jq -r '.taskId' "$WORKSPACE_PATH/agent_context.json")
    ROLE=$(jq -r '.agentRole' "$WORKSPACE_PATH/agent_context.json")
    CUSTOM_MESSAGE="[$TASK_ID] $AGENT_ID: $ROLE"
fi

# Perform git operations
git add -A
git commit -m "$CUSTOM_MESSAGE

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

echo "✅ Agent work committed successfully"
`;

    await fs.writeFile(path.join(commandsDir, 'agent-commit.sh'), agentCommitCmd);

    // Create agent-status command
    const agentStatusCmd = `#!/bin/bash
# /agent-status command implementation

FILTER="$1"

echo "🔍 Checking agent worktrees status..."
echo ""

# Find all worktrees
WORKTREES=$(git worktree list --porcelain | grep "worktree" | cut -d' ' -f2)

for WORKTREE in $WORKTREES; do
    if [ -f "$WORKTREE/agent_context.json" ]; then
        AGENT_ID=$(jq -r '.agentId' "$WORKTREE/agent_context.json")
        TASK_ID=$(jq -r '.taskId' "$WORKTREE/agent_context.json")
        
        # Calculate completion
        if [ -f "$WORKTREE/validation_checklist.txt" ]; then
            TOTAL=$(grep -c "\\[.\\]" "$WORKTREE/validation_checklist.txt" || echo "0")
            COMPLETE=$(grep -c "\\[x\\]" "$WORKTREE/validation_checklist.txt" || echo "0")
            PERCENT=$((COMPLETE * 100 / TOTAL))
            
            STATUS="In Progress"
            if [ "$PERCENT" -eq 100 ]; then
                STATUS="Ready to merge"
            elif [ "$PERCENT" -eq 0 ]; then
                STATUS="Not started"
            fi
            
            if [ -z "$FILTER" ] || [ "$FILTER" = "$(echo $STATUS | tr '[:upper:]' '[:lower:]' | tr ' ' '-')" ]; then
                echo "📊 $AGENT_ID ($TASK_ID)"
                echo "   Status: $STATUS ($PERCENT%)"
                echo "   Path: $WORKTREE"
                echo ""
            fi
        fi
    fi
done
`;

    await fs.writeFile(path.join(commandsDir, 'agent-status.sh'), agentStatusCmd);
  }

  async copyWorkflowScripts(targetDir) {
    const scriptsDir = path.join(targetDir, 'scripts');
    await fs.ensureDir(scriptsDir);

    // Copy essential workflow scripts
    const scriptsToInstall = [
      'cache-linear-issue.sh',
      'decompose-parallel.cjs',
      'spawn-agents.sh',
      'monitor-agents.sh',
      'agent-commit-enhanced.sh',
    ];

    for (const script of scriptsToInstall) {
      const sourcePath = path.join(this.packageRoot, 'scripts', script);
      const targetPath = path.join(scriptsDir, script);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, targetPath);
      }
    }
  }

  async copyAIDocs(targetDir) {
    const aiDocsDir = path.join(targetDir, 'ai-docs');
    await fs.ensureDir(aiDocsDir);

    // Copy AI documentation files
    const sourceAiDocs = path.join(this.packageRoot, 'ai-docs');
    if (await fs.pathExists(sourceAiDocs)) {
      await fs.copy(sourceAiDocs, aiDocsDir);
    }
  }

  async createExampleConfig(targetDir) {
    // Create .env.example
    const envExample = `# cdev Configuration
LINEAR_API_KEY=lin_api_XXXXXXXX
LLM_PROVIDER=openrouter
LLM_MODEL=mistralai/mistral-large-2411
ENGINEER_NAME=YourName
`;

    await fs.writeFile(path.join(targetDir, '.env.example'), envExample);
  }

  async setPermissions(targetDir) {
    // Make scripts executable
    const executableDirs = [
      path.join(targetDir, 'scripts'),
      path.join(targetDir, '.claude', 'commands'),
      path.join(targetDir, '.claude', 'hooks'),
    ];

    for (const dir of executableDirs) {
      if (await fs.pathExists(dir)) {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.sh') || file.endsWith('.py')) {
            const filePath = path.join(dir, file);
            await fs.chmod(filePath, '755');
          }
        }
      }
    }
  }
}

module.exports = { SimpleInstaller };
