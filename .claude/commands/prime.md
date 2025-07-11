---
allowed-tools: Bash, Read
description: Load essential project context by analyzing codebase structure and core docs
---

# Prime

This command provides a lean, focused overview of the project by examining the codebase structure and core documentation for efficient context loading.

**Usage Examples:**
- `/prime` - Load project context and provide overview

## Instructions
- Run `git ls-files` to understand the codebase structure and file organization
- Read the README.md to understand the project purpose, setup instructions, and key information
- Read the CHANGELOG.md to understand recent changes and version history
- Provide a concise overview of the project structure and purpose
- Focus on what the codebase contains rather than how to work with it (CLAUDE.md handles that)

## Context
- Codebase structure: !`git ls-files`
- Project overview: @README.md
- Recent changes: @CHANGELOG.md
- Note: Parallel development workflows are loaded via CLAUDE.md automatically