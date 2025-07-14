#!/bin/bash
# Wrapper for spawn-agents.sh -> spawn-agents.py
# This wrapper provides backward compatibility during migration

SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(dirname "$0")
PYTHON_SCRIPT="${SCRIPT_DIR}/python/spawn-agents.py"

# Display deprecation notice
echo "⚠️  DEPRECATION WARNING: $SCRIPT_NAME is deprecated." >&2
echo "   Please use: python $PYTHON_SCRIPT" >&2
echo "   This wrapper will be removed in January 2026." >&2
echo "   See docs/migration-announcement.md for details." >&2
echo "" >&2

# Check if Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "Error: Python script not found at $PYTHON_SCRIPT" >&2
    exit 1
fi

# Forward to Python script, preserving all arguments and exit code
exec python3 "$PYTHON_SCRIPT" "$@"
