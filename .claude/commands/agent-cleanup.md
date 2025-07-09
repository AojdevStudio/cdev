---
allowed-tools: Bash(git worktree:list), Bash(git branch:*), Bash(git log:*), Bash(git status:*), Bash(ls:*), Bash(cat:*), Bash(find:*)
description: Analyze parallel agent integration and generate cleanup plan (read-only analysis)
---

# Parallel Agent Cleanup

You are the **Agent Cleanup Specialist** for the parallel development workflow. Your job is to intelligently clean up after successful parallel agent integration.

## Context

- Current git status: !`git status`
- Current branch: !`git branch --show-current`
- All git worktrees: !`git worktree list`
- All branches: !`git branch -a`
- Recent commits: !`git log --oneline -10`
- Parallel agent coordination status: !`ls -la ../*/coordination/ 2>/dev/null || echo "No coordination directories found"`

## Your Cleanup Tasks

### 1. **Analyze Integration Status**
- Check if parallel agent work has been successfully integrated
- Look for evidence of resolved conflicts or completed merges
- Verify that agent work is now in the main branch

### 2. **Analyze Worktrees for Cleanup**
- Identify all parallel agent worktrees (pattern: `*-work-trees/*-agent`)
- Check if their work has been integrated into main branch
- Generate removal commands for integrated worktrees

### 3. **Analyze Agent Branches for Cleanup**
- Find agent feature branches (pattern: `TASK-ID-*_agent`)
- Verify which branches have been fully merged
- Generate deletion commands for merged branches

### 4. **Analyze Coordination Files**
- Find coordination directories and status files
- Identify deployment plans that are no longer needed
- Generate cleanup commands for obsolete files

### 5. **Generate Cleanup Script**
- Create a shell script with all safe cleanup commands
- Include safety checks and verification steps
- Output the script for user to review and execute

## Analysis Strategy

**Read-Only Analysis**: 
- Only analyze and report - no destructive operations
- Generate cleanup commands for user review
- Provide clear explanations for each recommended action

**Comprehensive Coverage**:
- Check for multiple task IDs (AOJ-100, AOJ-99, etc.)
- Look for both current and legacy agent patterns
- Analyze both local and coordination artifacts

**Safety-First Approach**:
- Only recommend cleanup for definitively integrated work
- Include verification steps in generated script
- Provide rollback instructions

## Output Format

Generate a cleanup script like this:

```bash
#!/bin/bash
# Generated Cleanup Script for Parallel Agents
# Task: AOJ-100
# Generated: $(date)

echo "🧹 Starting parallel agent cleanup..."

# Safety check: verify we're on main branch
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "❌ Must be on main branch for cleanup"
    exit 1
fi

# Remove integrated worktrees
echo "🗂️ Removing integrated worktrees..."
git worktree remove ../paralell-development-claude-work-trees/AOJ-100-backend_api_agent
git worktree remove ../paralell-development-claude-work-trees/AOJ-100-custom_feature_agent

# Delete merged branches  
echo "🌿 Deleting merged branches..."
git branch -d AOJ-100-backend_api_agent
git branch -d AOJ-100-custom_feature_agent

# Clean up coordination files
echo "📁 Cleaning coordination files..."
rm -rf ../paralell-development-claude-work-trees/coordination

echo "✅ Cleanup complete!"
```

**Your task: Analyze the current state and generate a cleanup script. Do NOT execute any cleanup commands - only analyze and generate the script.**