---
allowed-tools: Read, Write, Bash
description: Convert project rules to executable hooks using modern patterns
---

# Rule to Hook

This command converts natural language project rules into Claude Code hook configurations, leveraging modern uv scripting patterns for sophisticated implementations.

**variables:**
RuleText: $ARGUMENTS

**Usage Examples:**
- `/rule2hook` - Convert all rules from CLAUDE.md files
- `/rule2hook PreToolUse "validate bash commands for security"` - Create specific PreToolUse hook
- `/rule2hook PostToolUse "format code after file changes"` - Create PostToolUse hook

## Instructions
- If arguments provided: use $ARGUMENTS to get hook_event and rule_text
- If no arguments: read and analyze project CLAUDE.md files
- Determine appropriate hook events and tool matchers based on rule keywords
- Generate hook configurations using jq for simple cases, uv scripts for complex logic
- Create complete JSON configuration and save to `~/.claude/hooks.json`
- Provide implementation summary with usage examples

## Context
- Current hooks configuration: !`cat ~/.claude/hooks.json 2>/dev/null || echo "{}"`
- Project rules: @CLAUDE.md
- Local project rules: @CLAUDE.local.md  
- User rules: @~/.claude/CLAUDE.md
- Hook documentation: @ai_docs/claude-code-hooks-documentation.md
- uv scripting patterns: @ai_docs/astral-uv-scripting-documentation.md
- Hook events: PreToolUse (before, can block), PostToolUse (after), Stop (end), Notification (alerts)
- Common matchers: Bash, Write|Edit|MultiEdit, Read, WebFetch|WebSearch, .*
- Exit codes: 0 (continue), 2 (block execution), other (log error)