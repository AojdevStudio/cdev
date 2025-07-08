# Parallel Claude Development Workflow

This workspace manages parallel agent development using Git worktrees and Claude Code.

## Workflow Overview

Transform Linear issues into parallel agents working simultaneously:
1. Cache Linear issue → 2. Decompose into agents → 3. Spawn worktrees → 4. Work in parallel → 5. Merge back

## Context Files

Import workflow documentation:
- @README.md - Complete workflow documentation
- @scripts/ - Core workflow scripts

## Custom Slash Commands

### /agent-start [workspace-path]

Load agent workspace context and begin working on assigned tasks.

**Usage**: Navigate to an agent worktree and run this to start working
- Loads agent_context.json to understand role and tasks
- Reads validation_checklist.txt as to-do list
- Works through files_to_work_on.txt systematically
- Updates checklist progress in real-time

### /agent-commit [workspace-path] [custom-message]

Commit completed agent work and merge back to main branch.

**Usage**: When agent work is complete, commit and merge
- Validates all checklist items are completed
- Auto-generates commit message from agent context
- Performs full git workflow: add → commit → merge → push
- Cleans up worktree after successful merge

### /agent-status [filter]

Check status of all agent worktrees and their progress.

**Usage**: Monitor overall parallel workflow progress
- Discovers all agent worktrees automatically
- Shows completion percentages and dependencies
- Identifies ready-to-start and ready-to-commit agents  
- Provides actionable next steps

## Parallel Agent Workflow

### 1. Cache Linear Issue
```bash
./scripts/cache-linear-issue.sh TASK-123
```

### 2. Decompose into Agents
```bash
node scripts/decompose-parallel.cjs TASK-123
```

### 3. Spawn All Agents
```bash
./scripts/spawn-agents.sh shared/deployment-plans/task-123-deployment-plan.json
```

### 4. Work in Each Agent (Cursor auto-opens)
```bash
# In each agent worktree:
claude
/agent-start
# Work through validation checklist
```

### 5. Commit and Merge
```bash
/agent-status ready
/agent-commit
```

## Git Worktree Benefits

- **Complete Isolation**: Each agent works in separate directory
- **Parallel Execution**: Multiple Claude instances run simultaneously  
- **No Conflicts**: Independent file copies prevent merge issues
- **Clean Integration**: Dependency-aware merge process

## Agent Context Structure

Each agent gets:
- `agent_context.json` - Task details and role definition
- `files_to_work_on.txt` - CREATE/MODIFY file instructions
- `validation_checklist.txt` - Success criteria checklist
- `test_contracts.txt` - Required test implementations

Agents dynamically adapt their behavior based on context rather than hard-coded assumptions.

Example agent context:
```json
{
  "agentId": "backend_api_agent",
  "taskId": "TASK-123", 
  "taskTitle": "Implement user authentication system",
  "agentRole": "Backend & API: Authentication system implementation",
  "focusArea": "Backend & API",
  "branchName": "TASK-123-backend_api_agent",
  "canStartImmediately": true,
  "allFilesToCreate": [
    "lib/auth/auth-service.ts",
    "lib/auth/jwt-utils.ts", 
    "middleware/auth-middleware.ts"
  ],
  "allFilesToModify": [
    "app.ts"
  ],
  "allValidationCriteria": [
    "User registration works correctly",
    "Login authentication validates properly",
    "JWT tokens are generated and verified",
    "Password hashing is secure"
  ],
  "estimatedTime": 35
}
```

## Integration Commands

Check status across all agents:
```bash
/agent-status
/agent-status complete
/agent-status ready
```

Commit when ready:
```bash
/agent-commit
```

This workflow enables 2-4x faster development through intelligent parallelization.
