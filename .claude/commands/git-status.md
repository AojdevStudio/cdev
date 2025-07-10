---
allowed-tools: Bash(git:*), Read
description: Understand the current state of the git repository
---

# Git Status

This command provides a comprehensive summary of the current git repository state including status, branch information, and differences from remote.

**Usage Examples:**
- `/git-status` - Show current repository state and summary

## Instructions
- Run git status to check working directory state
- Get current branch name and upstream tracking information
- Check differences between local and remote branches
- Read key project files like README.md for context
- Summarize findings in a clear, actionable format
- Highlight any uncommitted changes or divergence from remote

## Context
- Current status: !`git status`
- Current branch: !`git branch --show-current`
- Remote tracking: !`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "No upstream branch"`
- Local vs remote: !`git rev-list --left-right --count HEAD...@{u} 2>/dev/null || echo "0 0"`
- Recent commits: !`git log --oneline -5`
- Project overview: @README.md
- Repository state indicators: clean, changes staged, changes unstaged, untracked files
- Branch divergence: commits ahead/behind remote
- Summary focus: actionable status information