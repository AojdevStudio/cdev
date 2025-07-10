#!/bin/bash
# Enhanced Parallel Agent Spawning System
# Usage: ./spawn-agents.sh <deployment-plan.json>
# Creates multiple isolated Git worktrees with proper environment for parallel Claude development

set -e

DEPLOYMENT_PLAN="$1"
if [ -z "$DEPLOYMENT_PLAN" ]; then
    echo "❌ Usage: ./spawn-agents.sh <deployment-plan.json>"
    echo "   Example: ./spawn-agents.sh shared/deployment-plans/aoj-99-deployment-plan.json"
    exit 1
fi

if [ ! -f "$DEPLOYMENT_PLAN" ]; then
    echo "❌ Deployment plan not found: $DEPLOYMENT_PLAN"
    exit 1
fi

echo "🚀 Enhanced Parallel Agent Spawning System"
echo "📋 Reading deployment plan: $DEPLOYMENT_PLAN"

# Extract task information
TASK_ID=$(node -e "const plan = require('./$DEPLOYMENT_PLAN'); console.log(plan.taskId);")
TASK_TITLE=$(node -e "const plan = require('./$DEPLOYMENT_PLAN'); console.log(plan.taskTitle);")

echo "🎯 Task: $TASK_ID - $TASK_TITLE"

