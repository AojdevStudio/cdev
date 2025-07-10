#!/bin/bash

# Generated Cleanup Script for Parallel Agents  
# Task: AOJ-100 - Enhanced Claude Code Hooks - Global NPX Package Distribution System
# Generated: $(date)

echo "🧹 Starting parallel agent cleanup for AOJ-100..."

# Safety check: verify we're on main branch
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "❌ Must be on main branch for cleanup"
    exit 1
fi

# Verify git is clean (ignoring log files)
if git status --porcelain | grep -v "^[? ]M logs/"; then
    echo "⚠️  Warning: Working directory has uncommitted changes (excluding logs)"
    echo "   Consider committing or stashing changes before cleanup"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📊 Analysis Results:"
echo "   • Task: AOJ-100 (Enhanced Claude Code Hooks - Global NPX Package Distribution System)"
echo "   • Total Agents: 7"
echo "   • Integrated Agents: 4 (cli_agent, docs_agent, validator_agent, installer_agent, distribution_agent)"
echo "   • Remaining Active Worktrees: 4"
echo "   • Active Branches: 7"

# INTEGRATED AGENTS (Ready for cleanup)
echo
echo "🔄 INTEGRATED AGENTS - Ready for cleanup:"
echo "   ✅ cli_agent (merged: 8e9cf12)"
echo "   ✅ docs_agent (merged: 3ba505e)"  
echo "   ✅ validator_agent (merged: 3122f11)"
echo "   ✅ installer_agent (merged: 1bc6555)"
echo "   ✅ distribution_agent (merged: cf011b8)"

# ACTIVE AGENTS (Keep for now)
echo
echo "🚧 ACTIVE AGENTS - Keep worktrees (may still be in development):"
echo "   🔄 config_agent (worktree exists, no merge found)"
echo "   🔄 package_agent (branch exists, no worktree/merge found)"

# Remove integrated worktrees
echo
echo "🗂️ Removing integrated agent worktrees..."

# Check and remove worktrees for integrated agents
for agent in cli_agent docs_agent validator_agent installer_agent; do
    worktree_path="../paralell-development-claude-work-trees/AOJ-100-$agent"
    if [ -d "$worktree_path" ]; then
        echo "   Removing worktree: $worktree_path"
        git worktree remove "$worktree_path" 2>/dev/null || {
            echo "   ⚠️  Failed to remove worktree cleanly, forcing removal..."
            git worktree remove --force "$worktree_path"
        }
    else
        echo "   ℹ️  Worktree already removed: $worktree_path"
    fi
done

# Delete merged branches
echo
echo "🌿 Deleting merged branches..."
for branch in AOJ-100-cli_agent AOJ-100-docs_agent AOJ-100-validator_agent AOJ-100-installer_agent AOJ-100-distribution_agent; do
    if git show-ref --verify --quiet "refs/heads/$branch"; then
        echo "   Deleting branch: $branch"
        git branch -d "$branch" 2>/dev/null || {
            echo "   ⚠️  Branch not fully merged, force deleting..."
            git branch -D "$branch"
        }
    else
        echo "   ℹ️  Branch already deleted: $branch"
    fi
done

# Clean up coordination files for integrated agents
echo
echo "📁 Cleaning up coordination files..."

# Remove deployment plans for completed agents
deployment_plans_dir="shared/deployment-plans"
if [ -d "$deployment_plans_dir" ]; then
    echo "   Cleaning deployment plans..."
    # Keep main deployment plan, remove agent-specific ones
    for plan in cli_agent-deployment-plan.json docs_agent-deployment-plan.json; do
        if [ -f "$deployment_plans_dir/$plan" ]; then
            echo "   Removing: $deployment_plans_dir/$plan"
            rm "$deployment_plans_dir/$plan"
        fi
    done
fi

# Update coordination status (remove completed agents from tracking)
coordination_file="../paralell-development-claude-work-trees/coordination/parallel-agent-status.json"
if [ -f "$coordination_file" ]; then
    echo "   Updating coordination status..."
    # Create backup
    cp "$coordination_file" "$coordination_file.backup"
    
    # Use node to filter out completed agents
    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$coordination_file', 'utf8'));
        const completedAgents = ['cli_agent', 'docs_agent', 'validator_agent', 'installer_agent', 'distribution_agent'];
        data.agents = data.agents.filter(agent => !completedAgents.includes(agent.agentId));
        data.totalAgents = data.agents.length;
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync('$coordination_file', JSON.stringify(data, null, 2));
        console.log('   ✅ Updated coordination status');
    " 2>/dev/null || echo "   ⚠️  Could not update coordination status automatically"
fi

# Archive completion reports
echo
echo "📋 Archiving completion reports..."
reports_dir="shared/reports"
if [ -d "$reports_dir" ]; then
    archive_dir="$reports_dir/archived-$(date +%Y%m%d)"
    mkdir -p "$archive_dir"
    
    # Move old completion reports to archive
    for report in "$reports_dir"/agent-completion-*.md; do
        if [ -f "$report" ]; then
            mv "$report" "$archive_dir/"
            echo "   Archived: $(basename "$report")"
        fi
    done
fi

# Final status
echo
echo "✅ Cleanup complete!"
echo
echo "📊 Remaining Active Development:"
echo "   • config_agent: /Users/ossieirondi/Projects/dev-utils/paralell-development-claude-work-trees/AOJ-100-config_agent"
echo "   • package_agent: AOJ-100-package_agent branch (no worktree found)"
echo
echo "🎯 Next Steps:"
echo "   1. Continue development in remaining agent worktrees"
echo "   2. Run '/agent-status' to check current progress"
echo "   3. Merge remaining agents when complete"
echo "   4. Run cleanup again after final integration"
echo
echo "💾 Backup Info:"
echo "   • Coordination backup: $coordination_file.backup"
echo "   • Archived reports: $archive_dir"

# Verification
echo
echo "🔍 Post-cleanup verification:"
echo "   Active worktrees: $(git worktree list | wc -l)"
echo "   Active AOJ-100 branches: $(git branch | grep -c AOJ-100 || echo 0)"
echo "   Remaining coordination agents: $([ -f "$coordination_file" ] && node -e "console.log(JSON.parse(require('fs').readFileSync('$coordination_file', 'utf8')).agents.length)" 2>/dev/null || echo "unknown")"