# CDEV - Claude Development

[![npm version](https://img.shields.io/npm/v/cdev.svg)](https://www.npmjs.com/package/cdev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/cdev.svg)](https://nodejs.org/)

> **Parallel workflow system for Claude Code with intelligent hooks, automated validations, and multi-agent orchestration**

CDEV (Claude Development) is a comprehensive NPM package that supercharges your Claude Code development experience. It provides parallel agent workflows, intelligent task decomposition, automated code quality checks, TypeScript validation, API standards enforcement, and seamless integration with Linear for issue management.

## 🚀 Quick Start

```bash
# Install in your project (recommended)
npx cdev install

# Or install globally
npm install -g cdev

# Initialize in an existing project
cd your-project
cdev init

# Use the interactive installer
cdev install --interactive
```

## 🎯 Features

### 🪝 Intelligent Hooks
- **Pre/Post Tool Use Hooks**: Monitor and validate Claude's actions
- **TypeScript Validation**: Automatic type checking before file edits
- **Code Quality Reporting**: Real-time feedback on code standards
- **API Standards Checker**: Ensure consistent API design patterns

### 🚀 Parallel Development
- **Linear Integration**: Transform Linear issues into parallel workstreams
- **Git Worktree Management**: Isolated development environments
- **Intelligent Task Decomposition**: AI-powered task breakdown
- **Agent Coordination**: Manage multiple Claude instances efficiently

### 🛡️ Safety & Validation
- **Commit Message Validation**: Enforce commit conventions
- **Import Organization**: Keep imports clean and sorted
- **Universal Linting**: Multi-language code quality checks
- **Task Completion Enforcement**: Ensure all TODOs are addressed

## 📋 Requirements

- **Node.js**: v16.0.0 or higher
- **Git**: v2.0.0 or higher
- **Python**: v3.7 or higher (for hooks)
- **Claude Code**: Latest version installed
- **Operating System**: Windows, macOS, or Linux

## 📦 What Gets Installed

```
your-project/
├── .claude/
│   ├── hooks/                  # Intelligent validation hooks
│   │   ├── pre_tool_use.py    # Pre-execution validation
│   │   ├── post_tool_use.py   # Post-execution reporting
│   │   ├── typescript-validator.py
│   │   ├── api-standards-checker.py
│   │   └── ...
│   ├── commands/              # Custom Claude commands
│   └── settings.json          # Configuration
├── scripts/
│   ├── cache-linear-issue.sh  # Linear integration
│   ├── decompose-parallel.cjs # Task decomposition
│   └── spawn-agents.sh        # Agent management
└── .gitignore                 # Updated with Claude entries
```

## 🔧 Installation Options

### Interactive Installation (Recommended)

```bash
npx cdev install
```

The interactive installer will:
1. Detect your project type (Next.js, React, Node.js, etc.)
2. Configure appropriate hooks for your stack
3. Set up Linear integration (optional)
4. Install framework-specific commands
5. Configure your preferred package manager

### Quick Installation

```bash
# Install with defaults
npx cdev install --yes

# Install with specific package manager
npx cdev install --pm pnpm

# Install in a specific directory
npx cdev install /path/to/project
```

### Manual Installation

```bash
# Clone specific hooks only
npx cdev install --hooks typescript,api-standards

# Skip Linear integration
npx cdev install --no-linear

# Preserve existing configuration
npx cdev install --preserve
```

## 🎨 Configuration

### Hook Configuration

Edit `.claude/settings.json` to customize hook behavior:

```json
{
  "hooks": {
    "pre_tool_use": "python3 .claude/hooks/pre_tool_use.py",
    "post_tool_use": "python3 .claude/hooks/post_tool_use.py"
  },
  "validation": {
    "typescript": true,
    "eslint": true,
    "prettier": true
  },
  "projectType": "nextjs",
  "packageManager": "pnpm"
}
```

### Environment Variables

```bash
# Linear API integration
export LINEAR_API_KEY="lin_api_xxxxxxxxxx"

# Custom Python path (if needed)
export CLAUDE_PYTHON_PATH="/usr/local/bin/python3"

# Disable specific hooks
export CLAUDE_DISABLE_TYPESCRIPT=true
```

## 🔌 Available Hooks

### Core Hooks
- **pre_tool_use.py**: Validates actions before execution
- **post_tool_use.py**: Reports on completed actions
- **stop.py**: Cleanup on session end
- **subagent_stop.py**: Manages parallel agent cleanup

### Validation Hooks
- **typescript-validator.py**: Type checking for TypeScript files
- **api-standards-checker.py**: REST/GraphQL API validation
- **code-quality-reporter.py**: General code quality metrics
- **import-organizer.py**: Sorts and groups imports

### Workflow Hooks
- **commit-message-validator.py**: Enforces commit conventions
- **task-completion-enforcer.py**: Tracks TODO completion
- **pnpm-enforcer.py**: Ensures pnpm usage in monorepos

## 🚀 Linear Integration Workflow

### 1. Cache Linear Issue

```bash
cdev get PROJ-123
```

### 2. Decompose into Parallel Tasks

```bash
cdev split PROJ-123
```

### 3. Spawn Parallel Agents

```bash
cdev run shared/deployment-plans/proj-123.json
```

### 4. Monitor Progress

```bash
cdev linear status PROJ-123
```

## 🤝 Framework Support

### Next.js
- Automatic App Router detection
- Server Component validation
- API route standards
- Tailwind CSS integration

### React
- Component best practices
- Hook validation
- State management patterns
- Testing setup

### Node.js
- Express/Fastify detection
- API endpoint validation
- Database integration checks
- Environment configuration

### Python
- Flask/Django support
- Type hint validation
- PEP 8 enforcement
- Virtual environment detection

## 🛠️ Troubleshooting

### Common Issues

**Python not found**
```bash
# Set custom Python path
export CLAUDE_PYTHON_PATH=$(which python3)
```

**Permission denied on scripts**
```bash
# Fix permissions
chmod +x scripts/*.sh
```

**Hooks not triggering**
```bash
# Verify Claude settings
cdev doctor
```

### Debug Mode

```bash
# Enable verbose logging
export CLAUDE_DEBUG=true

# Check hook execution
cdev test-hooks
```

## 📚 API Reference

### CLI Commands

```bash
cdev install [path] [options]
cdev init [options]
cdev linear <command> [id]
cdev doctor
cdev update
cdev uninstall
```

### Programmatic Usage

```javascript
const { Installer } = require('cdev');

const installer = new Installer({
  projectPath: './my-project',
  packageManager: 'npm',
  skipPrompts: true
});

await installer.install();
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/AOJDevStudio/cdev.git

# Install dependencies
npm install

# Run tests
npm test

# Submit a pull request
```

## 📄 License

MIT © Anthropic

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/cdev)
- [GitHub Repository](https://github.com/AOJDevStudio/cdev)
- [Issue Tracker](https://github.com/AOJDevStudio/cdev/issues)
- [Author](https://github.com/AOJDevStudio)
- Discord Community (Coming Soon)