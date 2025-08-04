---
allowed-tools: Bash, Read, Write
description: Convert project rules to executable hooks using modern patterns
---

# Rule to Hook

**Variables**

- $ARGUMENTS: Hook event, rules to convert to hook configurations.

**Instructions**

Convert natural language project rules into Claude Code hook configurations using modern uv scripting patterns. Read @ai-docs/claude-code-hooks-documentation.yaml for rules, determine appropriate hook events and tool matchers based on $ARGUMENTS, pass on context to the python pro sub-agent using `Task` tool, ask the python pro sub-agent to save the uv script file to .claude/hooks and add the hook to the settings.json file ensuring to follow the existing patterns for the hook event setings. 

**Output**

- A .py script file saved to .claude/hooks directory.
- Hook configuration added to .claude/settings.json file.
- Update the docs/architecture/hooks-reference.md with the new hook configuration.

**Context**

Hook configuration example:

```json
{
  "matcher": "[enter matcher type here]",
  "hooks": [
    {
      "type": "command",
      "command": "cd \"$CLAUDE_PROJECT_DIR\" && uv run .claude/hooks/file-name.py"
    }
  ]
}