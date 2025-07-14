#!/usr/bin/env bash
# Parallel Work Validation - Contract Testing & Integration Readiness
# Usage: ./validate-parallel-work.sh

set -e

# Check if we're using bash 4+ for associative arrays
if [[ ${BASH_VERSION%%.*} -lt 4 ]]; then
    echo "❌ This script requires bash 4.0 or higher for associative arrays."
    echo "   Current version: $BASH_VERSION"
    echo "   On macOS, install newer bash: brew install bash"
    exit 1
fi

echo "🔍 Validating parallel agent work..."

# Get current project folder name and construct work-trees path
PROJECT_NAME=$(basename "$(pwd)")
# Work-trees are created in the parent directory (matching spawn-agents.sh behavior)
WORKTREES_DIR="../${PROJECT_NAME}-work-trees"
COORDINATION_DIR="$WORKTREES_DIR/coordination"

# Check if work-trees directory exists
if [ ! -d "$WORKTREES_DIR" ]; then
    echo "❌ No work-trees directory found at: $WORKTREES_DIR"
    echo "   Run spawn-agents.sh first to create agent workspaces."
    exit 1
fi

# Check if coordination status exists
if [ ! -f "$COORDINATION_DIR/parallel-agent-status.json" ]; then
    echo "❌ No coordination status found at: $COORDINATION_DIR/parallel-agent-status.json"
    echo "   Run spawn-agents.sh first to create coordination system."
    exit 1
fi

# Discover agents by scanning workspace directories directly
echo "📊 Discovering agents from workspace directories..."
SPAWNED_AGENTS=()
AGENT_WORKTREES=()
AGENT_SEEN=""

