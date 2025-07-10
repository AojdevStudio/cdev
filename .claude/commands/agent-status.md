---
allowed-tools: Read, Bash, Grep, Task
description: Check status of all agent worktrees and their progress
---

# Agent Status

This command discovers and analyzes all agent workspaces to provide comprehensive status reporting, progress tracking, and workflow recommendations.

**variables:**
FilterOption: $ARGUMENTS

**Usage Examples:**
- `/agent-status` - Show status of all agents
- `/agent-status complete` - Show only finished agents
- `/agent-status ready` - Show agents ready to start or commit
- `/agent-status blocked` - Show dependency-blocked agents
- `/agent-status TASK-123` - Filter by specific task ID

## Instructions
- Parse $ARGUMENTS to extract filter option (complete, ready, blocked, or task ID)
- Discover all agent workspaces using git worktree list and file system scan
- For each agent found, read agent_context.json for metadata
- Analyze validation_checklist.txt to calculate completion percentage
- Check git status to determine if changes exist
- Map agent dependencies from context files
- Apply requested filter to agent list
- Generate comprehensive status report with progress indicators
- Provide actionable recommendations for next steps

## Context
- Git worktrees: !`git worktree list`
- Agent workspaces: !`find .. -name "*-agent" -type d 2>/dev/null | grep -E "work-trees|workspaces" | head -20`
- Coordination status: !`cat ../paralell-development-claude-work-trees/coordination/parallel-agent-status.json 2>/dev/null || echo "{}"`
- Current directory: !`pwd`
- Agent patterns: *-work-trees/*-agent, workspaces/*-agent
- Context files: agent_context.json (metadata), validation_checklist.txt (progress)
- Progress calculation: Count [x] vs [ ] in validation checklist
- Status categories: Complete (100%), In Progress (1-99%), Blocked (0% with deps)
- Filter keywords: complete, ready, blocked, or task ID pattern