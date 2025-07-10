# CDEV - Claude Development: AI-Powered Parallel Development Workflows

**Version**: 1.0.0  
**License**: MIT  
**Requirements**: Node.js >=16.0.0, Git >=2.0.0, Python >=3.7, Claude Code  
**Community**: [GitHub Issues](https://github.com/AOJDevStudio/cdev/issues) | [NPM Package](https://www.npmjs.com/package/cdev)

---

CDEV is a development workflow system designed to transform complex Linear issues into parallel development streams. It goes beyond traditional sequential coding by enabling intelligent task decomposition and multi-agent coordination to support teams building software faster. Whether you're focused on feature development, bug fixes, refactoring, or testing, CDEV helps achieve 2-4x faster delivery through automated agent management and smart Git worktree isolation.

> ⭐ If you find this project helpful, please give it a star to support development and receive updates.

---

## 🔑 Key Highlights

1. **Intelligent Task Decomposition**  
   Think of it like having a smart project manager that automatically breaks down complex features into independent tasks that can be worked on simultaneously, just like how a construction crew can work on plumbing, electrical, and framing at the same time.

2. **Parallel Agent Coordination**  
   Imagine having multiple expert developers, each specialized in different areas (frontend, backend, testing), all working on the same project simultaneously without stepping on each other's toes - that's what CDEV's agent system does.

CDEV is designed to address challenges such as sequential bottlenecks, merge conflicts, and context switching—delivering faster development cycles, cleaner code organization, and reduced integration issues through intelligent Git worktree management and automated validation.

📘 [**Read the Full Guide**](docs/parallel-workflow.md) to see how these concepts fit into the overall experience.

---

## 🧭 Quick Navigation

- [Setup & Installation](#-setup--updates)
- [Parallel Workflow Guide](#-the-parallel-development-workflow)
- [Hook System Overview](#-complete-hook-system)
- [AI Documentation System](#-ai-documentation-system)
- [Configuration Guide](#-configuration)
- [Real-World Examples](#-real-world-example)
- [Documentation & Resources](#-complete-documentation)
- [Contributing](#-contributing)

---

## 🛠 Setup & Updates

**Recommended Command:**

```bash
npm install -g cdev
# OR for existing setups
npm update -g cdev
```

✅ Automatic hook system configuration  
✅ Cross-platform compatibility (Windows, macOS, Linux)  
✅ Multiple package manager support (npm, pnpm, yarn, bun)  
✅ Interactive installer with smart project detection  

⸻

⚡ Quick Start Options

**Option 1: Interactive Installation**
1. Run the global installer with guided setup
2. Choose your project type and framework
3. Configure Linear integration (optional)
4. Set up intelligent hooks automatically
5. Start your first parallel workflow

**Option 2: Manual Setup**
1. Clone the repository

```bash
git clone https://github.com/AOJDevStudio/cdev.git
```

2. Install dependencies

```bash
npm install
```

⸻

📦 Modular Features / Extensions

CDEV can be extended to support use cases such as:
• Next.js App Router projects with server components
• React applications with custom hook validation
• Node.js backends with API standards checking
• Python Flask/Django applications with linting
• Monorepo workspaces with cross-package coordination

🧩 Each feature is modular and can be enabled/disabled based on your project needs.

⸻

📚 Documentation & Resources
• 📖 [Installation Guide](docs/installation.md)
• 🏗️ [Parallel Workflow Documentation](docs/parallel-workflow.md)
• 🚀 [Hook System Reference](docs/hooks-reference.md)
• 🧑‍💻 [API Reference](docs/api-reference.md)

⸻

🤝 Support & Community
• 💬 [GitHub Discussions](https://github.com/AOJDevStudio/cdev/discussions)
• 🐞 [Bug Reports & Issues](https://github.com/AOJDevStudio/cdev/issues)
• 🗨️ [Feature Requests](https://github.com/AOJDevStudio/cdev/issues/new?template=feature_request.md)

⸻

🧑‍💻 Contributing

We welcome all contributions!

📋 See CONTRIBUTING.md for how to get started.

⸻

📄 License

MIT License  
See LICENSE for details.

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

CDEV includes intelligent hooks that enhance Claude's capabilities and protect your codebase. Think of hooks as "safety inspectors" and "quality assistants" that automatically check your work:

| Hook | What it Does | Why it's Awesome |
|------|--------------|------------------|
| **🛡️ pre_tool_use** | Validates actions before execution | Like having a safety inspector who stops you from accidentally deleting important files |
| **📝 post_tool_use** | Processes results after actions | Like having an assistant who logs everything you do and checks if it worked properly |
| **🔍 typescript-validator** | Checks TypeScript syntax before edits | Catches typos and type errors before they break your build - like spell-check for code |
| **📐 api-standards-checker** | Validates API design patterns | Ensures your API follows consistent patterns, like having style guidelines for your code |
| **🎨 code-quality-reporter** | Real-time code quality feedback | Like having a writing coach who suggests improvements as you code |
| **📦 import-organizer** | Organizes and sorts imports | Automatically tidies up your import statements, like auto-organizing your bookshelf |
| **✅ task-completion-enforcer** | Tracks TODO completion | Makes sure you don't forget any tasks, like a smart to-do list that won't let you skip items |
| **📋 commit-message-validator** | Enforces commit conventions | Ensures consistent commit messages, like having a template for professional emails |
| **🔧 pnpm-enforcer** | Ensures pnpm usage | Prevents package manager mix-ups in projects that use pnpm |
| **🧹 universal-linter** | Multi-language linting | Applies the right code checker for each file type automatically |
| **🔔 notification** | System notifications | Alerts you when Claude needs input or completes tasks |
| **🛑 stop** | Cleanup on session end | Saves progress and cleans up resources when you finish working |

[→ Detailed Hook Documentation](docs/hooks-reference.md)

## 🎪 The Parallel Development Workflow

Here's how to transform a complex Linear issue into parallel development streams, explained step-by-step:

### Step 1: Get Your Linear Issue
```bash
cdev get PROJ-123
```
**What happens**: Just like downloading a movie to watch offline, this downloads your Linear issue and saves it locally so you can work without internet.

### Step 2: Let AI Decompose It
```bash
cdev split PROJ-123
```
**What happens**: This is like having a smart architect look at building plans and figure out which parts can be built simultaneously. The AI analyzes your issue and creates a deployment plan:
- Understands what needs to be built (like reading blueprints)
- Identifies independent workstreams (like separating electrical from plumbing work)
- Assigns specialized agents to each part (like assigning experts to their areas)
- Calculates optimal parallelization (like scheduling work for maximum efficiency)

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
**What happens**: This creates separate workspaces for each team member, like giving each contractor their own section of the construction site:
- Each agent gets its own directory (like separate offices)
- Complete codebase copy (using Git's efficient storage - like having blueprints in each office)
- Opens Cursor/VS Code automatically (like setting up each workspace)
- No merge conflicts during development (like having clear boundaries between work areas)

### Step 4: Work with Each Agent
In each opened editor window:
```bash
claude

# Claude loads the agent context automatically
# The agent knows exactly what files to create/modify
# Works through a validation checklist
# Runs tests in isolation
```

Think of this like each expert contractor having their own detailed work order that tells them exactly what to build and how to test it.

### Step 5: Monitor Progress
```bash
cdev status
```
Shows real-time progress across all agents (like a project dashboard):
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
**What happens**: Like a final inspection and assembly process:
- Validates all checklist items completed (quality check)
- Runs integration tests (make sure everything works together)
- Merges in dependency order (assemble in the right sequence)
- Cleans up worktrees (clean up the workspaces)

## 🧠 AI Documentation System

CDEV includes an intelligent documentation system that helps Claude understand your project, like having a knowledgeable team member who knows all your company's standards and practices.

### What are AI Docs?
Think of AI docs as a "training manual" that teaches Claude about:
- Your coding standards and patterns (like company style guides)
- Project-specific conventions (like how your team names things)
- Common workflows and procedures (like standard operating procedures)
- Technology-specific best practices (like safety protocols for specific tools)

### How AI Docs Help

1. **📚 Context Templates** - Pre-written instructions for common scenarios, like templates for different types of work
2. **🎯 Linear Templates** - Structured formats for consistent issue handling, like having a standard form for work orders
3. **🔤 Commit Standards** - Emoji-based semantic commit references, like having a standard labeling system
4. **📝 Command Templates** - Patterns for creating custom Claude commands, like macros for repetitive tasks

**Real-world example**: When Claude sees a Linear issue about "authentication", it automatically references:
- Authentication pattern templates (like following a proven recipe)
- Security best practices (like safety checklists)
- Your project's auth conventions (like using your company's specific methods)
- Testing requirements for auth code (like quality control standards)

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

CDEV organizes hooks into three tiers based on importance, like having different levels of safety protocols:

### Tier 1: Critical Security & Validation
- Cannot be disabled (like mandatory safety equipment)
- Protect against destructive operations (like preventing accidents)
- Ensure code quality standards (like quality control)
- Examples: `pre_tool_use`, `typescript-validator`

### Tier 2: Productivity Enhancement  
- Highly recommended (like helpful tools that make work easier)
- Improve workflow efficiency (like automation that saves time)
- Can be selectively disabled (like optional features)
- Examples: `import-organizer`, `code-quality-reporter`

### Tier 3: Optional Features
- Nice-to-have conveniences (like comfort features)
- Project-specific customizations (like personal preferences)
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

**Traditional approach**: Like building a house one room at a time - 150+ hours of sequential work where each step waits for the previous one to finish.

**CDEV approach**: Like having specialized teams work simultaneously:
1. `cdev get COLLAB-001` - Download the blueprint
2. `cdev split COLLAB-001` - AI creates 5 specialized teams
3. `cdev run` - All teams work at the same time
4. 40 hours total (5 teams × 8 hours each, all happening in parallel)

**Result**: **3.75x faster delivery** with better code organization, just like how a construction project finishes faster when plumbers, electricians, and painters can work simultaneously instead of waiting for each other.

## 📋 Requirements

- **Node.js**: v16.0.0 or higher (the JavaScript runtime)
- **Git**: v2.0.0 or higher (for version control and worktrees)
- **Python**: v3.7 or higher (for advanced hooks)
- **Claude Code**: Latest version installed (the AI assistant)
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