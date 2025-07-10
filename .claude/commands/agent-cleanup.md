---
allowed-tools: Bash(git worktree:list), Bash(git branch:*), Bash(git log:*), Bash(git status:*), Bash(ls:*), Bash(cat:*), Bash(find:*)
description: Analyze parallel agent integration and generate cleanup plan (read-only analysis)
---

# Parallel Agent Cleanup

This command analyzes completed parallel agent workflows and generates a cleanup script to remove integrated worktrees, branches, and coordination files safely.

**variables:**
TaskIdFilter: $ARGUMENTS

**Usage Examples:**
- `/agent-cleanup` - Analyze all parallel agent work and generate cleanup script
- `/agent-cleanup AOJ-100` - Focus cleanup analysis on specific task ID
- `/agent-cleanup --dry-run` - Show what would be cleaned without generating script

## Instructions
- Analyze git worktrees to identify completed parallel agent work
- Check merge status of all agent branches against main branch
- Identify coordination files and deployment plans that are obsolete
- Generate comprehensive cleanup script with safety checks
- Provide clear explanations for each recommended cleanup action

## Context
- Current git status: !`git status`
- Current branch: !`git branch --show-current`
- All git worktrees: !`git worktree list`
- All branches: !`git branch -a`
- Recent commits: !`git log --oneline -10`
- Parallel agent coordination: !`ls -la ../*/coordination/ 2>/dev/null || echo "No coordination directories found"`
- Agent worktree patterns: *-work-trees/*-agent
- Agent branch patterns: TASK-ID-*_agent
- Task ID formats: AOJ-100, AOJ-99, PROJ-123, etc.
- Safety requirement: Read-only analysis, generate script only
- Cleanup targets: worktrees, branches, coordination files, deployment plans