# Get list of unique agents (remove duplicates)
AGENTS=$(node -e "
const plan = require('./$DEPLOYMENT_PLAN');
const uniqueAgents = [...new Set(plan.parallelAgents.map(agent => agent.agentId))];
console.log(uniqueAgents.join(' '));
")

# Count total agents
AGENT_COUNT=$(echo $AGENTS | wc -w | tr -d ' ')
echo "🤖 Found $AGENT_COUNT unique agents to spawn: $AGENTS"

# Get current project folder name
PROJECT_NAME=$(basename "$(pwd)")
echo "📁 Project: $PROJECT_NAME"

# Create adjacent work-trees directory if it doesn't exist
WORKTREES_DIR="../${PROJECT_NAME}-work-trees"
if [ ! -d "$WORKTREES_DIR" ]; then
    echo "📂 Creating work-trees directory: $WORKTREES_DIR"
    mkdir -p "$WORKTREES_DIR"
fi

# Create coordination directory
COORDINATION_DIR="$WORKTREES_DIR/coordination"
mkdir -p "$COORDINATION_DIR"

echo ""
echo "🌿 Creating Git worktrees for each agent..."
echo ""

# Create worktree for each unique agent
for AGENT_ID in $AGENTS; do
    echo "🔄 Processing agent: $AGENT_ID"
    
    # Create branch name with task prefix
    BRANCH_NAME="${TASK_ID}-${AGENT_ID}"
    WORKTREE_PATH="$WORKTREES_DIR/$BRANCH_NAME"
    
    echo "   📍 Branch: $BRANCH_NAME"
    echo "   📂 Path: $WORKTREE_PATH"
    
    if [ -d "$WORKTREE_PATH" ]; then
        echo "   ⚠️  Worktree already exists, skipping..."
        continue
    fi
    
    # Create worktree and branch
    echo "   🌱 Creating worktree..."
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH"
    
    echo "   📋 Setting up agent workspace..."
    
    # Create agent workspace directories
    WORKSPACE_DIR="$WORKTREE_PATH/workspaces/$AGENT_ID"
    mkdir -p "$WORKSPACE_DIR"
    
    # Copy essential configuration files
    echo "   📄 Copying configuration files..."
    
    # Copy .env files if they exist
    for env_file in .env .env.local .env.development; do
        if [ -f "$env_file" ]; then
            echo "      → $env_file"
            cp "$env_file" "$WORKTREE_PATH/"
        fi
    done
    
    # Copy IDE configuration directories
    for config_dir in .claude .cursor .vscode; do
        if [ -d "$config_dir" ]; then
            echo "      → $config_dir/"
            cp -r "$config_dir" "$WORKTREE_PATH/"
        fi
    done
    
    # Generate agent-specific context file
    echo "   📝 Generating agent context..."
    node -e "
const plan = require('./$DEPLOYMENT_PLAN');
const agentData = plan.parallelAgents.filter(agent => agent.agentId === '$AGENT_ID');
const agentContext = {
    agentId: '$AGENT_ID',
    taskId: plan.taskId,
    taskTitle: plan.taskTitle,
    branchName: '$BRANCH_NAME',
    workTreePath: '$WORKTREE_PATH',
    agentInstances: agentData,
    dependencies: [...new Set(agentData.flatMap(a => a.dependencies || []))],
    allFilesToCreate: [...new Set(agentData.flatMap(a => a.filesToCreate || []))],
    allFilesToModify: [...new Set(agentData.flatMap(a => a.filesToModify || []))],
    allTestContracts: [...new Set(agentData.flatMap(a => a.testContracts || []))],
    allValidationCriteria: [...new Set(agentData.flatMap(a => a.validationCriteria || []))],
    canStartImmediately: agentData.every(a => (a.dependencies || []).length === 0),
    estimatedTime: agentData.reduce((sum, a) => sum + parseInt(a.estimatedTime), 0),
    createdAt: new Date().toISOString()
};
console.log(JSON.stringify(agentContext, null, 2));
" > "$WORKSPACE_DIR/agent_context.json"
    
    # Generate files to work on list
    echo "   📁 Generating file lists..."
    node -e "
const plan = require('./$DEPLOYMENT_PLAN');
const agentData = plan.parallelAgents.filter(agent => agent.agentId === '$AGENT_ID');
const allFiles = [
    ...agentData.flatMap(a => (a.filesToCreate || []).map(f => 'CREATE: ' + f)),
    ...agentData.flatMap(a => (a.filesToModify || []).map(f => 'MODIFY: ' + f))
];
console.log([...new Set(allFiles)].join('\n'));
" > "$WORKSPACE_DIR/files_to_work_on.txt"
    
    # Generate test contracts list
    node -e "
const plan = require('./$DEPLOYMENT_PLAN');
const agentData = plan.parallelAgents.filter(agent => agent.agentId === '$AGENT_ID');
const allTests = [...new Set(agentData.flatMap(a => a.testContracts || []))];
console.log(allTests.join('\n'));
" > "$WORKSPACE_DIR/test_contracts.txt"
    
    # Generate validation checklist
    node -e "
const plan = require('./$DEPLOYMENT_PLAN');
const agentData = plan.parallelAgents.filter(agent => agent.agentId === '$AGENT_ID');
const allCriteria = [...new Set(agentData.flatMap(a => a.validationCriteria || []))];
allCriteria.forEach((criteria, index) => {
    console.log(\`\${index + 1}. [ ] \${criteria}\`);
});
" > "$WORKSPACE_DIR/validation_checklist.txt"
    
    echo "   ✅ Agent $AGENT_ID workspace ready!"
    
    # Open Cursor in the new worktree (like in the original script)
    if command -v cursor &> /dev/null; then
        echo "   🚀 Opening Cursor in: $WORKTREE_PATH"
        cursor "$WORKTREE_PATH" &
        sleep 1  # Brief pause between opening multiple instances
    else
        echo "   📝 Manually open your editor in: $WORKTREE_PATH"
    fi
    
    echo ""
done

# Create coordination status file
echo "📊 Setting up coordination system..."
node -e "
const plan = require('./$DEPLOYMENT_PLAN');
const statusData = {
    taskId: plan.taskId,
    taskTitle: plan.taskTitle,
    totalAgents: [...new Set(plan.parallelAgents.map(a => a.agentId))].length,
    agents: [...new Set(plan.parallelAgents.map(a => a.agentId))].map(agentId => ({
        agentId,
        branchName: '${TASK_ID}-' + agentId,
        status: 'spawned',
        canStartImmediately: plan.parallelAgents.filter(a => a.agentId === agentId).every(a => (a.dependencies || []).length === 0),
        dependencies: [...new Set(plan.parallelAgents.filter(a => a.agentId === agentId).flatMap(a => a.dependencies || []))],
        startedAt: null,
        completedAt: null
    })),
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
};
console.log(JSON.stringify(statusData, null, 2));
" > "$COORDINATION_DIR/parallel-agent-status.json"

echo ""
echo "✅ All agent worktrees created successfully!"
echo ""
echo "📊 Summary:"
echo "   Task: $TASK_ID"
echo "   Agents: $AGENT_COUNT"
echo "   Worktrees: $WORKTREES_DIR"
echo "   Coordination: $COORDINATION_DIR"
echo ""
echo "🔄 Next Steps:"
if command -v cursor &> /dev/null; then
    echo "   1. ✅ Cursor instances opened automatically for each agent"
    echo "   2. In each Cursor window:"
    echo "      - Open terminal (Ctrl+\` or Cmd+\`)"
    echo "      - Run: claude"
    echo "      - Feed Claude the agent context from workspaces/{agent_id}/agent_context.json"
    echo "   3. Use the generated file lists and validation criteria to guide development"
else
    echo "   1. Manually open your editor in each worktree directory"
    echo "   2. Review agent contexts in each worktree"
    echo "   3. Open Claude Code instances for each agent"
    echo "   4. Use the generated context files to guide development"
fi
echo ""
echo "🎯 Parallel Development Environment Ready!"
echo "   Each agent has isolated workspace with specific tasks and dependencies"
echo "   Cursor instances are opening automatically - start coding immediately!"
