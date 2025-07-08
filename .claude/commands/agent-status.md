# Agent Status Command

Check status of all agent worktrees and their progress.

Discover and analyze all agent workspaces from $ARGUMENTS (base path) to:

1. **Find All Agents**: Scan for agent workspace directories
2. **Check Progress**: Read validation checklists and git status for each
3. **Map Dependencies**: Analyze agent relationships and blockers  
4. **Generate Report**: Show completion status and next actions
5. **Suggest Workflow**: Recommend optimal execution order

## Discovery Commands
```bash
!`git worktree list`
!`find ../project-work-trees -name "workspaces" -type d 2>/dev/null`
```

## Context Analysis
For each agent found:
- @../project-work-trees/*/workspaces/*/agent_context.json
- @../project-work-trees/*/workspaces/*/validation_checklist.txt
- @../project-work-trees/*/workspaces/*/files_to_work_on.txt

## Status Report Format
```
=== Agent Workflow Status ===
Total Agents: X
✅ Completed: X    🔄 In Progress: X    ⏸️ Blocked: X

🤖 backend_api_agent
📋 TASK-123 - Implement user authentication system
🎯 Backend & API (High Priority)
📊 Progress: 8/12 validation criteria (67%)
🔧 Files: 6 created, 3 modified
📍 Branch: TASK-123-backend_api_agent
🔗 Dependencies: database_agent, auth_middleware_agent
```

## Filter Options
- `/agent-status complete` - Show only finished agents
- `/agent-status ready` - Show agents ready to start/commit
- `/agent-status blocked` - Show dependency-blocked agents
- `/agent-status TASK-123` - Filter by specific task ID

Usage: `/agent-status [filter]`
