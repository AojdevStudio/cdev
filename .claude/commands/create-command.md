---
allowed-tools: Read, Write, Glob, Grep
description: Create new custom Claude commands following project conventions
---

# Create Command

This command helps create new custom Claude commands or edit existing commands by understanding requirements, determining patterns, and generating well-structured command files following our template conventions.

**variables:**
CommandRequest: $ARGUMENTS

**Usage Examples:**
- `/create-command` - Interactive command creation wizard
- `/create-command "search" for finding code patterns` - Create a search command
- `/create-command "validate-api" project analysis` - Create project-specific validator
- `/create-command "format" user utility` - Create personal utility command

## Instructions
- Parse $ARGUMENTS to extract command name, type (project/user), and category
- If no arguments, start interactive mode asking for command details
- Study existing commands in target directory for patterns and conventions
- Generate command following the 6-part template structure
- Save to appropriate location (.claude/commands/ or ~/.claude/commands/)
- Provide usage examples and next steps

## Context
- Template structure: @ai-docs/custom-command-template.md
- Creation guide: @ai-docs/command-creation-guide.md
- Project commands: !`ls -la .claude/commands/ 2>/dev/null || echo "No project commands yet"`
- User commands: !`ls -la ~/.claude/commands/ 2>/dev/null || echo "No user commands yet"`
- Command categories: planning (multi-stage), implementation (action-focused), analysis (review/audit), workflow (orchestration), utility (tools/helpers)
- Naming conventions: lowercase-hyphenated, descriptive verbs, optional numeric prefix for ordered workflows
- Key patterns: use @ for file refs, ! for dynamic data, $ARGUMENTS for user input