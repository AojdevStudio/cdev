#!/bin/bash
# Parallel Work Validation - Contract Testing & Integration Readiness
# Usage: ./validate-parallel-work.sh

set -e

echo "🔍 Validating parallel agent work..."

# Check if spawn completed
if [ ! -f "shared/coordination/spawn-status.json" ]; then
    echo "❌ No spawn status found. Run spawn-agents.sh first."
    exit 1
fi

SPAWNED_COUNT=$(jq -r '.agent_count' shared/coordination/spawn-status.json)
echo "📊 Validating $SPAWNED_COUNT agent workspaces"

# Check agent completion status
COMPLETED_AGENTS=()
PENDING_AGENTS=()

for status_file in shared/coordination/agent-status/*.json; do
    agent=$(basename "$status_file" .json)
    completed=$(jq -r '.completed' "$status_file")
    
    if [ "$completed" = "true" ]; then
        COMPLETED_AGENTS+=("$agent")
    else
        PENDING_AGENTS+=("$agent")
    fi
done

echo "✅ Completed agents: ${#COMPLETED_AGENTS[@]}"
echo "⏳ Pending agents: ${#PENDING_AGENTS[@]}"

if [ ${#PENDING_AGENTS[@]} -gt 0 ]; then
    echo ""
    echo "❌ Validation cannot proceed. Pending agents:"
    for agent in "${PENDING_AGENTS[@]}"; do
        echo "   - $agent"
    done
    echo ""
    echo "💡 Wait for all agents to complete, then re-run validation."
    exit 1
fi

# Validate each agent's work
echo ""
echo "🧪 Running agent contract validation..."

VALIDATION_PASSED=true

for agent in "${COMPLETED_AGENTS[@]}"; do
    echo "🔬 Validating $agent..."
    
    # Check if test contracts exist and run them
    if [ -f "workspaces/$agent/test_contracts.txt" ]; then
        # Run agent-specific tests
        cd "workspaces/$agent"
        
        # Extract test patterns and run them
        while read -r test_pattern; do
            if [ -n "$test_pattern" ]; then
                echo "   Testing: $test_pattern"
                if ! pnpm test "$test_pattern" --passWithNoTests; then
                    echo "   ❌ Test failed: $test_pattern"
                    VALIDATION_PASSED=false
                fi
            fi
        done < test_contracts.txt
        
        cd ../..
    fi
    
    if [ "$VALIDATION_PASSED" = true ]; then
        echo "   ✅ $agent validation passed"
    fi
done

# Run integration compatibility check
echo ""
echo "🔗 Running integration compatibility check..."

# Check for file conflicts
echo "🔍 Checking for file conflicts..."
declare -A file_agents
CONFLICTS_FOUND=false

for agent in "${COMPLETED_AGENTS[@]}"; do
    if [ -f "workspaces/$agent/files_to_work_on.txt" ]; then
        while read -r file; do
            if [ -n "$file" ]; then
                if [ -n "${file_agents[$file]}" ]; then
                    echo "❌ Conflict: $file modified by both $agent and ${file_agents[$file]}"
                    CONFLICTS_FOUND=true
                else
                    file_agents[$file]=$agent
                fi
            fi
        done < "workspaces/$agent/files_to_work_on.txt"
    fi
done

if [ "$CONFLICTS_FOUND" = false ]; then
    echo "✅ No file conflicts detected"
fi

# Final validation summary
echo ""
if [ "$VALIDATION_PASSED" = true ] && [ "$CONFLICTS_FOUND" = false ]; then
    echo "🎯 Parallel Work Validation: PASSED"
    echo '{"validation_passed": true, "validated_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "agents_validated": ['$(printf '"%s",' "${COMPLETED_AGENTS[@]}" | sed 's/,$//')'], "ready_for_integration": true}' > shared/coordination/validation-status.json
    echo ""
    echo "✅ Ready for integration: ./integrate-parallel-work.sh"
else
    echo "❌ Parallel Work Validation: FAILED"
    echo '{"validation_passed": false, "validated_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "ready_for_integration": false}' > shared/coordination/validation-status.json
    echo ""
    echo "🔧 Fix issues above before proceeding to integration."
    exit 1
fi
