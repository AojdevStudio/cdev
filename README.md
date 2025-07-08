# Parallel Claude Development Workflow

> **Transform any Linear issue into multiple isolated Claude agents working in parallel**

This workflow enables you to take a complex Linear issue, automatically break it down into smaller tasks, and have multiple Claude Code instances work on different parts simultaneously using Git worktrees.

## 🚀 Quick Start

```bash
# 1. Cache a Linear issue
./cache-linear-issue.sh PROJ-123

# 2. Decompose into parallel agents  
node decompose-parallel.cjs PROJ-123

# 3. Spawn ALL agents from the JSON plan (NEW!)
./spawn-agents.sh shared/deployment-plans/proj-123-deployment-plan.json
# 🚀 Automatically opens Cursor in each agent's worktree!

# 4. In each auto-opened Cursor window:
#    - Open terminal (Ctrl+` or Cmd+`)
#    - Run: claude
#    - Feed agent the context from workspaces/{agent_id}/agent_context.json

# 5. Merge when complete
git merge PROJ-123-agent1 PROJ-123-agent2 PROJ-123-agent3
```

**Key Enhancement**: The spawn-agents script now reads the JSON deployment plan and creates ALL agent worktrees automatically, with rich context files, file lists, and validation criteria for each agent.

## 🎯 What This Workflow Does

Instead of having one Claude agent work on a large feature sequentially, this workflow:

1. **Fetches** a Linear issue and caches it locally for offline work
2. **Analyzes** the issue description and breaks it into parallel workstreams
3. **Creates** isolated Git worktrees where each Claude agent can work independently
4. **Enables** multiple Claude instances to work simultaneously without conflicts
5. **Provides** a simple Git-based integration process when work is complete

## 📋 Prerequisites

- **Linear Account**: Access to Linear with an API key
- **Git Repository**: A project using Git version control
- **Claude Code**: Anthropic's Claude Code tool installed
- **Node.js**: For running the decomposition script
- **Cursor**: Code editor (or any editor that can open directories)

## 🗂️ Project Structure

```
your-project/
├── .linear-cache/              # Cached Linear issues
├── shared/
│   └── deployment-plans/       # Decomposed task plans
├── workflows/
│   └── paralell-development-claude/
│       └── scripts/            # This workflow's scripts
└── ../your-project-work-trees/ # Git worktrees (created automatically)
    ├── feature-branch-1/       # Complete codebase copy #1
    ├── feature-branch-2/       # Complete codebase copy #2
    └── feature-branch-3/       # Complete codebase copy #3
```

## 🚀 Step-by-Step Workflow

### Step 1: Cache Linear Issue

**What it does**: Downloads a Linear issue and saves it locally so you can work offline.

```bash
./cache-linear-issue.sh PROJ-123
```

**Requirements**:
- Set your Linear API key: `export LINEAR_API_KEY="your_api_key_here"`
- Replace `PROJ-123` with your actual Linear issue ID

**What happens**:
- Fetches issue details from Linear API
- Saves to `.linear-cache/PROJ-123.json`
- Shows issue title, priority, status, and description preview
- Creates local copy for offline decomposition

**Example output**:
```
✅ Issue cached successfully!
📋 Title: Add user authentication system
🎯 Priority: High
📊 Status: In Progress
👤 Assignee: Jane Developer
💾 Cached to: .linear-cache/PROJ-123.json
📝 Description: 1. Create login/signup forms 2. Implement JWT authentication 3. Add password reset...
```

### Step 2: Decompose Into Parallel Tasks

**What it does**: Analyzes the cached Linear issue and intelligently breaks it down into parallel workstreams using semantic understanding.

```bash
node decompose-parallel.cjs PROJ-123
```

**The Intelligent Decomposition Engine**:

Instead of hardcoded pattern matching, the system uses an advanced semantic analysis engine that:

1. **Analyzes Your Codebase**: Scans your project structure to discover what types of work domains exist (frontend, backend, components, data, infrastructure)
2. **Parses Requirements Semantically**: Extracts actions (create, implement, fix), objects (forms, API, database), technologies (React, MCP, Google Drive), and complexity levels
3. **Maps Requirements to Domains**: Intelligently scores which work domains best match each requirement based on semantic similarity
4. **Generates Agents Dynamically**: Creates specialized agents based on the analysis rather than predefined templates