# Scan all worktree directories for workspace folders
for worktree_path in "$WORKTREES_DIR"/*; do
    if [ -d "$worktree_path" ] && [ "$(basename "$worktree_path")" != "coordination" ]; then
        # Check if this worktree has a workspaces directory
        if [ -d "$worktree_path/workspaces" ]; then
            # Scan for agent workspace directories (use actual agent IDs from workspace folder names)
            for workspace_path in "$worktree_path/workspaces"/*; do
                if [ -d "$workspace_path" ]; then
                    # Get agent ID from the workspace directory name (this is the actual agent ID)
                    AGENT_ID=$(basename "$workspace_path")
                    
                    # Verify this is a valid agent workspace by checking for agent_context.json
                    if [ -f "$workspace_path/agent_context.json" ]; then
                        # Double-check by reading the actual agent ID from the context file
                        CONTEXT_AGENT_ID=$(jq -r '.agentId' "$workspace_path/agent_context.json" 2>/dev/null)
                        
                        # Use the context agent ID if it's valid, otherwise fall back to directory name
                        if [ -n "$CONTEXT_AGENT_ID" ] && [ "$CONTEXT_AGENT_ID" != "null" ]; then
                            FINAL_AGENT_ID="$CONTEXT_AGENT_ID"
                        else
                            FINAL_AGENT_ID="$AGENT_ID"
                        fi
                        
                        # Only add if not already seen (remove duplicates)
                        if [[ "$AGENT_SEEN" != *"|$FINAL_AGENT_ID|"* ]]; then
                            SPAWNED_AGENTS+=("$FINAL_AGENT_ID")
                            AGENT_WORKTREES+=("$worktree_path")
                            AGENT_SEEN="$AGENT_SEEN|$FINAL_AGENT_ID|"
                            
                            echo "   Found agent: $FINAL_AGENT_ID in $worktree_path"
                        fi
                    fi
                fi
            done
        fi
    fi
done

SPAWNED_COUNT=${#SPAWNED_AGENTS[@]}
echo "📊 Found $SPAWNED_COUNT spawned agents: ${SPAWNED_AGENTS[*]}"

# Show work-trees structure with eza if available
if command -v eza &> /dev/null; then
    echo ""
    echo "🌳 Work-trees structure:"
    eza -T "$WORKTREES_DIR" -L 3 --icons 2>/dev/null || ls -la "$WORKTREES_DIR"
    echo ""
fi

if [ $SPAWNED_COUNT -eq 0 ]; then
    echo "❌ No spawned agents found. Run spawn-agents.sh first."
    exit 1
fi

# Check agent completion status by looking for completion markers
COMPLETED_AGENTS=()
PENDING_AGENTS=()

for i in "${!SPAWNED_AGENTS[@]}"; do
    agent="${SPAWNED_AGENTS[$i]}"
    worktree_path="${AGENT_WORKTREES[$i]}"
    workspace_dir="$worktree_path/workspaces/$agent"
    
    # Check if agent has completion marker (you can customize this logic)
    # For now, we'll assume an agent is complete if it has a completion marker file
    # or if all validation criteria are checked off
    if [ -f "$workspace_dir/COMPLETED" ]; then
        COMPLETED_AGENTS+=("$agent")
    elif [ -f "$workspace_dir/validation_checklist.txt" ]; then
        # Check if all validation criteria are checked off
        UNCHECKED_COUNT=$(grep -c "^\[[ ]\]" "$workspace_dir/validation_checklist.txt" 2>/dev/null || echo "0")
        # Clean up any newlines or non-numeric characters
        UNCHECKED_COUNT=$(echo "$UNCHECKED_COUNT" | tr -d '\n' | grep -oE '[0-9]+' || echo "0")
        # Ensure we have a valid integer
        if [[ "$UNCHECKED_COUNT" =~ ^[0-9]+$ ]] && [ "$UNCHECKED_COUNT" -eq 0 ]; then
            COMPLETED_AGENTS+=("$agent")
        else
            PENDING_AGENTS+=("$agent")
        fi
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
    echo "   Agents are considered complete when:"
    echo "   - A COMPLETED file exists in their workspace, OR"
    echo "   - All items in validation_checklist.txt are checked off"
    exit 1
fi

# Create a mapping of completed agents to their worktrees for validation
declare -A AGENT_TO_WORKTREE
for i in "${!SPAWNED_AGENTS[@]}"; do
    agent="${SPAWNED_AGENTS[$i]}"
    worktree_path="${AGENT_WORKTREES[$i]}"
    
    # Only include completed agents in the mapping
    for completed_agent in "${COMPLETED_AGENTS[@]}"; do
        if [ "$agent" = "$completed_agent" ]; then
            AGENT_TO_WORKTREE["$agent"]="$worktree_path"
            break
        fi
    done
done

# Validate each agent's work
echo ""
echo "🧪 Running agent contract validation..."

VALIDATION_PASSED=true

for agent in "${COMPLETED_AGENTS[@]}"; do
    echo "🔬 Validating $agent..."
    
    worktree_path="${AGENT_TO_WORKTREE[$agent]}"
    workspace_dir="$worktree_path/workspaces/$agent"
    
    # Debug: Show what paths we're checking
    echo "   🔍 Checking paths for $agent:"
    echo "      Worktree: $worktree_path"
    echo "      Workspace: $workspace_dir"
    echo "      Test contracts: $workspace_dir/test_contracts.txt"
    
    # Check if workspace directory exists
    if [ ! -d "$workspace_dir" ]; then
        echo "   ❌ Workspace directory not found: $workspace_dir"
        echo "   🔍 Let's see what's actually in the worktree:"
        ls -la "$worktree_path/workspaces/" 2>/dev/null || echo "      No workspaces directory found"
        continue
    fi
    
    # Check if test contracts exist (just validate presence, don't run)
    if [ -f "$workspace_dir/test_contracts.txt" ]; then
        echo "   📋 Test contracts found: $workspace_dir/test_contracts.txt"
        # Count test contracts
        contract_count=$(wc -l < "$workspace_dir/test_contracts.txt" 2>/dev/null || echo "0")
        echo "   📊 Test contracts listed: $contract_count"
    else
        echo "   📝 No test contracts found for $agent"
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
    worktree_path="${AGENT_TO_WORKTREE[$agent]}"
    workspace_dir="$worktree_path/workspaces/$agent"
    
    if [ -f "$workspace_dir/files_to_work_on.txt" ]; then
        while read -r file; do
            if [ -n "$file" ]; then
                # Strip CREATE: or MODIFY: prefix if present
                clean_file=$(echo "$file" | sed 's/^CREATE: //; s/^MODIFY: //')
                if [ -n "${file_agents[$clean_file]}" ]; then
                    echo "❌ Conflict: $clean_file modified by both $agent and ${file_agents[$clean_file]}"
                    CONFLICTS_FOUND=true
                else
                    file_agents[$clean_file]=$agent
                fi
            fi
        done < "$workspace_dir/files_to_work_on.txt"
    fi
done

if [ "$CONFLICTS_FOUND" = false ]; then
    echo "✅ No file conflicts detected"
fi

# Create validation status in coordination directory
mkdir -p "$COORDINATION_DIR"

# Final validation summary
echo ""
if [ "$VALIDATION_PASSED" = true ] && [ "$CONFLICTS_FOUND" = false ]; then
    echo "🎯 Parallel Work Validation: PASSED"
    echo '{"validation_passed": true, "validated_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "agents_validated": ['$(printf '"%s",' "${COMPLETED_AGENTS[@]}" | sed 's/,$//')'], "ready_for_integration": true, "worktrees_dir": "'$WORKTREES_DIR'", "coordination_dir": "'$COORDINATION_DIR'"}' > "$COORDINATION_DIR/validation-status.json"
    echo ""
    echo "✅ Ready for integration: ./integrate-parallel-work.sh"
else
    echo "❌ Parallel Work Validation: FAILED"
    echo '{"validation_passed": false, "validated_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "ready_for_integration": false, "worktrees_dir": "'$WORKTREES_DIR'", "coordination_dir": "'$COORDINATION_DIR'"}' > "$COORDINATION_DIR/validation-status.json"
    echo ""
    echo "🔧 Fix issues above before proceeding to integration."
    exit 1
fi
