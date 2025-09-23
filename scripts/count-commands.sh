#!/bin/bash
# Script to count Claude Code commands in the .claude/commands directory

COMMANDS_DIR=".claude/commands"
COMMAND_COUNT=0

# Count command files (excluding README and workflow examples)
if [ -d "$COMMANDS_DIR" ]; then
    COMMAND_COUNT=$(find "$COMMANDS_DIR" -name "*.md" -type f | grep -v -E "(README|WORKFLOW_EXAMPLES)" | wc -l | tr -d ' ')
fi

echo "Total Claude Code Commands: $COMMAND_COUNT"

# Update README.md badge if requested
if [ "$1" == "--update-badge" ]; then
    # Check if command badge already exists in main README
    if grep -q "Commands-[0-9]*%20Development%20Tools" README.md; then
        # Update existing badge
        sed -i.bak "s/Commands-[0-9]*%20Development%20Tools/Commands-${COMMAND_COUNT}%20Development%20Tools/g" README.md
    else
        # Add new command badge after Node.js Version badge
        sed -i.bak "/Node\.js Version.*\.svg/a\\
[![Claude Code Commands](https://img.shields.io/badge/Commands-${COMMAND_COUNT}%20Development%20Tools-blue.svg)](#-smart-commands-that-understand-you)" README.md
    fi

    # Update commands README if it exists
    if [ -f ".claude/commands/README.md" ]; then
        sed -i.bak "s/Commands-[0-9]*/Commands-${COMMAND_COUNT}/g" .claude/commands/README.md
    fi

    # Clean up backup files
    rm -f README.md.bak .claude/commands/README.md.bak

    echo "Updated command count badges to: $COMMAND_COUNT"
fi