**How Semantic Analysis Works**:

```javascript
// Example requirement: "Enhanced Google Drive MCP Server - Full Write Capabilities"

// Step 1: Extract semantic information
{
  actions: ['enhance', 'implement'],
  objects: ['server', 'api', 'storage', 'capabilities'],
  technologies: ['mcp', 'google drive'],
  complexity: 'high',
  suggestedDomains: ['backend', 'data', 'infrastructure']
}

// Step 2: Score against discovered work domains
backend_domain: score 8 (high match for 'server', 'api')
data_domain: score 6 (good match for 'storage', 'google drive')
infrastructure_domain: score 4 (match for 'mcp', 'server')

// Step 3: Generate agent dynamically
{
  id: 'backend_server_agent',
  role: 'Backend & API: Enhanced Google Drive MCP Server',
  focusArea: 'Backend & API',
  estimatedTime: 45, // Calculated based on complexity and domain
  type: 'backend'
}
```

**Adaptive Agent Creation**:

The system discovers what makes sense for YOUR specific project:
- **Frontend Apps**: Creates UI, component, and layout agents
- **Backend Services**: Creates API, integration, and data agents  
- **Full-Stack Projects**: Creates balanced agents across all domains
- **Specialized Projects**: Adapts to your unique architecture patterns

**What happens**:
- Creates `shared/deployment-plans/proj-123-deployment-plan.json`
- Each agent gets semantically-matched files to work on
- Calculates realistic time estimates based on complexity analysis
- Determines optimal parallelization strategy
- Shows debugging information about why each agent was created

**Example decomposition output**:
```json
{
  "taskId": "PROJ-123",
  "taskTitle": "Enhanced Google Drive MCP Server - Full Write Capabilities",
  "parallelAgents": [
    {
      "agentId": "backend_server_agent",
      "agentRole": "Backend & API: Enhanced Google Drive MCP Server",
      "focusArea": "Backend & API",
      "canStartImmediately": true,
      "filesToCreate": ["lib/google-drive-client.ts", "pages/api/drive/[...path].ts"],
      "filesToModify": ["lib/mcp-server.ts"],
      "estimatedTime": "45 minutes",
      "_analysis": {
        "complexity": "high",
        "actions": ["enhance", "implement"],
        "objects": ["server", "capabilities", "storage"],
        "technologies": ["mcp", "google drive"]
      }
    },
    {
      "agentId": "data_storage_agent",
      "agentRole": "Data & Integration: Full Write Capabilities", 
      "focusArea": "Data & Integration",
      "canStartImmediately": true,
      "filesToCreate": ["lib/file-operations.ts", "lib/storage-sync.ts"],
      "estimatedTime": "35 minutes"
    }
  ],
  "estimatedTotalTime": "45 minutes",
  "parallelismFactor": "1.8x faster than sequential"
}
```

**Intelligence Features**:
- **Codebase-Aware**: Understands your Next.js vs React vs Node.js project structure
- **Context-Sensitive**: File predictions based on your existing patterns  
- **Complexity-Adaptive**: Time estimates adjust based on requirement complexity
- **Fallback-Safe**: Always creates agents even for novel requirement types
- **Debug-Friendly**: Shows analysis reasoning for transparency

### Step 3: Spawn Parallel Agents

**What it does**: Creates isolated Git worktrees for ALL agents specified in the deployment plan JSON file.

```bash
./spawn-agents.sh shared/deployment-plans/proj-123-deployment-plan.json
```

**What happens**:
- **Reads the deployment plan JSON** to discover all unique agents
- **Creates separate worktrees** for each agent automatically
- **Generates agent-specific workspaces** with context files, file lists, and validation criteria
- **Sets up coordination system** to track progress across all agents
- **Copies essential configuration** (.env, .claude, .cursor) to each worktree
- **🚀 Automatically opens Cursor** in each agent's worktree for immediate development

