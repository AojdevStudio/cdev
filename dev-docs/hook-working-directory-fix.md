# Hook Working Directory Fix

## Problem Description

Claude Code's hook system executes hooks from an internal working directory context, not from your project root. This causes the error:

```
failed to spawn: '.claude/hooks/pre_tool_use.py'
```

## Root Cause

When Claude Code executes a hook command like `uv run .claude/hooks/pre_tool_use.py`, it's not running from your project root directory. The relative path `.claude/hooks/pre_tool_use.py` becomes invalid from Claude Code's execution context, causing the process to fail with "No such file or directory".

## Solution

The solution is to ensure hooks always execute from the project root directory by using the `$CLAUDE_PROJECT_DIR` environment variable.

### Implementation

Update your `.claude/settings.json` to change directory before executing hooks:

**Before:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run .claude/hooks/pre_tool_use.py"
          }
        ]
      }
    ]
  }
}
```

**After:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && uv run .claude/hooks/pre_tool_use.py"
          }
        ]
      }
    ]
  }
}
```

## Alternative Solutions

### Solution 2: Use Full Absolute Path

```json
{
  "command": "uv run /full/path/to/your/project/.claude/hooks/pre_tool_use.py"
}
```

### Solution 3: Make Script Globally Executable

1. Update the shebang in your hook files:

   ```python
   #!/usr/bin/env python3
   ```

2. Use the environment variable with direct execution:
   ```json
   {
     "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/pre_tool_use.py"
   }
   ```

## Important Notes

- Always restart Claude Code after modifying `.claude/settings.json`
- The `$CLAUDE_PROJECT_DIR` environment variable is automatically set by Claude Code
- This fix is automatically applied when using the `cdev` installer

## Troubleshooting

If hooks still fail to execute:

1. Verify the hook files exist in `.claude/hooks/`
2. Check that hook files have executable permissions: `chmod +x .claude/hooks/*.py`
3. Ensure Python/uv is correctly installed and available in PATH
4. Try running the hook manually to check for syntax errors:
   ```bash
   cd /your/project/path
   uv run .claude/hooks/pre_tool_use.py
   ```
