# Parallel Development Workflow Guide

> **Master the art of parallel development with CDEV - from simple features to complex system-wide changes**

## 📚 Table of Contents

1. [Understanding Parallel Development](#understanding-parallel-development)
2. [When to Use Parallel Workflows](#when-to-use-parallel-workflows)
3. [The Complete Workflow](#the-complete-workflow)
4. [Agent Types and Specializations](#agent-types-and-specializations)
5. [Dependency Management](#dependency-management)
6. [Integration Strategies](#integration-strategies)
7. [Advanced Patterns](#advanced-patterns)
8. [Troubleshooting](#troubleshooting)

## Understanding Parallel Development

### Traditional vs Parallel Development

**Traditional Sequential Approach:**
```
Developer → Frontend (2 days) → Backend (2 days) → Tests (1 day) = 5 days
```

**CDEV Parallel Approach:**
```
Frontend Agent ─┐
Backend Agent  ─┼─→ Integration → Complete = 2 days
Test Agent     ─┘
```

### How It Works

Think of CDEV as a **project manager** that:
1. **Understands** your requirements deeply
2. **Divides** work intelligently 
3. **Assigns** specialized agents
4. **Coordinates** their efforts
5. **Integrates** the results

Each agent is like a specialized developer working in their own office (Git worktree), preventing them from stepping on each other's toes.

## When to Use Parallel Workflows

### ✅ Perfect For:

1. **Multi-layer features**
   - Frontend + Backend + Database changes
   - Example: User authentication system

2. **Cross-cutting concerns**
   - Feature that touches multiple modules
   - Example: Adding analytics throughout app

3. **Large refactoring**
   - Updating API structure across codebase
   - Example: REST to GraphQL migration

4. **Time-critical features**
   - Need to deliver fast
   - Example: Critical bug fix with tests

### ❌ Not Ideal For:

1. **Single-file changes**
   - Simple bug fixes
   - Example: Fixing a typo

2. **Sequential dependencies**
   - Each step depends on previous
   - Example: Database migration chain

3. **Exploratory work**
   - Requirements unclear
   - Example: Proof of concept

## The Complete Workflow

### Step 1: Issue Preparation

Before starting, ensure your Linear issue is well-structured:

```markdown
# Good Linear Issue Example

Title: Add real-time notifications with email fallback

Description:
1. Create WebSocket notification system
2. Add email notification service  
3. Create notification preferences UI
4. Add notification history storage
5. Write comprehensive tests

Acceptance Criteria:
- [ ] Users receive instant notifications
- [ ] Email sent if user offline > 5 min
- [ ] Users can configure preferences
- [ ] Notification history accessible
```

### Step 2: Cache the Issue

```bash
cdev get NOTIF-123
```

**Output:**
```
✅ Issue cached successfully!
📋 Title: Add real-time notifications with email fallback
🎯 Priority: High
📊 Status: In Progress
💾 Cached to: .linear-cache/NOTIF-123.json
```

### Step 3: AI Decomposition

```bash
cdev split NOTIF-123
```

**What happens behind the scenes:**

1. **Semantic Analysis**
   ```javascript
   {
     "analysis": {
       "domains": ["realtime", "email", "frontend", "storage"],
       "complexity": "high",
       "parallelizable": true,
       "estimatedAgents": 4
     }
   }
   ```

2. **Agent Assignment**
   ```javascript
   {
     "agents": [
       {
         "id": "websocket_agent",
         "role": "Real-time WebSocket implementation",
         "files": ["server/websocket.ts", "lib/socket-manager.ts"],
         "dependencies": []
       },
       {
         "id": "email_agent",
         "role": "Email notification service",
         "files": ["services/email.ts", "templates/notifications/"],
         "dependencies": []
       },
       {
         "id": "frontend_agent",
         "role": "Notification UI and preferences",
         "files": ["components/NotificationCenter.tsx", "pages/preferences.tsx"],
         "dependencies": ["websocket_agent"]
       },
       {
         "id": "storage_agent",
         "role": "Notification history and persistence",
         "files": ["models/Notification.ts", "api/notifications.ts"],
         "dependencies": []
       }
     ]
   }
   ```

### Step 4: Spawn Parallel Agents

```bash
cdev run shared/deployment-plans/notif-123-deployment-plan.json
```

**What gets created:**

```
../project-work-trees/
├── NOTIF-123-websocket_agent/
│   ├── workspaces/websocket_agent/
│   │   ├── agent_context.json       # Full task context
│   │   ├── files_to_work_on.txt    # Exact files to create/modify
│   │   ├── validation_checklist.txt # Success criteria
│   │   └── test_contracts.txt       # Required tests
│   └── [full project copy]
├── NOTIF-123-email_agent/
├── NOTIF-123-frontend_agent/
└── NOTIF-123-storage_agent/
```

### Step 5: Agent Development

Each agent workspace includes rich context:

**agent_context.json example:**
```json
{
  "agentId": "websocket_agent",
  "taskTitle": "Real-time WebSocket implementation",
  "objective": "Create a robust WebSocket system for real-time notifications",
  "requirements": [
    "Handle connection/reconnection gracefully",
    "Support room-based broadcasting",
    "Implement heartbeat for connection health",
    "Scale horizontally with Redis adapter"
  ],
  "technicalDetails": {
    "framework": "Socket.io",
    "adapter": "Redis",
    "authentication": "JWT",
    "fallback": "Long polling"
  },
  "validationCriteria": [
    "Clients can connect and authenticate",
    "Messages broadcast to correct rooms",
    "Handles 1000+ concurrent connections",
    "Reconnection works within 5 seconds"
  ]
}
```

**files_to_work_on.txt example:**
```
CREATE: server/websocket.ts
- Initialize Socket.io server
- Configure Redis adapter
- Implement authentication middleware
- Add room management logic

CREATE: lib/socket-manager.ts  
- Client connection handling
- Event emitter patterns
- Reconnection logic
- Error handling

MODIFY: server/index.ts
- Add WebSocket server initialization
- Configure CORS for WebSocket

CREATE: tests/websocket.test.ts
- Connection tests
- Authentication tests
- Broadcasting tests
- Reconnection tests
```

### Step 6: Working with Claude

In each agent's worktree:

```bash
cd ../project-work-trees/NOTIF-123-websocket_agent
claude

# First message to Claude:
"I'm working as the websocket_agent on task NOTIF-123. 
Please read my context from workspaces/websocket_agent/agent_context.json
and implement the requirements following the validation checklist."
```

Claude will:
1. Read the context files
2. Understand the specific requirements
3. Create/modify only the assigned files
4. Run tests in isolation
5. Check off validation criteria

### Step 7: Monitor Progress

```bash
cdev status
```

**Real-time progress display:**
```
📊 NOTIF-123 Progress Report
════════════════════════════

🚀 websocket_agent     [████████████████████] 100% ✅
   ✓ WebSocket server created
   ✓ Redis adapter configured
   ✓ All tests passing
   
📧 email_agent         [████████████████░░░░] 80% 🔄
   ✓ Email service created
   ✓ Templates designed
   ⚠ Finishing rate limiting
   
🎨 frontend_agent      [████████░░░░░░░░░░░░] 40% 🔄
   ✓ Notification center UI started
   ⏳ Waiting for websocket_agent
   
💾 storage_agent       [████████████████████] 100% ✅
   ✓ Database models created
   ✓ API endpoints complete
   ✓ Migration files ready

⏱️ Estimated completion: 25 minutes
```

### Step 8: Integration

```bash
cdev commit
```

**Integration process:**

1. **Validation Phase**
   ```
   🔍 Checking all agents...
   ✅ websocket_agent: All criteria met
   ✅ email_agent: All criteria met
   ✅ frontend_agent: All criteria met
   ✅ storage_agent: All criteria met
   ```

2. **Test Phase**
   ```
   🧪 Running integration tests...
   ✅ WebSocket + Frontend integration
   ✅ Email service integration
   ✅ Storage persistence
   ✅ End-to-end notification flow
   ```

3. **Merge Phase**
   ```
   🔀 Merging in dependency order...
   1. websocket_agent → main
   2. storage_agent → main
   3. email_agent → main
   4. frontend_agent → main (depends on websocket)
   ```

4. **Cleanup Phase**
   ```
   🧹 Cleaning up...
   ✅ Worktrees removed
   ✅ Feature branches deleted
   ✅ Cache cleared
   ```

## Agent Types and Specializations

### Core Agent Types

| Agent Type | Specialization | Common Tasks |
|------------|---------------|--------------|
| **backend_agent** | Server-side logic | APIs, database operations, business logic |
| **frontend_agent** | UI/UX implementation | React components, state management, styling |
| **data_agent** | Database & storage | Schemas, migrations, data access layers |
| **integration_agent** | External services | Third-party APIs, webhooks, OAuth |
| **testing_agent** | Quality assurance | Unit tests, integration tests, E2E tests |
| **devops_agent** | Infrastructure | Docker, CI/CD, deployment configs |
| **docs_agent** | Documentation | API docs, user guides, README updates |

### Agent Selection Logic

CDEV automatically selects agent types based on:

1. **File patterns**
   - `/api/` → backend_agent
   - `/components/` → frontend_agent
   - `/tests/` → testing_agent

2. **Technology detection**
   - GraphQL schema → graphql_agent
   - Dockerfile → devops_agent
   - OpenAPI spec → api_agent

3. **Semantic understanding**
   - "authentication" → security_agent
   - "payment processing" → payment_agent
   - "real-time" → websocket_agent

## Dependency Management

### Understanding Dependencies

Dependencies ensure agents complete work in the correct order:

```javascript
{
  "agents": [
    {
      "id": "database_agent",
      "dependencies": []  // Can start immediately
    },
    {
      "id": "api_agent",
      "dependencies": ["database_agent"]  // Waits for database
    },
    {
      "id": "frontend_agent",
      "dependencies": ["api_agent"]  // Waits for API
    }
  ]
}
```

### Dependency Patterns

1. **Linear Dependencies**
   ```
   database → api → frontend → tests
   ```

2. **Parallel with Convergence**
   ```
   auth_service ─┐
   user_service ─┼─→ api_gateway → frontend
   data_service ─┘
   ```

3. **Diamond Dependencies**
   ```
         ┌─→ service_a ─┐
   base ─┤              ├─→ integration
         └─→ service_b ─┘
   ```

### Managing Complex Dependencies

For complex dependency graphs, CDEV provides:

```bash
# Visualize dependencies
cdev deps --visualize PROJ-123

# Check for circular dependencies
cdev deps --check PROJ-123

# Override dependencies
cdev deps --override PROJ-123 --remove frontend_agent:api_agent
```

## Integration Strategies

### 1. Big Bang Integration
All agents merge at once - suitable for independent features

```bash
cdev commit --strategy=bigbang
```

### 2. Incremental Integration
Merge as each agent completes - reduces integration risk

```bash
cdev commit --strategy=incremental
```

### 3. Staged Integration
Group related agents - balance speed and safety

```bash
cdev commit --strategy=staged --stages=backend,frontend,tests
```

### Handling Merge Conflicts

When conflicts occur:

```bash
# Automatic resolution attempt
cdev resolve-conflicts PROJ-123

# Manual resolution
cd ../project-work-trees/PROJ-123-frontend_agent
git merge main
# Resolve conflicts
git add .
git commit
cdev commit --continue
```

## Advanced Patterns

### 1. Multi-Phase Development

For very large features, use phases:

```yaml
# Phase 1: Core Infrastructure
agents:
  - database_schema_agent
  - api_structure_agent
  - auth_system_agent

# Phase 2: Feature Implementation  
agents:
  - user_features_agent
  - admin_features_agent
  - notification_agent

# Phase 3: Polish & Testing
agents:
  - ui_polish_agent
  - performance_agent
  - e2e_testing_agent
```

### 2. Cross-Project Agents

For changes spanning multiple repositories:

```bash
# Configure multi-repo support
cdev config --multi-repo

# Spawn agents across projects
cdev spawn multi-repo-plan.json --repos=api,frontend,mobile
```

### 3. Conditional Agents

Agents that activate based on conditions:

```json
{
  "conditionalAgents": [
    {
      "id": "migration_agent",
      "condition": "hasSchemaChanges",
      "activation": "automatic"
    },
    {
      "id": "security_audit_agent",
      "condition": "touchesAuthCode",
      "activation": "manual"
    }
  ]
}
```

### 4. Agent Templates

Create reusable agent templates:

```bash
# Save successful agent pattern
cdev template save websocket_implementation

# Reuse in future projects
cdev spawn --template=websocket_implementation NEW-123
```

## Troubleshooting

### Common Issues and Solutions

#### Agents Not Starting
```bash
# Check agent status
cdev status --detailed

# Verify dependencies
cdev deps --check PROJ-123

# Force start specific agent
cdev start PROJ-123-frontend_agent --force
```

#### Validation Failures
```bash
# See what's failing
cdev validate PROJ-123-backend_agent

# Run specific validation
cdev validate PROJ-123-backend_agent --criteria="API tests pass"

# Skip non-critical validation
cdev commit --skip-validation=performance_metrics
```

#### Integration Conflicts
```bash
# Preview integration
cdev merge --dry-run PROJ-123

# Use alternative merge strategy
cdev merge --strategy=rebase PROJ-123

# Rollback if needed
cdev rollback PROJ-123
```

### Performance Optimization

#### Limiting Parallel Agents
```bash
# Set maximum concurrent agents
cdev config --max-agents=4

# Prioritize critical agents
cdev run plan.json --priority=backend_agent,api_agent
```

#### Resource Management
```bash
# Monitor resource usage
cdev monitor

# Pause non-critical agents
cdev pause PROJ-123-docs_agent

# Resume when resources available
cdev resume PROJ-123-docs_agent
```

### Debug Mode

Enable comprehensive debugging:

```bash
# Full debug output
export CDEV_DEBUG=true
cdev split PROJ-123

# Debug specific component
CDEV_DEBUG_COMPONENT=semantic_analyzer cdev split PROJ-123

# Save debug logs
cdev split PROJ-123 --debug-output=debug.log
```

## Best Practices

### 1. Issue Structure
- Use numbered lists for clear requirements
- Include acceptance criteria
- Specify technical constraints
- Add complexity hints

### 2. Agent Granularity
- Not too fine (avoid 10+ agents)
- Not too coarse (ensure parallelism)
- Group related changes
- Consider dependencies

### 3. Testing Strategy
- Each agent tests in isolation
- Integration tests in final phase
- Performance tests on merged code
- Rollback plan ready

### 4. Communication
- Use agent workspaces for context
- Document decisions in commits
- Keep Linear issue updated
- Share learnings with team

---

*For more examples and patterns, see our [cookbook](cookbook/) with real-world scenarios.*