**Example output**:
```
🚀 Enhanced Parallel Agent Spawning System
📋 Reading deployment plan: shared/deployment-plans/proj-123-deployment-plan.json
🎯 Task: PROJ-123 - Enhanced Google Drive MCP Server
🤖 Found 4 unique agents to spawn: backend_server_agent data_storage_agent forms_validation_agent auth_agent

🌿 Creating Git worktrees for each agent...

🔄 Processing agent: backend_server_agent
   📍 Branch: PROJ-123-backend_server_agent
   📂 Path: ../your-project-work-trees/PROJ-123-backend_server_agent
   🌱 Creating worktree...
   📋 Setting up agent workspace...
   📄 Copying configuration files...
   📝 Generating agent context...
   📁 Generating file lists...
   ✅ Agent backend_server_agent workspace ready!
   🚀 Opening Cursor in: ../your-project-work-trees/PROJ-123-backend_server_agent

[... repeats for each agent ...]

✅ All agent worktrees created successfully!

📊 Summary:
   Task: PROJ-123
   Agents: 4
   Worktrees: ../your-project-work-trees
   Coordination: ../your-project-work-trees/coordination

🔄 Next Steps:
   1. ✅ Cursor instances opened automatically for each agent
   2. In each Cursor window:
      - Open terminal (Ctrl+` or Cmd+`)
      - Run: claude
      - Feed Claude the agent context from workspaces/{agent_id}/agent_context.json
```

**What each agent gets**:
- **Isolated Git worktree**: `../your-project-work-trees/PROJ-123-{agent_id}/`
- **Agent context file**: `workspaces/{agent_id}/agent_context.json` with complete task details
- **File work list**: `workspaces/{agent_id}/files_to_work_on.txt` (CREATE/MODIFY instructions)
- **Test contracts**: `workspaces/{agent_id}/test_contracts.txt` (required tests)
- **Validation checklist**: `workspaces/{agent_id}/validation_checklist.txt` (success criteria)
- **Configuration files**: Copied .env, .claude, .cursor settings

**No more manual agent spawning**: The system automatically creates all agents from the JSON plan!

### Step 4: Start Claude in Each Worktree

**What you do**: Navigate to each agent's worktree and start Claude Code with the generated context.

```bash
# Navigate to an agent's worktree
cd ../your-project-work-trees/PROJ-123-backend_server_agent

# Check the agent's specific instructions
cat workspaces/backend_server_agent/agent_context.json
cat workspaces/backend_server_agent/files_to_work_on.txt
cat workspaces/backend_server_agent/validation_checklist.txt

# Start Claude Code
claude
```

**Give Claude the context**:
```
I'm working as the backend_server_agent on task PROJ-123. Here's my context:

[Paste contents of agent_context.json]

My files to work on:
[Paste contents of files_to_work_on.txt]

My validation criteria:
[Paste contents of validation_checklist.txt]

Please help me implement these requirements.
```

**Example agent context**:
```json
{
  "agentId": "backend_server_agent",
  "taskId": "PROJ-123", 
  "taskTitle": "Enhanced Google Drive MCP Server",
  "branchName": "PROJ-123-backend_server_agent",
  "canStartImmediately": true,
  "allFilesToCreate": [
    "lib/mcp/drive-client.ts",
    "lib/mcp/server-setup.ts", 
    "types/drive-types.ts"
  ],
  "allFilesToModify": [
    "index.ts"
  ],
  "allValidationCriteria": [
    "Google Drive operations complete successfully",
    "MCP server starts without errors",
    "File operations (read/write) work correctly"
  ],
  "estimatedTime": 45
}
```

### Step 5: Monitor Progress (Enhanced Coordination)

The system provides multiple ways to monitor progress across all agents:

**1. Coordination Dashboard**:
```bash
# Check overall status
cat ../your-project-work-trees/coordination/parallel-agent-status.json
```

