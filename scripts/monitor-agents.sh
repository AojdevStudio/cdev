#!/bin/bash
# Monitor parallel agent progress
# Usage: ./monitor-agents.sh

watch -n 2 '
echo "🔍 Parallel Agent Status Monitor"
echo "=============================="
echo ""

if [ -f shared/coordination/spawn-status.json ]; then
    echo "📊 Spawn Status: $(jq -r ".spawning_complete" shared/coordination/spawn-status.json)"
    echo "👥 Total Agents: $(jq -r ".agent_count" shared/coordination/spawn-status.json)"
    echo ""
fi

echo "Agent Progress:"
for status_file in shared/coordination/agent-status/*.json; do
    if [ -f "$status_file" ]; then
        agent=$(basename "$status_file" .json)
        status=$(jq -r ".status" "$status_file" 2>/dev/null || echo "unknown")
        completed=$(jq -r ".completed" "$status_file" 2>/dev/null || echo "false")
        
        if [ "$completed" = "true" ]; then
            echo "   ✅ $agent: Complete"
        else
            echo "   ⏳ $agent: $status"
        fi
    fi
done

echo ""
echo "Press Ctrl+C to exit monitor"
'
