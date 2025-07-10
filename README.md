# CDEV - Claude Development

[![npm version](https://img.shields.io/npm/v/cdev.svg)](https://www.npmjs.com/package/cdev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/cdev.svg)](https://nodejs.org/)

> **Think of CDEV as your AI-powered development team manager - it takes complex tasks, breaks them down intelligently, and manages multiple Claude instances working in parallel to deliver faster, cleaner code.**

## 🎯 What is CDEV?

CDEV (Claude Development) transforms how you work with Claude Code by enabling **parallel development workflows**. Instead of working on features sequentially, CDEV intelligently splits tasks into independent workstreams, allowing multiple Claude instances to work simultaneously while maintaining code quality through intelligent hooks.

### 🔑 Key Benefits

- **⚡ 2-4x Faster Development**: Work on multiple features simultaneously
- **🛡️ Built-in Safety**: Intelligent hooks prevent common mistakes before they happen
- **🧠 AI-Powered Intelligence**: Semantic analysis understands your code and requirements
- **📊 Linear Integration**: Seamlessly transform Linear issues into parallel workflows
- **🔒 Security First**: Comprehensive protection against accidental exposure of secrets

## 🚀 Quick Start

```bash
# Install globally
npm install -g cdev

# Start your first parallel workflow
cdev get PROJ-123    # Get issue from Linear
cdev split PROJ-123  # AI splits it into parallel tasks
cdev run plan.json   # Spawn multiple Claude agents
cdev status          # Monitor progress
cdev commit          # Merge completed work
```

## 📋 Complete Hook System

CDEV includes intelligent hooks that enhance Claude's capabilities and protect your codebase:

| Hook | What it Does | Why it's Awesome |
|------|--------------|------------------|
| **🛡️ pre_tool_use** | Validates actions before execution | Prevents dangerous operations like `rm -rf` and protects sensitive files |
| **📝 post_tool_use** | Processes results after actions | Logs actions, validates outputs, triggers notifications |
| **🔍 typescript-validator** | Checks TypeScript syntax before edits | Catches type errors before they break your build |
| **📐 api-standards-checker** | Validates API design patterns | Ensures consistent REST/GraphQL API structure |
| **🎨 code-quality-reporter** | Real-time code quality feedback | Identifies code smells and suggests improvements |
| **📦 import-organizer** | Organizes and sorts imports | Maintains clean, consistent import statements |
| **✅ task-completion-enforcer** | Tracks TODO completion | Ensures no tasks are forgotten before committing |
| **📋 commit-message-validator** | Enforces commit conventions | Maintains clean git history with semantic commits |
| **🔧 pnpm-enforcer** | Ensures pnpm usage | Prevents accidental npm/yarn usage in pnpm projects |
| **🧹 universal-linter** | Multi-language linting | Applies appropriate linters based on file type |
| **🔔 notification** | System notifications | Alerts you when Claude needs input or completes tasks |
| **🛑 stop** | Cleanup on session end | Saves progress and cleans up resources |

[→ Detailed Hook Documentation](docs/hooks-reference.md)

## 🎪 The Parallel Development Workflow

Here's how to transform a complex Linear issue into parallel development streams:

### Step 1: Get Your Linear Issue
```bash
cdev get PROJ-123
```
**What happens**: Downloads the Linear issue and caches it locally so you can work offline.

### Step 2: Let AI Decompose It
```bash
cdev split PROJ-123
```
**What happens**: Our AI analyzes your issue semantically and creates a deployment plan:
- Understands what needs to be built
- Identifies independent workstreams
- Assigns specialized agents to each part
- Calculates optimal parallelization

Example output:
```
🧠 Analyzing: "Add user authentication with social login"
📊 Created 4 parallel agents:
  • backend_auth_agent: JWT implementation & user models
  • frontend_auth_agent: Login/signup UI components
  • social_oauth_agent: Google/GitHub OAuth integration
  • testing_agent: Auth flow test suite
⚡ Estimated time: 45 min (vs 3 hours sequential)
```

### Step 3: Spawn Your Parallel Agents
```bash
cdev run shared/deployment-plans/proj-123.json
```
**What happens**: Creates isolated Git worktrees for each agent:
- Each agent gets its own directory
- Complete codebase copy (using Git's efficient storage)
- Opens Cursor/VS Code automatically
- No merge conflicts during development

### Step 4: Work with Each Agent
In each opened editor window:
```bash
claude

# Claude loads the agent context automatically
# The agent knows exactly what files to create/modify
# Works through a validation checklist
# Runs tests in isolation
```

### Step 5: Monitor Progress
```bash
cdev status
```
Shows real-time progress across all agents:
```
📊 PROJ-123 Progress:
✅ backend_auth_agent    [████████████████████] 100% - Ready to merge
🔄 frontend_auth_agent   [████████████░░░░░░░]  67% - Building components
🔄 social_oauth_agent    [████████░░░░░░░░░░░░]  40% - OAuth setup
⏳ testing_agent         [░░░░░░░░░░░░░░░░░░░░]   0% - Waiting for others
```

### Step 6: Commit and Merge
```bash
cdev commit
```
**What happens**: 
- Validates all checklist items completed
- Runs integration tests
- Merges in dependency order
- Cleans up worktrees

## 🧠 AI Documentation System

CDEV includes an intelligent documentation system that helps Claude understand your project:

### What are AI Docs?
Think of AI docs as a "knowledge base" that teaches Claude about:
- Your coding standards and patterns
- Project-specific conventions
- Common workflows and procedures
- Technology-specific best practices

### How AI Docs Help

1. **📚 Context Templates** - Pre-written contexts for common scenarios
2. **🎯 Linear Templates** - Structured formats for consistent issue handling  
3. **🔤 Commit Standards** - Emoji-based semantic commit references
4. **📝 Command Templates** - Patterns for creating custom Claude commands

Example: When Claude sees a Linear issue about "authentication", it references:
- Authentication pattern templates
- Security best practices
- Your project's auth conventions
- Testing requirements for auth code

[→ Explore AI Documentation](ai-docs/README.md)

## 🔧 Configuration

### Environment Setup (.env)
```bash
# Recommended configuration for optimal performance
LINEAR_API_KEY=lin_api_XXXXXXXX             # Your Linear API key
LLM_PROVIDER=openrouter                     # Recommended provider
LLM_MODEL=mistralai/mistral-large-2411     # Best for task decomposition
ENGINEER_NAME=YourName                      # For personalized notifications
```

[→ See Complete Configuration Guide](.env.example)

## 🎓 Understanding Hook Tiers

CDEV organizes hooks into three tiers based on importance:

### Tier 1: Critical Security & Validation
- Cannot be disabled
- Protect against destructive operations
- Ensure code quality standards
- Examples: `pre_tool_use`, `typescript-validator`

### Tier 2: Productivity Enhancement  
- Highly recommended
- Improve workflow efficiency
- Can be selectively disabled
- Examples: `import-organizer`, `code-quality-reporter`

### Tier 3: Optional Features
- Nice-to-have conveniences
- Project-specific customizations
- Examples: `notification`, `custom-linters`

## 📖 Complete Documentation

- **[Installation Guide](docs/installation.md)** - Detailed setup instructions
- **[Hooks Reference](docs/hooks-reference.md)** - Deep dive into each hook
- **[Parallel Workflow Guide](docs/parallel-workflow.md)** - Advanced workflow patterns
- **[API Reference](docs/api-reference.md)** - Programmatic usage
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions
- **[Security Best Practices](SECURITY.md)** - Keeping your code safe

## 🌟 Real-World Example

Let's say you receive this Linear issue:
> "Add real-time collaborative editing to the document editor with presence indicators and conflict resolution"

Traditional approach: 150+ hours of sequential work

CDEV approach:
1. `cdev get COLLAB-001` - Cache the issue
2. `cdev split COLLAB-001` - AI creates 5 specialized agents
3. `cdev run` - All agents work simultaneously
4. 40 hours total (5 agents × 8 hours each, in parallel)

Result: **3.75x faster delivery** with better code organization!

## 📋 Requirements

- **Node.js**: v16.0.0 or higher
- **Git**: v2.0.0 or higher  
- **Python**: v3.7 or higher (for hooks)
- **Claude Code**: Latest version installed
- **Linear Account**: Optional, for Linear integration

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/cdev)
- [GitHub Repository](https://github.com/AOJDevStudio/cdev)
- [Issue Tracker](https://github.com/AOJDevStudio/cdev/issues)
- [Author](https://github.com/AOJDevStudio)
- Discord Community (Coming Soon)

---

*Built with ❤️ by AOJDevStudio - Making parallel development accessible to everyone*