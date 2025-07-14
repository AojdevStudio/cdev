# Usage Guide

This guide covers how to use Claude Code Hooks effectively in your development workflow.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Hook System](#hook-system)
- [Linear Integration](#linear-integration)
- [Custom Commands](#custom-commands)
- [Configuration](#configuration)
- [Best Practices](#best-practices)

## Basic Usage

### Starting Claude with Hooks

Once installed, hooks automatically activate when you start Claude:

```bash
# Start Claude in your project
cd your-project
claude

# Claude will now use your configured hooks
```

### Verifying Hook Operation

Check that hooks are working:

```bash
# Test hooks without Claude
claude-code-hooks test-hooks

# View hook logs
tail -f logs/claude-hooks.log

# Enable debug mode for verbose output
export CLAUDE_DEBUG=true
claude
```

## Hook System

### Pre Tool Use Hook

The `pre_tool_use` hook validates actions before Claude executes them:

```python
# Example: TypeScript validation before file edit
# Claude: "Let me update the component..."
# Hook: ✓ TypeScript validation passed
# Claude: *proceeds with edit*
```

**Common validations:**

- TypeScript type checking
- Import statement verification
- File permission checks
- Dangerous operation warnings

### Post Tool Use Hook

The `post_tool_use` hook reports on completed actions:

```python
# Example: After file modification
# Claude: *modifies api/users.ts*
# Hook: 📊 Code Quality Report:
#       - Complexity: Low (5)
#       - Test Coverage: 87%
#       - TODO items: 2
```

**Common reports:**

- Code complexity metrics
- Test coverage changes
- New TODO/FIXME items
- Performance implications

### Stop Hooks

Clean up when Claude sessions end:

```python
# Session end hooks
stop.py         # Main session cleanup
subagent_stop.py # Parallel agent cleanup
```

## Linear Integration

### Complete Workflow

Transform Linear issues into parallel development using the actual script commands:

```bash
# 1. Cache Linear issue locally
./scripts/cache-linear-issue.sh PROJ-123

# 2. Decompose into parallel tasks
node scripts/decompose-parallel.cjs PROJ-123

# 3. Spawn agent worktrees
./scripts/spawn-agents.sh shared/deployment-plans/proj-123-deployment-plan.json

# 4. Monitor progress
./scripts/monitor-agents.sh
```

### Understanding the Decompose-Parallel Workflow

The `decompose-parallel.cjs` script is the brain of the parallel development system. It uses AI to analyze your Linear issue and create an optimal parallelization strategy.

#### Prerequisites

Before using decompose-parallel.cjs, you need:

1. **Cached Linear Issue**: The issue must be cached locally first
2. **LLM Configuration**: Set up your AI provider in `.env`
3. **Git Repository**: Must be in a Git repository for worktree creation

#### Step-by-Step Guide

**Step 1: Configure Your LLM Provider**

```bash
# Copy the example configuration
cp .env.example .env

# Edit .env and add your configuration:
# For OpenRouter (Recommended):
LLM_PROVIDER=openrouter
LLM_MODEL=mistralai/mistral-large-2411
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxx

# For OpenAI:
LLM_PROVIDER=openai
LLM_MODEL=gpt-4-turbo-preview
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# For Anthropic:
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-opus-20240229
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxx
```

**Step 2: Cache Your Linear Issue**

```bash
# Ensure you have your Linear API key set
export LINEAR_API_KEY="lin_api_xxxxxxxxxx"

# Cache the issue
./scripts/cache-linear-issue.sh PROJ-123

# Verify it was cached
ls .linear-cache/PROJ-123.json
```

**Step 3: Run Decomposition**

```bash
# Run the decomposition
node scripts/decompose-parallel.cjs PROJ-123
```

**What happens during decomposition:**

- AI analyzes the issue description and requirements
- Identifies distinct work domains (frontend, backend, testing, etc.)
- Creates agents with exclusive file ownership
- Generates a deployment plan with dependencies
- Estimates time for each agent

**Step 4: Review the Output**

After decomposition, you'll see:

```
🧠 Analyzing: "Add user authentication with OAuth"
📊 Created 4 parallel agents:
  • backend_auth_agent: JWT & user models (45 min)
  • frontend_auth_agent: Login/signup UI (35 min)
  • oauth_integration_agent: Google/GitHub OAuth (30 min)
  • testing_agent: Auth flow tests (25 min)

✅ Deployment plan created: shared/deployment-plans/proj-123-deployment-plan.json

Next steps:
1. Review the plan: cat shared/deployment-plans/proj-123-deployment-plan.json | jq
2. Spawn agents: ./scripts/spawn-agents.sh shared/deployment-plans/proj-123-deployment-plan.json
3. Start working with /agent-start in each workspace
```

**Step 5: Spawn Agent Worktrees**

```bash
# This creates isolated workspaces for each agent
./scripts/spawn-agents.sh shared/deployment-plans/proj-123-deployment-plan.json

# What this does:
# - Creates Git worktrees for each agent
# - Copies agent context files
# - Opens Cursor/VS Code for each workspace
# - Sets up branch tracking
```

**Step 6: Work with Agents**

In each opened editor window:

```bash
# Start Claude
claude

# Load agent context and begin work
/agent-start

# The agent will:
# - Show its specific role and tasks
# - Display validation checklist
# - Work through files systematically
# - Update progress in real-time
```

**Step 7: Monitor and Commit**

```bash
# Check progress across all agents
/agent-status

# When an agent completes its work
/agent-commit

# Or manually from the command line
./scripts/integrate-parallel-work.sh
```

### Troubleshooting Common Issues

**LLM Configuration Error:**
If you see "LLM analysis failed", check:

- Your API key is valid
- LLM provider is correctly set
- You have credits/quota available

**No Agents Created:**
This happens when:

- The task is too simple for parallelization
- The issue description lacks detail
- Consider adding more context to the Linear issue

**File Conflicts:**
The system prevents this by design, but if you see conflicts:

- Check that agents have exclusive file ownership
- Review the deployment plan for overlaps
- Report the issue - this shouldn't happen!

### Best Practices

1. **Write Detailed Linear Issues**: The AI works better with clear, detailed descriptions
2. **Include Acceptance Criteria**: Help the AI understand success metrics
3. **Specify Technical Details**: Mention specific technologies, frameworks, or patterns
4. **Review Deployment Plans**: Always check the generated plan before spawning agents
5. **Use Semantic Commit Messages**: Let /agent-commit generate proper messages

### Setting Up Linear

Configure your Linear API key:

```bash
# Add to shell profile
export LINEAR_API_KEY="lin_api_xxxxxxxxxx"

# Or configure per-project
echo "LINEAR_API_KEY=lin_api_xxxxxxxxxx" >> .env
```

### Working with Cached Issues

```bash
# List cached issues
ls .linear-cache/

# View cached issue
cat .linear-cache/PROJ-123.json | jq

# Update cached issue
claude-code-hooks linear refresh PROJ-123
```

### Parallel Agent Management

```bash
# List all agent worktrees
git worktree list

# Check agent status
claude-code-hooks agent status

# Open specific agent workspace
cd ../project-work-trees/PROJ-123-backend_agent
claude
```

## Custom Commands

### Creating Commands

Add custom Claude commands in `.claude/commands/`:

```markdown
# .claude/commands/create-component.md

Create a new React component with TypeScript, tests, and stories.

Usage: /create-component ComponentName

This will:

1. Create component file with TypeScript interface
2. Add unit tests with React Testing Library
3. Create Storybook stories
4. Update barrel exports
```

### Using Commands

In Claude:

```
You: /create-component UserProfile
Claude: I'll create a new UserProfile component with tests and stories...
```

### Command Templates

Common command patterns:

```markdown
# .claude/commands/refactor-to-hook.md

Extract component logic into a custom React hook.

Usage: /refactor-to-hook ComponentName hookName

Steps:

1. Analyze component for extractable logic
2. Create new hook with TypeScript
3. Update component to use hook
4. Add hook tests
5. Update documentation
```

## Configuration

### Settings File

Configure behavior in `.claude/settings.json`:

```json
{
  "projectType": "nextjs",
  "packageManager": "pnpm",
  "typescript": true,
  "hooks": {
    "pre_tool_use": "python3 .claude/hooks/pre_tool_use.py",
    "post_tool_use": "python3 .claude/hooks/post_tool_use.py"
  },
  "validation": {
    "typescript": true,
    "eslint": true,
    "prettier": true,
    "tests": true
  },
  "features": {
    "autoImports": true,
    "codeQualityReports": true,
    "testCoverage": true
  }
}
```

### Environment-Specific Settings

Use different settings per environment:

```bash
# Development settings
cp .claude/settings.json .claude/settings.development.json

# Production settings
cp .claude/settings.json .claude/settings.production.json

# Set environment
export CLAUDE_ENV=development
```

### Hook-Specific Configuration

Configure individual hooks:

```json
{
  "hooks": {
    "typescript-validator": {
      "strict": true,
      "skipLibCheck": false,
      "noImplicitAny": true
    },
    "api-standards": {
      "style": "REST",
      "validation": "OpenAPI",
      "naming": "camelCase"
    }
  }
}
```

## Best Practices

### 1. Project Organization

```
your-project/
├── .claude/
│   ├── hooks/       # Keep hooks updated
│   ├── commands/    # Project-specific commands
│   └── settings.json # Version control this
├── .linear-cache/   # Git ignore this
└── logs/           # Git ignore this
```

### 2. Effective Hook Usage

**DO:**

- ✓ Let hooks guide better practices
- ✓ Review hook output for insights
- ✓ Customize hooks for your team's standards
- ✓ Use debug mode when troubleshooting

**DON'T:**

- ✗ Disable hooks to bypass validation
- ✗ Ignore repeated hook warnings
- ✗ Modify core hook files directly
- ✗ Commit sensitive hook logs

### 3. Linear Integration Tips

**Effective Issue Writing:**

```markdown
# Good Linear issue for decomposition

Title: Implement user authentication system

Description:

1. Create login/signup forms with validation
2. Implement JWT authentication middleware
3. Add password reset functionality
4. Create user profile management
5. Add session management
```

**Parallel Development:**

- Keep agents focused on specific domains
- Use semantic task descriptions
- Define clear acceptance criteria
- Coordinate through the main branch

### 4. Custom Command Guidelines

**Effective Commands:**

- Start with a clear action verb
- Include usage examples
- List expected outcomes
- Handle edge cases
- Provide rollback instructions

### 5. Performance Optimization

```bash
# Disable unused hooks
{
  "hooks": {
    "import-organizer": null,  // Disabled
    "typescript-validator": "python3 ..."  // Enabled
  }
}

# Async hook execution
{
  "features": {
    "asyncHooks": true,
    "hookTimeout": 5000
  }
}
```

### 6. Team Collaboration

**Shared Configuration:**

```bash
# Commit team settings
git add .claude/settings.json
git commit -m "chore: standardize Claude hooks configuration"

# Individual overrides
touch .claude/settings.local.json
echo ".claude/settings.local.json" >> .gitignore
```

**Documentation:**

```markdown
# .claude/README.md

## Team Claude Configuration

Our project uses these hooks:

- TypeScript validation (strict mode)
- API standards (REST/OpenAPI)
- Commit message format (conventional)

Local overrides: Create `.claude/settings.local.json`
```

## Advanced Usage

### Conditional Hooks

Enable hooks based on conditions:

```json
{
  "hooks": {
    "pre_tool_use": {
      "script": "python3 .claude/hooks/pre_tool_use.py",
      "conditions": {
        "files": ["*.ts", "*.tsx"],
        "exclude": ["*.test.ts"]
      }
    }
  }
}
```

### Hook Chaining

Run multiple hooks in sequence:

```json
{
  "hooks": {
    "pre_tool_use": [
      "python3 .claude/hooks/typescript-validator.py",
      "python3 .claude/hooks/import-organizer.py",
      "python3 .claude/hooks/security-check.py"
    ]
  }
}
```

### Custom Hook Development

Create your own hooks:

```python
# .claude/hooks/custom-validator.py
import json
import sys

def validate(event):
    # Your validation logic
    if "TODO" in event.get("content", ""):
        print("⚠️  Found TODO - please address before committing")
        return False
    return True

if __name__ == "__main__":
    event = json.loads(sys.stdin.read())
    if not validate(event):
        sys.exit(1)
```

## Getting Help

- Check [Troubleshooting Guide](troubleshooting.md)
- View [API Reference](api-reference.md)
- Join Discord Community (Coming Soon)
- Report issues on [GitHub](https://github.com/AOJDevStudio/cdev/issues)
