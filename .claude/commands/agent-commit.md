---
allowed-tools: Read, Bash, Write, Edit, MultiEdit
description: Commit and merge completed agent work with validation checks
---

# Agent Commit

This command commits completed agent work and merges the worktree back to main branch with comprehensive validation and safety checks.

**variables:**
WorkspacePath: $ARGUMENTS

**Usage Examples:**
- `/agent-commit workspaces/AOJ-100-backend_api_agent` - Standard commit with auto-generated message
- `/agent-commit workspaces/AOJ-100-backend_api_agent "feat: custom integration"` - Custom commit message
- `/agent-commit workspaces/AOJ-100-frontend_agent --dry-run` - Validate only, no commit

## Instructions
- Parse $ARGUMENTS to extract workspace path and optional custom message
- Verify workspace is a valid git worktree and extract branch information
- Validate all checklist items are completed by checking validation_checklist.txt
- Extract agent context from agent_context.json for commit metadata
- Perform safety checks on main branch (stash changes, pull latest)
- Generate structured commit message or use custom message if provided
- Stage and commit all changes in the agent worktree
- Merge agent branch to main with --no-ff for clear history
- Update coordination status file to mark agent as completed
- Clean up by removing worktree and deleting merged branch

## Context
- Current directory: !`pwd`
- Git worktrees: !`git worktree list`
- Main branch status: !`git status --porcelain`
- Worktree patterns: @ai-docs/mastering-git-worktrees.md
- Coordination directory: ../paralell-development-claude-work-trees/coordination/
- Agent context file: agent_context.json (contains agentId, taskId, agentRole)
- Validation checklist: validation_checklist.txt (tracks completion criteria)
- Commit format: feat(agentId): taskTitle with statistics and metadata
- Safety requirements: Main branch must be clean, all validation complete
- No automatic push: Local merge only, user pushes manually
- Cleanup patterns: Remove worktree after merge, delete branch if merged
- Merge strategy: Use --no-ff to preserve agent history in commit graph