**Example coordination status**:
```json
{
  "taskId": "PROJ-123",
  "taskTitle": "Enhanced Google Drive MCP Server",
  "totalAgents": 4,
  "agents": [
    {
      "agentId": "backend_server_agent",
      "branchName": "PROJ-123-backend_server_agent", 
      "status": "spawned",
      "canStartImmediately": true,
      "dependencies": [],
      "startedAt": null,
      "completedAt": null
    },
    {
      "agentId": "auth_agent",
      "branchName": "PROJ-123-auth_agent",
      "status": "spawned", 
      "canStartImmediately": false,
      "dependencies": ["backend_server_agent"],
      "startedAt": null,
      "completedAt": null
    }
  ],
  "createdAt": "2025-07-08T02:09:47.956Z",
  "lastUpdated": "2025-07-08T02:09:47.957Z"
}
```

**2. Git Branch Monitoring**:
```bash
# Check what branches exist
git worktree list

# See commits on each agent's branch
git log PROJ-123-backend_server_agent --oneline
git log PROJ-123-auth_agent --oneline
git log PROJ-123-forms_validation_agent --oneline

# Check current status in each worktree
cd ../your-project-work-trees/PROJ-123-backend_server_agent && git status
cd ../your-project-work-trees/PROJ-123-auth_agent && git status
```

**3. Validation Progress**:
```bash
# Check validation criteria completion for each agent
cat ../your-project-work-trees/PROJ-123-backend_server_agent/workspaces/backend_server_agent/validation_checklist.txt
```

**4. Dependency Tracking**:
The system tracks which agents can work immediately vs. which need to wait for dependencies:
- **Independent agents**: Can start immediately
- **Dependent agents**: Wait for prerequisite agents to complete
- **Merge order**: Follow the dependency chain for integration

### Step 6: Integration (Smart Dependency-Aware Workflow)

The system provides a suggested merge order based on agent dependencies:

**1. Check the Integration Plan**:
```bash
# View the merge order from the deployment plan
node -e "const plan = require('./shared/deployment-plans/proj-123-deployment-plan.json'); console.log('Merge Order:', plan.integrationPlan.mergeOrder.join(' → '));"
```

**2. Merge Following Dependencies**:
```bash
# Return to main project
cd main-project/

# Merge in dependency order (example)
git merge PROJ-123-backend_server_agent     # Infrastructure first
git merge PROJ-123-auth_agent               # Authentication second  
git merge PROJ-123-data_storage_agent       # Data layer third
git merge PROJ-123-forms_validation_agent   # Frontend last

# Handle any merge conflicts manually
# Run tests after each merge to catch integration issues early
npm test
```

**3. Validation Steps**:
The deployment plan includes systematic validation:
```json
{
  "integrationPlan": {
    "mergeOrder": ["backend_server_agent", "auth_agent", "data_storage_agent", "forms_validation_agent"],
    "validationSteps": [
      "Run agent-specific tests",
      "Cross-agent integration tests", 
      "Full test suite validation",
      "E2E testing"
    ],
    "estimatedIntegrationTime": "10 minutes"
  }
}
```

**4. Clean Up When Complete**:
```bash
# Remove worktrees after successful integration
git worktree remove ../your-project-work-trees/PROJ-123-backend_server_agent
git worktree remove ../your-project-work-trees/PROJ-123-auth_agent  
git worktree remove ../your-project-work-trees/PROJ-123-data_storage_agent
git worktree remove ../your-project-work-trees/PROJ-123-forms_validation_agent

# Remove coordination directory
rm -rf ../your-project-work-trees/coordination

# Delete feature branches (optional)
git branch -d PROJ-123-backend_server_agent
git branch -d PROJ-123-auth_agent
git branch -d PROJ-123-data_storage_agent  
git branch -d PROJ-123-forms_validation_agent
```

## 💡 Key Benefits

### **Speed**: Parallel vs Sequential
- **Traditional**: 45 + 35 + 30 = 110 minutes total
- **Parallel**: max(45, 35, 30) = 45 minutes total
- **Result**: 2.4x faster development

### **Intelligence**: Semantic Understanding
- Analyzes requirements by meaning, not just keywords
- Adapts to your specific codebase architecture
- Creates agents based on discovered work domains
- Provides debugging information for transparency

### **Isolation**: No Conflicts
- Each agent works on separate file copies
- No Git conflicts during development
- Independent testing and iteration
- Clean merge process when complete

