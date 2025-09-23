---
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(find:*), Bash(grep:*), Bash(wc:*), Bash(ls:*), mcp__serena__*
description: Update CLAUDE.md using Serena-first analysis of recent code changes
argument-hint: [--directory target-dir]
flags:
  --directory: Create/update CLAUDE.md for a specific directory instead of project root
---

# Update Claude.md

Use Serena-first analysis to update CLAUDE.md based on recent code changes and git history.

## Variables

TARGET_DIRECTORY: {{if flags.directory}}{{flags.directory}}{{else}}.{{endif}}
CLAUDE_FILE: {{if flags.directory}}{{flags.directory}}/CLAUDE.md{{else}}CLAUDE.md{{endif}}
ANALYSIS_SCOPE: {{if flags.directory}}directory-specific{{else}}project-wide{{endif}}

## Workflow

### 1. Initial Setup
- Check Serena onboarding: `mcp__serena__check_onboarding_performed`
- If not onboarded, complete onboarding process first
- Use `mcp__serena__think_about_task_adherence` to validate update scope

### 2. Git Analysis
- Get current status: !`git status --porcelain`
- Review recent commits: !`git log --oneline -10`
- Analyze changed files: !`git diff HEAD~5 --name-only | head -20`
- Check key file modifications: !`git diff --name-status HEAD~10 | grep "^M" | head -10`
- Store git insights: `mcp__serena__write_memory --memory_name="git_analysis"`

### 3. Serena Codebase Analysis
- Analyze directory structure: `mcp__serena__list_dir --relative_path="TARGET_DIRECTORY" --recursive=true`
- For each modified file from git analysis:
  - Get symbol overview: `mcp__serena__get_symbols_overview --relative_path="<FILE>"`
  - Find new symbols: `mcp__serena__find_symbol --name_path="<NEW_SYMBOLS>"`
  - Check symbol impact: `mcp__serena__find_referencing_symbols --name_path="<KEY_SYMBOLS>"`
- Store symbol analysis: `mcp__serena__write_memory --memory_name="symbol_changes"`

### 4. Content Integration
- Read existing CLAUDE.md file: @CLAUDE_FILE
- Use `mcp__serena__think_about_collected_information` to validate analysis
- Update CLAUDE.md sections based on symbol insights:
  - Project overview with new architecture patterns
  - Development workflow with symbol-based guidance
  - File structure with symbol distribution
  - Recent changes with symbol-level impact
- Save updated CLAUDE.md to CLAUDE_FILE location

### 5. Validation
- Use `mcp__serena__think_about_whether_you_are_done` to verify completeness
- Store update insights: `mcp__serena__write_memory --memory_name="claude_update_ANALYSIS_SCOPE"`

## Report

CLAUDE.md Update Complete

File: `CLAUDE_FILE`
Analysis Scope: ANALYSIS_SCOPE
Key Updates:
- Symbol-level changes documented
- Architecture patterns updated
- Development workflow enhanced
- Integration points clarified
Memory Stored: claude_update_ANALYSIS_SCOPE

## Template Structure

{{if flags.directory}}
### Directory-Specific CLAUDE.md Template
```markdown
# Directory Name

## Overview
[Directory purpose and responsibility based on symbol analysis]

## Architecture
[How directory symbols integrate with the project]

## Development Workflow
[Symbol-based development processes]

## Dev Notes
- Code quality refer to @ai-docs/code-quality.md
- Logging discipline rules refer to @ai-docs/logging-discipline.md
- Naming conventions refer to @ai-docs/naming-conventions.md

## File Structure
[Key symbols and their locations]

## Recent Updates (Updated: YYYY-MM-DD)
[Symbol-level changes and impact]
```
{{else}}
### Project Root CLAUDE.md Template

```markdown
# {PROJECT_NAME} - CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CRITICAL: SERENA-FIRST RULE - READ THIS FIRST
  BEFORE doing ANYTHING else, when you see ANY code development scenario:
  - STOP and check if Serena MCP is available & IF onboarding is performed
  - Use Serena MCP Workflow Guidelines to explore code structure
  - Use Symbol-Based Code Navigation to understand context
  - Use Efficient Code Modification patterns
  - Always: Store insights with memory management
VIOLATION CHECK: If you used TodoWrite first, you violated this rule. Stop and restart with Serena-First Development Approach.

## Project Overview
{PROJECT_DESCRIPTION}

**Status**: {PROJECT_STATUS}
**Tech Stack**: {TECH_STACK}

## Development Commands

### Serena-First Development Approach
- **Before debugging**: Use Serena workflows to explore structure
- **Before modifying**: Use symbol navigation to understand context
- **Always**: Store insights with memory management

### Core Commands
- **Never read entire files**: Use symbol overview first, then targeted `find_symbol`
- **Symbol-first approach**: Navigate by functions/classes, not file browsing
- **Memory-driven**: Store insights across sessions for faster future work
- **Think before acting**: Use reflection tools before major changes

## Serena MCP Core Commands & Workflow Patterns

This section defines the core Serena commands and shows how to combine them into effective workflows. Avoid reading full files and prefer these symbol-based patterns.

### 1. Core Commands Reference

#### Exploration & Navigation
```bash
# Get a high-level overview of a file's structure (classes, functions)
mcp__serena__get_symbols_overview --relative_path="<PATH/TO/FILE>"

# List files and directories
mcp__serena__list_dir --relative_path="<PATH>" --recursive=true

# Find files by a name pattern
mcp__serena__find_file --file_mask="*.<EXT>" --relative_path="<PATH>"

# Find a specific function/class by name (use include_body=true only when ready to edit)
mcp__serena__find_symbol --name_path="<SYMBOL_NAME>" --include_body=false

