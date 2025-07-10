#!/bin/bash
# Monitor parallel agent progress
# Usage: ./monitor-agents.sh

# Get current project folder name
PROJECT_NAME=$(basename "$(pwd)")
WORKTREES_DIR="../${PROJECT_NAME}-work-trees"
COORDINATION_DIR="$WORKTREES_DIR/coordination"

watch -n 2 '
PROJECT_NAME=$(basename "$(pwd)")
WORKTREES_DIR="../${PROJECT_NAME}-work-trees"
COORDINATION_DIR="$WORKTREES_DIR/coordination"

echo "🔍 Parallel Agent Status Monitor"
echo "=============================="
echo ""

# Check if work-trees directory exists
if [ ! -d "$WORKTREES_DIR" ]; then
    echo "❌ No active agents found."
    echo "   Run '\''cdev run <deployment-plan.json>'\'' to spawn agents first."
    echo ""
    echo "Press Ctrl+C to exit"
    exit 0
fi

# Show overall status from parallel-agent-status.json
if [ -f "$COORDINATION_DIR/parallel-agent-status.json" ]; then
    echo "📊 Task: $(jq -r ".taskId" "$COORDINATION_DIR/parallel-agent-status.json" 2>/dev/null || echo "unknown")"
    echo "👥 Total Agents: $(jq -r ".agents | length" "$COORDINATION_DIR/parallel-agent-status.json" 2>/dev/null || echo "0")"
    echo ""
    
    echo "Agent Worktrees:"
    # List all agent worktrees
    for agent_dir in "$WORKTREES_DIR"/*; do
        if [ -d "$agent_dir" ] && [[ "$(basename "$agent_dir")" == *"-agent" ]]; then
            agent_name=$(basename "$agent_dir")
            # Check if agent has a validation checklist to determine progress
            if [ -f "$agent_dir/validation_checklist.txt" ]; then
                total_items=$(grep -c "^\[ \]" "$agent_dir/validation_checklist.txt" 2>/dev/null || echo "0")
                completed_items=$(grep -c "^\[x\]" "$agent_dir/validation_checklist.txt" 2>/dev/null || echo "0")
                if [ "$total_items" -gt 0 ]; then
                    progress=$((completed_items * 100 / total_items))
                    if [ "$progress" -eq 100 ]; then
                        echo "   ✅ $agent_name: Complete (${completed_items}/${total_items} tasks)"
                    else
                        echo "   ⏳ $agent_name: ${progress}% (${completed_items}/${total_items} tasks)"
                    fi
                else
                    echo "   📦 $agent_name: Ready to start"
                fi
            else
                echo "   📦 $agent_name: Spawned"
            fi
        fi
    done
else
    echo "⚠️  No coordination status file found."
    echo "   Expected at: $COORDINATION_DIR/parallel-agent-status.json"
fi

echo ""
echo "Press Ctrl+C to exit monitor"
'
