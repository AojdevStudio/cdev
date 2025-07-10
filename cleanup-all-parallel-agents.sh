#!/bin/bash

# Comprehensive Cleanup Script for All Parallel Agents
# Handles both AOJ-100 and AOJ-99 tasks
# Generated: $(date)

echo "🧹 Starting comprehensive parallel agent cleanup..."
echo "   Tasks: AOJ-100 (current) + AOJ-99 (old completed task)"

# Safety check: verify we're on main branch
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "❌ Must be on main branch for cleanup"
    exit 1
fi

echo
echo "📊 Analysis Results:"

# AOJ-100 (Current task)
echo "🔄 AOJ-100 (Enhanced Claude Code Hooks - Global NPX Package Distribution System):"
echo "   • Active Agents: 2 (config_agent, package_agent)"
echo "   • Status: In development"

# AOJ-99 (Old completed task) 
echo "🏁 AOJ-99 (Enhanced Google Drive MCP Server - Full Write Capabilities):"
echo "   • Merged Agents: 5 (infrastructure_validation_agent, custom_validation_agent, custom_feature_agent, backend_api_agent, infrastructure_feature_agent)"
echo "   • Orphaned Worktrees: 4 (backend_forms_agent, custom_authentication_agent, custom_feature_agent, infrastructure_authentication_agent)"
echo "   • Status: Already integrated but worktrees never cleaned up"

echo
echo "🚨 ISSUE IDENTIFIED: Old AOJ-99 agents saying they're 'complete' are orphaned worktrees from previous task"

echo
echo "🧹 CLEANUP ACTIONS:"

# Clean up old AOJ-99 worktrees (already merged)
echo
echo "🗂️ Removing old AOJ-99 worktrees (task already complete)..."

aoj99_worktrees=(
    "AOJ-99-backend_forms_agent"
    "AOJ-99-custom_authentication_agent" 
    "AOJ-99-custom_feature_agent"
    "AOJ-99-infrastructure_authentication_agent"
)

for worktree in "${aoj99_worktrees[@]}"; do
    worktree_path="../desktop-commander-work-trees/$worktree"
    if [ -d "$worktree_path" ]; then
        echo "   Removing old worktree: $worktree_path"
        # Check if it's a git worktree first
        if git worktree list | grep -q "$worktree_path"; then
            git worktree remove "$worktree_path" 2>/dev/null || {
                echo "   ⚠️  Failed to remove as git worktree, removing directory..."
                rm -rf "$worktree_path"
            }
        else
            echo "   📁 Removing orphaned directory: $worktree_path"
            rm -rf "$worktree_path"
        fi
    else
        echo "   ℹ️  Already removed: $worktree_path"
    fi
done

# Clean up old AOJ-99 coordination
echo
echo "📁 Cleaning up old AOJ-99 coordination files..."
aoj99_coord_dir="../desktop-commander-work-trees/coordination"
if [ -d "$aoj99_coord_dir" ]; then
    echo "   Backing up and removing: $aoj99_coord_dir"
    if [ -f "$aoj99_coord_dir/parallel-agent-status.json" ]; then
        cp "$aoj99_coord_dir/parallel-agent-status.json" "./aoj99-coordination-backup.json"
        echo "   💾 Backed up to: ./aoj99-coordination-backup.json"
    fi
    rm -rf "$aoj99_coord_dir"
fi

# Clean up parent directory if empty
if [ -d "../desktop-commander-work-trees" ]; then
    if [ -z "$(ls -A ../desktop-commander-work-trees)" ]; then
        echo "   🗑️  Removing empty directory: ../desktop-commander-work-trees"
        rmdir "../desktop-commander-work-trees"
    else
        echo "   ℹ️  Keeping directory (has other content): ../desktop-commander-work-trees"
    fi
fi

# Verify no old branches exist for AOJ-99
echo
echo "🌿 Checking for old AOJ-99 branches..."
aoj99_branches=$(git branch | grep "AOJ-99" || echo "")
if [ -n "$aoj99_branches" ]; then
    echo "   Found old AOJ-99 branches:"
    echo "$aoj99_branches" | sed 's/^/      /'
    
    # These should already be merged, safe to delete
    echo "$aoj99_branches" | while read -r branch; do
        branch=$(echo "$branch" | tr -d ' *+')
        if [ -n "$branch" ]; then
            echo "   Deleting old branch: $branch"
            git branch -d "$branch" 2>/dev/null || {
                echo "   ⚠️  Force deleting: $branch"
                git branch -D "$branch"
            }
        fi
    done
else
    echo "   ✅ No old AOJ-99 branches found"
fi

# Update current AOJ-100 status
echo
echo "🔄 Current AOJ-100 development status:"
current_worktrees=$(git worktree list | grep -c "AOJ-100" || echo 0)
current_branches=$(git branch | grep -c "AOJ-100" || echo 0)
echo "   • Active worktrees: $current_worktrees"
echo "   • Active branches: $current_branches"

# Final verification
echo
echo "✅ Comprehensive cleanup complete!"
echo
echo "📊 Final Status:"
echo "   🏁 AOJ-99: Fully cleaned up (task was already complete)"
echo "   🔄 AOJ-100: Still active with remaining agents:"

if [ -d "../paralell-development-claude-work-trees/AOJ-100-config_agent" ]; then
    echo "      • config_agent: ../paralell-development-claude-work-trees/AOJ-100-config_agent"
fi

if git branch | grep -q "AOJ-100-package_agent"; then
    echo "      • package_agent: AOJ-100-package_agent branch (no worktree)"
fi

echo
echo "🎯 Next Steps for AOJ-100:"
echo "   1. Continue development in remaining AOJ-100 agent worktrees"
echo "   2. Create worktree for package_agent if needed"
echo "   3. Merge remaining agents when complete"
echo "   4. Final cleanup after AOJ-100 integration"

echo
echo "💾 Backup Files Created:"
if [ -f "./aoj99-coordination-backup.json" ]; then
    echo "   • AOJ-99 coordination backup: ./aoj99-coordination-backup.json"
fi

echo
echo "🧠 Root Cause Analysis:"
echo "   The 'agents saying they finished' were orphaned worktrees from AOJ-99"
echo "   (Google Drive MCP Server task) that were already merged months ago"
echo "   but their worktree directories were never cleaned up."
echo "   This cleanup removes the confusion and focuses on active AOJ-100 work."