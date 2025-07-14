# CDEV: AI-Powered Development Orchestration System

**Version**: 1.0.0  
**License**: CC-BY-NC-SA-4.0  
**Requirements**: Node.js ≥ 16.0.0  
**Community**: [GitHub Issues](https://github.com/AOJDevStudio/cdev/issues) | [NPM Package](https://www.npmjs.com/package/@aojdevstudio/cdev)

[![npm version](https://img.shields.io/npm/v/@aojdevstudio/cdev.svg)](https://www.npmjs.com/package/@aojdevstudio/cdev)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Node.js Version](https://img.shields.io/node/v/@aojdevstudio/cdev.svg)](https://nodejs.org/)

---

CDEV is an intelligent development orchestration system designed to transform how developers work with AI assistants like Claude. It goes beyond simple automation by enabling both parallel multi-instance workflows and concurrent sub-agent execution to support developers building software 2-4x faster. Whether you're focused on complex feature development, systematic refactoring, comprehensive testing, or rapid prototyping, CDEV helps achieve dramatic productivity gains through intelligent task decomposition and automated orchestration.

> ⭐ If you find this project helpful, please give it a star to support development and receive updates.

---

## 🔑 Key Highlights

1. **Dual-Mode Agent System**  
   Think of it like having two superpowers: You can either split a big project across multiple developers (parallel agents with Git worktrees), or have one super-smart developer juggle multiple tasks at once (concurrent sub-agents). It's like choosing between a construction crew or a master craftsman - both get the job done, but for different types of work.

2. **Universal Task Understanding**  
   Imagine an assistant that understands your tasks whether you write them in a markdown checklist, paste a text file, reference a Linear ticket, or just describe what you need. CDEV automatically translates any format into actionable, intelligent workflows - like having a universal translator for development tasks.

CDEV is designed to address challenges such as context switching overhead, merge conflict nightmares, and AI hallucination issues—delivering faster development cycles, cleaner code organization, and more reliable AI interactions through intelligent validation hooks and automated orchestration.

📘 [**Read the Full Guide**](docs/parallel-workflow.md) to see how these concepts fit into the overall experience.

---

## 🧭 Quick Navigation

- [Installation & Setup](#-setup--updates)
- [Two Powerful Workflows](#-two-powerful-workflows)
- [Intelligent Commands](#-intelligent-commands)
- [Hook System](#-intelligent-hook-system)
- [Custom Commands](#-custom-command-system)
- [Documentation](#-documentation--resources)
- [Examples](#-real-world-examples)
- [Contributing](#-contributing)

---

## 🛠 Setup & Updates

**Recommended Command:**

```bash
npm install -g @aojdevstudio/cdev
# OR for existing setups
npm update -g @aojdevstudio/cdev
```

✅ Automatic Claude configuration with CLAUDE.md generation  
✅ Intelligent project analysis and complexity scoring  
✅ Cross-platform support (Windows, macOS, Linux)  
✅ Multiple package managers (npm, pnpm, yarn, bun)

### 🐍 Python Scripts Requirements

CDEV now uses Python scripts with UV package manager for improved performance and cross-platform compatibility:

**Prerequisites:**

- Python 3.11 or higher
- UV package manager ([Installation Guide](docs/uv-installation-guide.md))

```bash
# Quick UV installation
# macOS
brew install uv

# Linux/WSL
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

All Python scripts are self-contained with inline dependencies - no virtual environment setup required!

⸻

⚡ Quick Start Options

**Option 1: Interactive Setup (Recommended)**

1. Run `npx @aojdevstudio/cdev` in your project
2. Let CDEV analyze your project structure automatically
3. Choose between simple or advanced protocol generation
4. Configure Linear integration if desired
5. Start using enhanced Claude commands immediately

**Option 2: Manual Installation**

1. Clone the repository

```bash
git clone https://github.com/AOJDevStudio/cdev.git
```

2. Install and configure

```bash
cd cdev
npm install
npm link
```

⸻

## 🚀 Two Powerful Workflows

### 1. Parallel Agent Workflow (Multiple Claude Instances)

Perfect for large features requiring true parallel development:

```bash
# Decompose a Linear issue into parallel agents
cdev decompose LINEAR-123
# Uses: scripts/python/decompose-parallel.py

# Spawn agents in separate Git worktrees
cdev spawn deployment-plan.json
# Uses: scripts/python/spawn-agents.py
# Opens: frontend_agent, backend_agent, test_agent in separate directories

# Monitor agent progress
cdev status
# Uses: scripts/python/monitor-agents.py

# Each developer/Claude instance works independently
# Merge when complete
cdev commit
# Uses: scripts/python/agent-commit.py
```

### 2. Concurrent Sub-Agent Workflow (Single Claude Instance)

Ideal for complex tasks within one conversation:

```bash
# Transform any task list into concurrent sub-agents
/orchestrate PUBLISHING-PLAN.md
# OR
/orchestrate "Fix linting, add tests, update docs"

# CDEV intelligently groups tasks and orchestrates execution
# Sub-agents run concurrently within your current Claude session
```

---

## 🎯 Intelligent Commands

### /agent-start - 7-Phase TDD Workflow

```bash
/agent-start                   # Execute TDD workflow from current directory
/agent-start ./agent-workspace # Start in specific agent workspace
```

### /orchestrate - Universal Task Orchestrator

```bash
/orchestrate tasks.md          # Markdown checklists
/orchestrate TODO.txt          # Plain text lists
/orchestrate LINEAR-456        # Linear tickets
/orchestrate checklist.json    # JSON arrays
/orchestrate --dry-run         # Preview execution plan
```

### /init-protocol - Smart Project Configuration

```bash
/init-protocol                 # Analyzes project and generates CLAUDE.md
/init-protocol --level advanced # Force comprehensive protocols
/init-protocol --focus "testing" # Emphasize specific domains
```

The complexity scoring algorithm considers:

- File count and language diversity
- Framework detection
- Team indicators
- Special project types (microservices, AI/ML)

### /commit - Intelligent Git Workflow

```bash
/commit                        # Analyzes changes, generates semantic commit
/commit --message "custom"     # Override with custom message
```

---

## 🛡️ Intelligent Hook System

CDEV's hooks act like quality gates, catching issues before they happen:

### Pre-Tool Hooks

- **Date Awareness**: Prevents AI from using outdated dates
- **Template Guard**: Protects command templates from modification
- **API Validation**: Ensures REST/GraphQL standards
- **TypeScript Checking**: Validates types before edits

### Post-Tool Hooks

- **Security Scanner**: Checks for exposed secrets
- **Code Quality**: Reports metrics and improvements
- **Test Coverage**: Tracks testing completeness

Example hook preventing a common mistake:

```python
# When AI tries to modify a template file
if "{{VARIABLE}}" in file_content:
    return "BLOCKED: Template files should not be modified directly"
```

---

## 📦 Modular Features / Extensions

CDEV can be extended to support use cases such as:
• Enterprise microservices with distributed tracing
• React/Vue/Angular apps with component testing
• Python ML projects with notebook integration
• Rust systems with memory safety validation
• Mobile apps with cross-platform considerations

🧩 Each feature is modular - enable only what your project needs.

⸻

## 📚 Documentation & Resources

• 📖 [Installation Guide](docs/installation.md)
• 🏗️ [Parallel Workflow Tutorial](docs/parallel-workflow.md)
• 🚀 [Custom Commands Reference](docs/custom-commands.md)
• 🧑‍💻 [Hook Development Guide](docs/hooks-reference.md)

### 🐍 Python Scripts Documentation

• 🔧 [UV Installation Guide](docs/uv-installation-guide.md) - Set up UV package manager
• 📘 [Standalone Scripts Guide](docs/standalone-scripts-guide.md) - Understanding the script architecture
• 🔄 [Migration Guide](docs/migration-guide.md) - Migrate from Shell/JS to Python
• 📝 [Script Usage Examples](docs/script-usage-examples.md) - Practical examples for all scripts
• 📊 [YAML Output Formats](docs/yaml-output-formats.md) - Output schema documentation
• 🔍 [Troubleshooting Guide](docs/troubleshooting-python-scripts.md) - Common issues and solutions
• 📈 [Old vs New Comparison](docs/old-vs-new-comparison.md) - Benefits of the migration

⸻

## 💡 Real-World Examples

### Example 1: Feature Development with Parallel Agents

```bash
# Linear ticket: "Add user authentication system"
cdev decompose LINEAR-789

# Creates specialized agents:
# - auth_backend_agent: JWT implementation
# - auth_frontend_agent: Login/signup forms
# - auth_test_agent: Integration tests

# Each runs in isolated Git worktree
# Merge when all complete
```

### Example 2: Quick Tasks with Sub-Agents

```bash
/orchestrate "Refactor user service, add logging, update tests"

# CDEV creates concurrent sub-agents:
# - refactor_subagent: Code improvements
# - logging_subagent: Add structured logging
# - test_subagent: Update test coverage

# All execute within current Claude session
```

⸻

## 🤝 Support & Community

• 💬 [GitHub Discussions](https://github.com/AOJDevStudio/cdev/discussions)
• 🐞 [Report Issues](https://github.com/AOJDevStudio/cdev/issues)
• 🗨️ [Feature Requests](https://github.com/AOJDevStudio/cdev/issues/new?labels=enhancement)

⸻

## 🧑‍💻 Contributing

We welcome all contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit changes using conventional commits
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

📋 See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

⸻

## 📄 License

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)

This means:

- ✅ Use freely for personal and internal projects
- ✅ Modify and build upon the work
- ✅ Share with attribution
- ❌ Commercial use requires permission

See [LICENSE](LICENSE) for details.

---

Built with ❤️ by developers, for developers who want to build faster with AI.
