#!/bin/bash
# Script to count AI agents in the .claude/agents directory

AGENTS_DIR=".claude/agents"
AGENT_COUNT=0

# Count agent files (excluding README and workflow examples)
if [ -d "$AGENTS_DIR" ]; then
    AGENT_COUNT=$(find "$AGENTS_DIR" -name "*.md" -type f | grep -v -E "(README|WORKFLOW_EXAMPLES)" | wc -l | tr -d ' ')
fi

echo "Total AI Agents: $AGENT_COUNT"

# Update README.md badge if requested
if [ "$1" == "--update-badge" ]; then
    # Update main README
    sed -i.bak "s/AI%20Agents-[0-9]*%20Intelligent%20Assistants/AI%20Agents-${AGENT_COUNT}%20Intelligent%20Assistants/g" README.md

    # Update agents README
    sed -i.bak "s/AI_Agents-[0-9]*/AI_Agents-${AGENT_COUNT}/g" .claude/agents/README.md

    # Clean up backup files
    rm -f README.md.bak .claude/agents/README.md.bak

    echo "Updated agent count badges to: $AGENT_COUNT"
fi
