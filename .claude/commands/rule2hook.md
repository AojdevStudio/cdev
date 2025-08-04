---
allowed-tools: Bash, Read, Write
description: Convert project rules to executable hooks using modern patterns
---

# Rule to Hook

**Variables**

- $ARGUMENTS: Hook event, rules to convert to hook configurations.

**Instructions**

Convert natural language project rules into Claude Code hook configurations using modern uv scripting patterns. Read @ai-docs/claude-code-hooks-documentation.yaml for rules, determine appropriate hook events and tool matchers based on $ARGUMENTS, pass on context to the python pro sub-agent using `Task` tool, ask the python pro sub-agent to save the uv script file to .claude/hooks and add the hook to the settings.json file ensuring to follow the existing patterns for the hook event setings.

**ABSOLUTE REQUIREMENT: All hooks MUST implement logging**

Every hook in the CDEV system must record every event with timestamp and session ID. All hooks must:

1. Import datetime: `from datetime import datetime`
2. Ensure logs directory exists: `log_dir = Path.cwd() / 'logs'` and `log_dir.mkdir(parents=True, exist_ok=True)`
3. Define log file path: `log_path = log_dir / '<hook_name>.json'`
4. Read existing log data or initialize empty list
5. Add timestamp to the log entry: `timestamp = datetime.now().strftime("%b %d, %I:%M%p").lower()`
6. Append new data with timestamp: `input_data['timestamp'] = timestamp`
7. Write back to file with formatting: `json.dump(log_data, f, indent=2)` 

**Output**

- A .py script file saved to .claude/hooks directory.
- Hook configuration added to .claude/settings.json file.
- Update the docs/architecture/hooks-reference.md with the new hook configuration.

**Context**

Hook configuration example: IMPORTANT: note the command argument is a specific string that must be written as such. 

```json
{
  "matcher": "ToolPattern",
  "hooks": [
    {
      "type": "command",
      "command": "cd \"$CLAUDE_PROJECT_DIR\" && uv run .claude/hooks/file-name.py"
    }
  ]
}