# Find where a symbol is used
mcp__serena__find_referencing_symbols --name_path="<SYMBOL_NAME>"

# Search for a raw text pattern across code files
mcp__serena__search_for_pattern --substring_pattern="<PATTERN>"
```

#### Code Modification
```bash
# Replace the body of an entire function or class
mcp__serena__replace_symbol_body --name_path="<FUNCTION_NAME>" --relative_path="<PATH/TO/FILE>"

# Insert code after a specific symbol
mcp__serena__insert_after_symbol --name_path="<ANCHOR_SYMBOL>" --relative_path="<PATH/TO/FILE>"

# Insert code before a specific symbol (e.g., for imports)
mcp__serena__insert_before_symbol --name_path="<FIRST_SYMBOL_IN_FILE>" --relative_path="<PATH/TO/FILE>"
```

#### Memory & Reflection
```bash
# Store insights for future sessions
mcp__serena__write_memory --memory_name="<MEMORY_NAME>" --content="<INSIGHT_TEXT>"

# Review stored insights
mcp__serena__list_memories
mcp__serena__read_memory --memory_file_name="<MEMORY_FILE_NAME>"

# Reflect on collected information and task adherence
mcp__serena__think_about_collected_information
mcp__serena__think_about_task_adherence
```

### 2. Workflow Patterns

#### Initial Codebase Onboarding
```bash
# 1. Ensure Serena is ready
mcp__serena__check_onboarding_performed

# 2. Get the project layout
mcp__serena__list_dir --relative_path="." --recursive=false
mcp__serena__list_dir --relative_path="<SRC_DIR>" --recursive=true

# 3. Get a high-level overview of key files (do NOT read them)
mcp__serena__get_symbols_overview --relative_path="<PATH/TO/KEY_FILE_1>"
mcp__serena__get_symbols_overview --relative_path="<PATH/TO/KEY_FILE_2>"
```

#### Investigating a Feature or Bug
```bash
# 1. Find relevant symbols related to the feature
mcp__serena__find_symbol --name_path="<FEATURE_NAME>*" --substring_matching=true

# 2. Understand how a key function is used
mcp__serena__find_referencing_symbols --name_path="<KEY_FUNCTION>"

# 3. Examine the function's implementation only when necessary
mcp__serena__find_symbol --name_path="<KEY_FUNCTION>" --include_body=true
```

#### Safely Modifying Code
```bash
# 1. Find all references before changing a function to understand the impact
mcp__serena__find_referencing_symbols --name_path="<FUNCTION_TO_CHANGE>"

# 2. Replace the function body with the updated implementation
mcp__serena__replace_symbol_body --name_path="<FUNCTION_TO_CHANGE>" --relative_path="<PATH/TO/FILE>"

# 3. Add a new helper function after an existing one
mcp__serena__insert_after_symbol --name_path="<EXISTING_FUNCTION>" --relative_path="<PATH/TO/FILE>"
```

## {DOMAIN_NAME} Guidelines

## Instruction for Code Comments (All Languages)

- YOU MUST comment code for readability and intent, NOT for restating the obvious. Every file must start with a short header comment describing its purpose. Every public function, class, or API must have a docblock that explains what it does, its inputs, its outputs, and edge cases.

**JavaScript/TypeScript**: Use JSDoc/TSDoc format with @fileoverview, @param, @returns, @example.
**Python**: Use PEP 257 docstrings with triple quotes; include a one-line summary, parameters, returns, and example usage.
**All languages**: Explain why a decision was made, list invariants/assumptions, and add examples where useful. Keep comments updated when code changes.

**Rule of thumb**: ALWAYS comment intent, constraints, and non-obvious logic. Code shows “what,” comments explain “why.”

## Compatibility & Migration Policy (Out-with-the-old)

**Default stance:** We do **not** preserve backward compatibility. When a change is requested, replace the old behavior with the new approach. Remove obsolete code, flags, and interfaces immediately unless the request explicitly says "keep legacy support."

### Rules for Agents & Tools
- **BREAK-FIRST mindset:** Prefer deletion and simplification over shims/adapters. No polyfills, toggles, or compatibility layers unless explicitly requested.
- **Single source of truth:** The **latest** interface/spec supersedes all prior versions. Do not consult or retain deprecated variants.
- **Migration over coexistence:** Write **forward-only** migrations. Do **not** add down-migrations unless explicitly requested.
- **Delete deprecated code now:** No deprecation windows. Remove old functions, types, env vars, config keys, and documentation in the same change.
- **Update all call sites:** Rename/replace and fix usages across the repo; do not leave aliases.
- **Tests follow the new world:** Update or replace tests to encode the new behavior. Delete tests that only assert legacy behavior.

### Versioning & Communication
- **Docs header:** Update the HTML header stamp on modified docs: `<!-- vMAJOR.MINOR | YYYY-MM-DD -->` and increment **MAJOR** on any breaking change.
- **Commit prefix:** Start the commit title with `BREAKING:` when the change removes/renames public symbols, config, or endpoints.
- **Changelog note:** Add a concise migration note (what changed, one-liner on how to migrate) in the relevant README or module doc.

### Examples (apply literally)
- **API surface:** If `getPatient()` becomes `fetchPatient()`, **remove** `getPatient()` and update all imports/usages; **no wrappers**.
- **Config keys:** If `RECALL_WINDOW_DAYS` becomes `RECALL_WINDOW`, migrate values and **delete** the old key and its references.
- **Data models:** If a column is renamed, write a one-off script to migrate; **do not** keep both columns.

> If you need compatibility, the request must say so explicitly. Otherwise, assume **out with the old, in with the new**.

```
{{endif}}