### **Adaptability**: Works with Any Project
- **React Apps**: UI, component, and state management agents
- **Next.js Projects**: Page, API route, and middleware agents
- **Backend Services**: Integration, data, and infrastructure agents
- **Full-Stack**: Balanced agents across all layers

### **Flexibility**: Your Custom Commands
- Agents work with your existing Claude slash commands
- You control the specific instructions per agent
- Easy to adapt to any development workflow
- Scales from simple features to complex systems

## 🛠️ Creating Custom Claude Commands

Based on your decomposition plan, you can create specialized slash commands:

### Example: Backend Integration Agent Command
```markdown
# .claude/commands/implement-mcp-integration.md

## Implement MCP Server Integration

You are the backend integration specialist agent. Your job is to:

1. Create MCP server integration layer
2. Implement Google Drive API client
3. Add write capabilities and error handling

**Files to focus on**: lib/mcp-server.ts, lib/google-drive-client.ts

**Success criteria**: MCP server connects to Google Drive with full write access

**Tests to pass**: mcp-integration.test.js, google-drive.test.js
```

### Example: Data Storage Agent Command
```markdown
# .claude/commands/build-file-operations.md

## Build File Operations System

You are the data storage specialist agent. Your job is to:

1. Create file upload/download operations
2. Implement storage sync functionality
3. Add file validation and security checks

**Files to create**: lib/file-operations.ts, lib/storage-sync.ts

**Success criteria**: Files can be uploaded, downloaded, and synced securely

**Tests to pass**: file-operations.test.js, storage-sync.test.js
```

## 📝 Tips for Success

### **Writing Good Linear Issues**
- Use numbered lists for requirements (1. Implement server, 2. Add storage, 3. Create forms)
- Be specific about what needs to be built
- Include acceptance criteria
- Mention any architectural constraints

### **Optimal Agent Count**
- **2-4 agents**: Sweet spot for most features
- **Complex systems**: 4-6 agents with clear domain separation
- **Simple features**: 1-2 agents may be sufficient
- **Coordination overhead**: More agents require more merge coordination

### **Managing Dependencies**
- **Infrastructure first**: Deploy backend/API agents before frontend agents
- **Components before UI**: Build reusable components before complex interfaces  
- **Data before presentation**: Establish data layer before visualization
- **The system automatically calculates and suggests merge order**

### **Semantic Requirements Writing**
- **Use action verbs**: "Implement", "Create", "Integrate", "Enhance"
- **Specify technologies**: "MCP server", "Google Drive API", "React forms"
- **Include objects**: "file operations", "authentication system", "dashboard"
- **Indicate complexity**: "basic login" vs "enterprise SSO integration"

### **Testing Strategy**  
- Each agent should run tests in their worktree
- Agents should only commit when tests pass
- Run full test suite after integration

## 🔧 Environment Setup

### Linear API Key
```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Project Structure
```bash
# Make scripts executable
chmod +x cache-linear-issue.sh
chmod +x spawn-agents.sh

# Install Node.js dependencies for decomposition
npm install # or pnpm install
```

## 🎯 Next Steps

1. **Try the workflow** with a Linear issue containing numbered requirements
2. **Observe the semantic analysis** in the decomposition output to understand the AI reasoning
3. **Create custom slash commands** based on the generated agent specifications
4. **Refine your Linear issue writing** to work optimally with semantic analysis
5. **Scale up** to larger, more complex features across multiple domains

## 🧠 How the Intelligence Works

The workflow uses advanced semantic analysis to understand your requirements:

**Traditional Approach** (keyword matching):
```
"forms" → forms_agent
"api" → api_agent  
"chart" → chart_agent
```

**Intelligent Approach** (semantic understanding):
```
"Enhanced Google Drive MCP Server" →
  - Actions: [enhance, implement, integrate]
  - Objects: [server, storage, api, capabilities]  
  - Technologies: [mcp, google drive]
  - Complexity: high
  - Best Domain: backend (score: 8/10)
  - Agent: backend_server_agent
```

This enables the system to handle any type of requirement, adapt to your specific codebase, and generate meaningful parallel work distributions without manual configuration.

The future of development is here: **AI that understands context, not just keywords.**
