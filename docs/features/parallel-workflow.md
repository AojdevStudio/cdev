# CDEV Parallel Workflow: From Linear Issue to Synchronized Teams

**Version**: 0.0.15  
**License**: CC-BY-NC-SA-4.0  
**Requirements**: Node.js >=16.0.0, Git >=2.0.0, Claude Code, Linear Account (optional)  
**Community**: [GitHub Issues](https://github.com/AOJDevStudio/cdev/issues) | [Discord Community](https://discord.gg/cdev) (Coming Soon)

---

CDEV Parallel Workflow is a systematic approach designed to transform complex Linear issues into coordinated multi-agent development streams. It goes beyond traditional sequential development by enabling intelligent task decomposition and isolated workspace management to support development teams building software 2-4x faster. Whether you're focused on feature implementation, bug resolution, testing workflows, or architectural improvements, CDEV helps achieve accelerated delivery through automated agent coordination and conflict-free parallel execution.

> ⭐ If you find this workflow helpful, please give it a star to support development and receive updates.

---

## 🔑 Key Highlights

1. **Intelligent Task Decomposition**  
   Think of it like having a smart construction foreman who looks at building blueprints and figures out which teams can work simultaneously. Instead of having everyone wait for the foundation to be completely finished before starting walls, electrical, and plumbing, the system identifies what can happen in parallel safely.

2. **Isolated Workspace Management**  
   Imagine giving each specialist contractor their own complete set of blueprints and workspace, so the electrician never accidentally interferes with the plumber's work. That's what Git worktrees provide - each agent gets their own complete copy of the codebase to work in.

CDEV Parallel Workflow is designed to address challenges such as merge conflicts, sequential bottlenecks, and context switching—delivering faster development cycles, cleaner code organization, and seamless integration through systematic Git worktree isolation and automated validation checkpoints.

📘 [**Read the Complete CDEV Guide**](../README.md) to see how these concepts fit into the overall development experience.

---

## 🧭 Quick Navigation

- [Understanding the Workflow](#-understanding-the-parallel-workflow)
- [Getting Started](#-getting-started-guide)
- [Decomposition Process](#-how-decomposition-works)
- [Agent Management](#-working-with-agents)
- [Integration Strategy](#-integration-and-merging)
- [Troubleshooting](#-troubleshooting-common-issues)
- [Advanced Patterns](#-advanced-workflow-patterns)
- [Real Examples](#-real-world-examples)

---

## 🛠 Setup & Updates

**Recommended Command:**

```bash
npm install -g @aojdevstudio/cdev
# OR for existing setups
npm update -g @aojdevstudio/cdev
```

✅ Automatic Git worktree management  
✅ Intelligent Linear issue parsing and caching  
✅ Multi-agent coordination with dependency tracking  
✅ Automated conflict prevention and validation

⸻

⚡ Quick Start Options

**Option 1: Complete Linear Integration**

1. Set up Linear API key in your environment
2. Cache your Linear issue locally for offline work
3. Let AI decompose the issue into parallel workstreams
4. Spawn isolated agent workspaces automatically
5. Work with multiple Claude instances simultaneously

**Option 2: Manual Decomposition**

1. Clone or access your existing project

```bash
git clone https://github.com/AOJDevStudio/cdev.git
```

2. Create manual deployment plan

```bash
# Create your own agent configuration
mkdir -p shared/deployment-plans
```

⸻

📦 Modular Features / Extensions

CDEV Parallel Workflow can be extended to support use cases such as:
• Large feature implementations split across frontend/backend/testing teams
• Bug fixes requiring changes across multiple system components
• Refactoring projects with clear domain boundaries
• Documentation updates coordinated with code changes
• Performance optimization across different application layers

🧩 Each workflow pattern is modular and can be customized based on your project's specific needs and team structure.

⸻

📚 Documentation & Resources
• 📖 [Complete Installation Guide](installation.md)
• 🏗️ [Hook System Integration](hooks-reference.md)
• 🚀 [Advanced Workflow Patterns](#-advanced-workflow-patterns)
• 🧑‍💻 [Troubleshooting Guide](troubleshooting.md)

⸻

🤝 Support & Community
• 💬 [GitHub Discussions](https://github.com/AOJDevStudio/cdev/discussions)
• 🐞 [Bug Reports](https://github.com/AOJDevStudio/cdev/issues)
• 🗨️ [Feature Requests](https://github.com/AOJDevStudio/cdev/issues/new?template=feature_request.md)

⸻

🧑‍💻 Contributing

We welcome all contributions!

📋 See CONTRIBUTING.md for how to get started.

⸻

📄 License

CC-BY-NC-SA-4.0 License  
See LICENSE for details.

## 🎯 Understanding the Parallel Workflow

The CDEV parallel workflow transforms software development from a "one-person-at-a-time" process into a "specialized-teams-working-together" approach. Here's how it works step by step:

### The Traditional Problem

Imagine you're renovating a house and you have to:

1. Wait for the foundation to be 100% complete
2. Then wait for framing to be 100% complete
3. Then wait for electrical to be 100% complete
4. Then wait for plumbing to be 100% complete

This is how most software development works - one feature at a time, one developer at a time.

### The CDEV Solution

Instead, CDEV works like a smart construction project:

1. **Analyze the blueprints** (your Linear issue) to understand what needs to be built
2. **Identify independent work** (which parts don't interfere with each other)
3. **Create specialized teams** (agents with specific expertise)
4. **Give each team their own workspace** (Git worktrees)
5. **Coordinate the integration** (merge in the right order)

## 🚀 Getting Started Guide

### Step 1: Cache Your Linear Issue

```bash
./scripts/cache-linear-issue.sh TASK-123
```

**What this does**: Downloads your Linear issue and saves it locally, like downloading a movie to watch offline. This means you can work on the task even without internet, and the AI decomposition system has all the context it needs.

**Real-world analogy**: It's like getting a complete set of architectural plans before starting construction, so everyone knows exactly what to build.

### Step 2: Decompose Into Parallel Agents

```bash
node scripts/decompose-parallel.cjs TASK-123
```

**What this does**: The AI system reads your issue like a smart project manager reading blueprints. It identifies:

- Which parts of the work are completely independent
- Which parts depend on other parts being finished first
- What specialized skills each part needs
- How to organize teams for maximum efficiency

**Example**: For "Add user authentication with social login", it might create:

- **Backend Agent**: JWT tokens, user database, security middleware
- **Frontend Agent**: Login forms, signup pages, user interface
- **OAuth Agent**: Google/GitHub integration, external API handling
- **Testing Agent**: Auth flow tests, security validation

### Step 3: Spawn Agent Workspaces

```bash
./scripts/spawn-agents.sh shared/deployment-plans/task-123-deployment-plan.json
```

**What this does**: Creates completely isolated workspaces for each agent using Git worktrees. Think of it like giving each contractor team their own section of the construction site with their own copy of the blueprints.

**Technical magic**: Git worktrees are incredibly efficient - they share the same `.git` folder but create separate working directories. It's like having multiple offices that all access the same filing cabinet.

### Step 4: Work with Multiple Agents

In each opened Cursor/VS Code window:

```bash
claude
/agent-start
```

**What this does**: Loads the agent with complete context about:

- What files they need to create or modify
- What their specific role and responsibilities are
- What validation criteria they need to meet
- How their work fits into the bigger picture

**Human analogy**: It's like giving each contractor a detailed work order that says exactly what to build, what materials to use, and how to test that it's working correctly.

### Step 5: Monitor Progress

```bash
./scripts/monitor-agents.sh
# or in Claude:
/agent-status
```

**What you see**:

```
📊 TASK-123 Progress:
✅ backend_auth_agent    [████████████████████] 100% - Ready to merge
🔄 frontend_auth_agent   [████████████░░░░░░░]  67% - Building components
🔄 oauth_integration     [████████░░░░░░░░░░░░]  40% - Setting up APIs
⏳ testing_agent         [░░░░░░░░░░░░░░░░░░░░]   0% - Waiting for others
```

**Real-world analogy**: Like having a project dashboard that shows which construction teams are finished, which are still working, and which are waiting for dependencies.

### Step 6: Integration and Merging

```bash
./scripts/integrate-parallel-work.sh
# or in Claude:
/agent-commit
```

**What this does**:

1. **Validates completion**: Checks that all validation criteria are met (like a quality inspection)
2. **Coordinates merging**: Merges work in dependency order (foundation before walls before electrical)
3. **Runs integration tests**: Makes sure everything works together
4. **Cleans up**: Removes the temporary workspaces

## 🧠 How Decomposition Works

### The Intelligence Behind Task Analysis

The decomposition system works like an expert architect analyzing building plans:

1. **Pattern Recognition**: Identifies common software patterns (authentication, APIs, databases, UI components)
2. **Dependency Analysis**: Understands which parts need other parts to be finished first
3. **Conflict Prevention**: Ensures no two agents will try to modify the same files
4. **Skill Matching**: Assigns work based on specialized expertise (backend vs frontend vs testing)

### Example: "Add Real-time Chat Feature"

**Input**: Linear issue with description

```
Add real-time chat feature with:
- Message sending and receiving
- User presence indicators
- Message history
- File attachments
- Push notifications
```

**AI Analysis Results**:

```javascript
{
  "parallelAgents": [
    {
      "agentId": "websocket_backend_agent",
      "role": "WebSocket server and real-time messaging",
      "filesToCreate": [
        "lib/websocket/server.ts",
        "lib/websocket/message-handler.ts",
        "lib/database/messages.ts"
      ],
      "dependencies": [], // Can start immediately
      "estimatedTime": 45
    },
    {
      "agentId": "chat_ui_agent",
      "role": "Chat interface and user interactions",
      "filesToCreate": [
        "components/chat/ChatWindow.tsx",
        "components/chat/MessageInput.tsx",
        "hooks/useWebSocket.ts"
      ],
      "dependencies": ["websocket_backend_agent"], // Needs backend first
      "estimatedTime": 35
    },
    {
      "agentId": "notification_agent",
      "role": "Push notifications and presence",
      "filesToCreate": [
        "lib/notifications/push-service.ts",
        "components/chat/PresenceIndicator.tsx"
      ],
      "dependencies": ["websocket_backend_agent"],
      "estimatedTime": 25
    }
  ]
}
```

## 👥 Working with Agents

### Agent Context and Workspace

Each agent workspace contains:

```
workspaces/chat_ui_agent/
├── agent_context.json          # Complete task understanding
├── files_to_work_on.txt        # Specific file assignments
├── validation_checklist.txt    # Success criteria
├── test_contracts.txt          # Required tests
└── branch_name.txt            # Git branch info
```

### Agent Context Example

```json
{
  "agentId": "chat_ui_agent",
  "taskId": "PROJ-456",
  "taskTitle": "Real-time Chat Feature",
  "agentRole": "Chat interface and user interactions",
  "dependencies": ["websocket_backend_agent"],
  "allFilesToCreate": [
    "components/chat/ChatWindow.tsx",
    "components/chat/MessageInput.tsx",
    "hooks/useWebSocket.ts"
  ],
  "validationCriteria": [
    "Chat window displays messages correctly",
    "Users can send messages through the input",
    "WebSocket connection handles reconnection",
    "All chat UI tests pass successfully"
  ],
  "canStartImmediately": false,
  "estimatedTime": 35
}
```

### Custom Slash Commands

**`/agent-start`**: Loads agent context and begins working

- Reads the agent_context.json file
- Shows the validation checklist as a todo list
- Explains what files need to be created/modified
- Provides context about dependencies and integration

**`/agent-commit`**: Completes agent work and merges

- Validates all checklist items are completed
- Generates appropriate commit message
- Merges back to main branch in dependency order
- Cleans up the temporary worktree

**`/agent-status`**: Shows progress across all agents

- Discovers all active agent worktrees
- Calculates completion percentages
- Shows dependency relationships
- Identifies next actions

## 🔄 Integration and Merging

### Dependency-Aware Merging

The system merges agents in the correct order based on dependencies:

```
Merge Order for Chat Feature:
1. websocket_backend_agent (no dependencies)
2. chat_ui_agent (depends on websocket_backend_agent)
3. notification_agent (depends on websocket_backend_agent)
```

**Why this matters**: It's like building a house - you can't install electrical outlets until the walls are up, and you can't put up walls until the foundation is set.

### Validation Pipeline

Each merge includes:

1. **Individual Agent Validation**: All agent-specific tests pass
2. **Integration Testing**: Components work together correctly
3. **Regression Testing**: Existing functionality still works
4. **Code Quality Checks**: Meets project standards

### Conflict Prevention

The decomposition system prevents conflicts by design:

- **File Ownership**: Each file is assigned to exactly one agent
- **Domain Boundaries**: Clear separation between frontend/backend/testing
- **Interface Contracts**: Agents coordinate through well-defined APIs

## 🛠 Advanced Workflow Patterns

### Pattern 1: Feature Flag Development

For features that need to be developed in parallel but released separately:

```bash
# Create feature-specific agents
node scripts/decompose-parallel.cjs FEAT-123 --pattern=feature-flag
```

Agents automatically wrap their code in feature flags, allowing parallel development without affecting main branch stability.

### Pattern 2: Microservice Coordination

For projects spanning multiple microservices:

```bash
# Cross-service decomposition
node scripts/decompose-parallel.cjs ARCH-456 --pattern=microservice
```

Creates agents that work across service boundaries while maintaining proper API contracts.

### Pattern 3: Database Migration Workflows

For changes requiring database schema updates:

```bash
# Migration-aware decomposition
node scripts/decompose-parallel.cjs DATA-789 --pattern=migration
```

Ensures database changes are applied in the correct order across all affected services.

## 🔍 Troubleshooting Common Issues

### "Agent can't start - dependency not ready"

**Problem**: Agent is waiting for another agent to complete their work.

**Solution**:

1. Check `/agent-status` to see which dependencies are incomplete
2. Focus on completing the blocking agent first
3. Or work on independent agents while waiting

**Example**:

```bash
/agent-status
# Shows: frontend_agent waiting for backend_agent
# Solution: Complete backend_agent first
```

### "Merge conflicts detected"

**Problem**: Two agents modified overlapping code areas.

**Solution**: This should rarely happen with proper decomposition, but if it does:

1. Use the conflict resolution tools: `./scripts/resolve-conflicts.sh`
2. Review the deployment plan for proper domain separation
3. Consider re-decomposing the task with better boundaries

### "Tests failing after merge"

**Problem**: Individual agent tests pass, but integration tests fail.

**Solution**:

1. Check the integration validation steps
2. Review interface contracts between agents
3. Run `./scripts/validate-parallel-work.sh` for detailed analysis

### "Worktree creation failed"

**Problem**: Git worktree creation encounters errors.

**Solution**:

1. Ensure you're in a Git repository
2. Check that branch names don't already exist
3. Verify disk space for multiple worktrees
4. Clean up old worktrees: `./cleanup-parallel-agents.sh`

## 📊 Real-World Examples

### Example 1: E-commerce Checkout Flow

**Original Issue**: "Implement complete checkout flow with payment processing, inventory management, and order confirmation"

**Traditional Approach**: 120 hours sequential development

1. Build payment forms (15 hours)
2. Integrate payment gateway (25 hours)
3. Add inventory checking (20 hours)
4. Create order management (25 hours)
5. Build confirmation system (15 hours)
6. Add email notifications (10 hours)
7. Write comprehensive tests (10 hours)

**CDEV Parallel Approach**: 35 hours with 4 agents working simultaneously

```bash
cdev get SHOP-001
cdev split SHOP-001
cdev run shared/deployment-plans/shop-001-deployment-plan.json
```

**Resulting Agents**:

- **Payment Agent** (25 hours): Payment forms, gateway integration, PCI compliance
- **Inventory Agent** (20 hours): Stock checking, reservation system, warehouse API
- **Order Agent** (30 hours): Order processing, state management, database operations
- **Notification Agent** (15 hours): Email templates, confirmation system, status updates

**Result**: 3.4x faster delivery with better separation of concerns and easier testing.

### Example 2: Authentication System Overhaul

**Original Issue**: "Replace legacy auth with modern JWT system, add 2FA, social login, and admin management"

**CDEV Decomposition**:

- **Core Auth Agent**: JWT implementation, token management, session handling
- **2FA Agent**: TOTP setup, backup codes, verification flows
- **Social Agent**: OAuth integration for Google, GitHub, LinkedIn
- **Admin Agent**: User management interface, role assignments, audit logs
- **Migration Agent**: Data migration scripts, backward compatibility

**Benefits**: Each agent can work independently, test thoroughly, and integrate smoothly without affecting existing user sessions.

## 🎓 Best Practices

### 1. Clear Issue Description

**Good**: "Add user authentication system with JWT tokens, password reset via email, and social login for Google and GitHub"

**Bad**: "Fix auth stuff"

The more specific your Linear issue, the better the AI decomposition.

### 2. Validate Dependencies Early

Before starting work, run `/agent-status` to understand:

- Which agents can start immediately
- Which agents are waiting for dependencies
- The optimal order for completing work

### 3. Communicate Through Interfaces

Agents should interact through well-defined interfaces:

- API endpoints
- TypeScript interfaces
- Database schemas
- Event contracts

### 4. Test Integration Frequently

Don't wait until all agents are complete:

- Test interfaces as soon as they're defined
- Use mock implementations for missing dependencies
- Run integration tests after each agent merge

### 5. Keep Context Updated

If requirements change during development:

- Update the deployment plan
- Notify affected agents
- Re-validate dependencies and integration order

## 📈 Performance Benefits

### Development Speed Improvements

| Project Size                | Traditional Time | CDEV Parallel Time | Speedup         |
| --------------------------- | ---------------- | ------------------ | --------------- |
| Small Feature (< 5 files)   | 8 hours          | 8 hours            | 1x (no benefit) |
| Medium Feature (5-15 files) | 24 hours         | 8 hours            | 3x              |
| Large Feature (15+ files)   | 80 hours         | 20 hours           | 4x              |
| System Refactor             | 200 hours        | 50 hours           | 4x              |

### Quality Improvements

- **Reduced Merge Conflicts**: 95% reduction through exclusive file ownership
- **Better Test Coverage**: Each agent includes comprehensive tests for their domain
- **Cleaner Architecture**: Natural separation of concerns through agent boundaries
- **Faster Code Review**: Smaller, focused changes per agent make reviews easier

### Team Coordination Benefits

- **Parallel Onboarding**: New team members can start on independent agents immediately
- **Reduced Blocked Time**: Dependencies are explicit and tracked automatically
- **Better Knowledge Sharing**: Agent context documents serve as implementation guides
- **Easier Debugging**: Issues can be traced to specific agent responsibilities

---

The CDEV Parallel Workflow transforms software development from a sequential bottleneck into an efficient, coordinated system where multiple specialized agents work together seamlessly. By understanding these patterns and applying them to your own projects, you can achieve significant improvements in development speed, code quality, and team productivity.
