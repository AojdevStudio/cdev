---
allowed-tools: Task
description: Use auto-documenter sub-agent to update project documentation files
argument-hint: [project-scope] [doc-types]
---

# Update Docs

Use the auto-documenter sub-agent to systematically update `CLAUDE.md` files and `README.md` across the `PROJECT_SCOPE` focusing on `DOC_TYPES`.

## Variables

PROJECT_SCOPE: $1 (default: entire project)
DOC_TYPES: $2 (default: CLAUDE.md,README.md)
OUTPUT_DIRECTORY: current project root
TEMPLATE_NAME: auto-documenter format

## Workflow

1. Check current git status with `!git status`
2. Use the auto-documenter sub-agent to analyze codebase structure
3. Update existing CLAUDE.md files with current project state
4. Update README.md files with accurate project information
5. Generate comprehensive summary report of all changes made
6. Provide TODO items requiring user attention

## Report

Documentation Update Complete

Files Updated: `PROJECT_SCOPE`/CLAUDE.md, `PROJECT_SCOPE`/README.md
Scope: Comprehensive documentation refresh for `PROJECT_SCOPE`
Key Components:
- Updated project context and structure
- Refreshed command documentation
- Current development status
- TODO items for manual review

## Relevant Files

- @docs/claude-code-subagents-collection/auto-documenter.md
- @CLAUDE.md
- @README.md
