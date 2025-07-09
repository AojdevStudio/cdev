#!/bin/bash
# Intelligent Conflict Resolution for Parallel Agents
# Usage: ./resolve-conflicts.sh

set -e

echo "🔧 Parallel Agent Conflict Resolution"

# Get current project folder name
PROJECT_NAME=$(basename "$(pwd)")
WORKTREES_DIR="../${PROJECT_NAME}-work-trees"
COORDINATION_DIR="$WORKTREES_DIR/coordination"

# Check if validation failed due to conflicts
if [ ! -f "$COORDINATION_DIR/validation-status.json" ]; then
    echo "❌ No validation status found. Run validate-parallel-work.sh first."
    exit 1
fi

VALIDATION_PASSED=$(jq -r '.validation_passed' "$COORDINATION_DIR/validation-status.json")
if [ "$VALIDATION_PASSED" = "true" ]; then
    echo "✅ No conflicts detected. Validation already passed."
    exit 0
fi

echo "🔍 Analyzing conflicts..."

# Strategy 1: Merge Priority-Based Resolution
echo ""
echo "📋 Conflict Resolution Strategies:"
echo "1. 🎯 Merge by Priority (Infrastructure → Backend → Frontend)"
echo "2. 🤝 Interactive Resolution (Manual merge each conflict)"
echo "3. 🔄 Agent Handoff (Let agents resolve their own conflicts)"
echo "4. 📦 Staged Integration (Merge one agent at a time)"
echo ""

read -p "Choose strategy (1-4): " STRATEGY

case $STRATEGY in
    1)
        echo "🎯 Using priority-based merge..."
        # Define merge order: Infrastructure first, then backend, then frontend
        MERGE_ORDER="infrastructure_feature_agent infrastructure_validation_agent backend_api_agent custom_feature_agent custom_validation_agent"
        
        for agent in $MERGE_ORDER; do
            if git worktree list | grep -q "AOJ-100-$agent"; then
                echo "🔄 Merging $agent..."
                git merge "AOJ-100-$agent" --strategy-option=theirs || {
                    echo "❌ Merge conflict in $agent. Resolve manually:"
                    echo "   git status"
                    echo "   git add ."
                    echo "   git commit"
                    echo "   Then re-run this script"
                    exit 1
                }
            fi
        done
        ;;
        
    2)
        echo "🤝 Interactive resolution..."
        # Merge each agent and let user resolve conflicts
        for agent_branch in $(git worktree list | grep AOJ-100 | cut -d' ' -f3 | cut -d'[' -f2 | cut -d']' -f1); do
            echo "🔄 Merging $agent_branch..."
            git merge "$agent_branch" || {
                echo "❌ Conflicts in $agent_branch. Resolve now:"
                echo "   - Edit conflicted files"
                echo "   - git add ."
                echo "   - git commit"
                read -p "Press Enter when resolved..."
            }
        done
        ;;
        
    3)
        echo "🔄 Agent handoff resolution..."
        # Create a coordination issue for agents to resolve
        cat > "$COORDINATION_DIR/conflict-resolution-task.md" << EOF
# Conflict Resolution Task

## Conflicts Detected:
- components/forms/DynamicForm.tsx: custom_validation_agent vs custom_feature_agent
- lib/form-validation.ts: custom_validation_agent vs custom_feature_agent
- hooks/useFormState.ts: custom_validation_agent vs custom_feature_agent

## Resolution Strategy:
1. custom_feature_agent: Focus on UI components only
2. custom_validation_agent: Focus on validation logic only
3. Create clear interfaces between components

## Next Steps:
1. Agents coordinate on shared interfaces
2. Split conflicting files into separate concerns
3. Re-run validation after changes
EOF
        
        echo "📝 Created conflict resolution task: $COORDINATION_DIR/conflict-resolution-task.md"
        echo "🤖 Coordinate with agents to resolve conflicts, then re-run validation"
        ;;
        
    4)
        echo "📦 Staged integration..."
        # Merge one agent at a time, running tests after each
        for agent_branch in $(git worktree list | grep AOJ-100 | cut -d' ' -f3 | cut -d'[' -f2 | cut -d']' -f1); do
            echo "🔄 Staging $agent_branch..."
            
            # Create a temporary branch for this merge
            git checkout -b "staging-$agent_branch"
            git merge "$agent_branch" || {
                echo "❌ Conflicts in $agent_branch. Resolve and commit:"
                read -p "Press Enter when resolved..."
            }
            
            # Run tests
            if command -v pnpm &> /dev/null; then
                pnpm test || {
                    echo "❌ Tests failed after merging $agent_branch"
                    echo "Fix tests and commit, then press Enter"
                    read -p "Press Enter when fixed..."
                }
            fi
            
            # Merge back to main
            git checkout main
            git merge "staging-$agent_branch"
            git branch -d "staging-$agent_branch"
            
            echo "✅ $agent_branch integrated successfully"
        done
        ;;
        
    *)
        echo "❌ Invalid strategy selected"
        exit 1
        ;;
esac

echo ""
echo "🎯 Conflict resolution complete!"
echo "🔄 Re-running validation..."
./scripts/validate-parallel-work.sh