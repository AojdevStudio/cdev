# Serena-Enhanced CLAUDE.md Template

## Problem Statement

Development teams need a standardized CLAUDE.md template that emphasizes efficient Serena MCP workflows over manual development processes. Current project documentation often lacks guidance on intelligent code exploration and modification patterns, leading to inefficient file reading and manual navigation approaches.

## Objectives

- Create a reusable CLAUDE.md template for any project type
- Establish Serena-first development methodology as the default approach
- Provide clear workflow patterns that prevent inefficient code exploration
- Include customizable sections for project-specific requirements
- Reduce cognitive load through standardized structure and commands

## Technical Approach

### Template Architecture

```
CLAUDE.md Template Structure:
├── Project Overview (customizable)
├── Serena-First Development Methodology (standard)
├── Core Commands (project-specific + Serena patterns)
├── Serena Workflow Guidelines (standard with examples)
├── Project Navigation (dynamic Serena patterns)
├── Technology Stack (customizable)
├── Domain-Specific Guidelines (placeholder)
└── Quality Standards (Serena-enhanced)
```

### Design Principles

1. **Serena-First**: All workflows start with intelligent exploration
2. **Template Variables**: Use placeholders for project customization
3. **Progressive Disclosure**: Basic commands first, advanced patterns later
4. **Copy-Paste Ready**: All Serena commands should be executable
5. **Self-Documenting**: Template explains its own structure

## Step-by-Step Implementation

### Phase 1: Template Structure Creation

1. **Header Section**
   - Project name placeholder: `{PROJECT_NAME}`
   - Description placeholder: `{PROJECT_DESCRIPTION}`
   - Status tracking: `{PROJECT_STATUS}`

2. **Serena-First Methodology Section**
   - Core principles (standardized)
   - Workflow hierarchy: Explore → Understand → Modify
   - Anti-patterns to avoid (full file reading, blind navigation)

3. **Development Commands Section**
   - Serena workflow references (standard)
   - Core commands template: `{CORE_COMMANDS}`
   - Technology-specific commands: `{TECH_COMMANDS}`

### Phase 2: Serena Workflow Patterns

1. **Initial Codebase Exploration**

   ```bash
   # Standard pattern for any project
   mcp__serena__check_onboarding_performed
   mcp__serena__list_dir --relative_path="{SRC_DIR}" --recursive=true
   mcp__serena__find_file --file_mask="{MAIN_FILE_PATTERN}" --relative_path="."
   ```

2. **Symbol-Based Navigation**

   ```bash
   # Adaptable to any language/framework
   mcp__serena__get_symbols_overview --relative_path="{KEY_FILE}"
   mcp__serena__find_symbol --name_path="{SYMBOL_PATTERN}" --substring_matching=true
   ```

3. **Code Modification Patterns**
   ```bash
   # Universal editing patterns
   mcp__serena__replace_symbol_body --name_path="{FUNCTION_NAME}" --relative_path="{FILE_PATH}"
   mcp__serena__insert_after_symbol --name_path="{ANCHOR_SYMBOL}" --relative_path="{FILE_PATH}"
   ```

### Phase 3: Customization System

1. **Variable Replacement System**
   - `{PROJECT_NAME}`: Project display name
   - `{PROJECT_DESCRIPTION}`: Brief project summary
   - `{TECH_STACK}`: Primary technologies
   - `{SRC_DIR}`: Main source directory
   - `{MAIN_FILE_PATTERN}`: Primary file pattern (_.py, _.js, etc.)
   - `{DOMAIN_GUIDELINES}`: Project-specific business logic patterns

2. **Technology-Specific Sections**
   - Python projects: pandas, Django, FastAPI patterns
   - JavaScript projects: React, Node.js, Express patterns
   - General patterns: API development, testing, deployment

3. **Domain Adaptations**
   - Web applications: frontend/backend separation
   - Data science: data processing, analysis patterns
   - APIs: endpoint exploration, documentation
   - CLI tools: command structure, option handling

### Phase 4: Quality Patterns

1. **Serena-Enhanced Testing**

   ```bash
   # Understand before testing
   mcp__serena__find_symbol --name_path="test_*" --substring_matching=true
   mcp__serena__find_referencing_symbols --name_path="{FUNCTION_TO_TEST}"
   ```

2. **Code Quality Workflows**
   ```bash
   # Explore issues before fixing
   mcp__serena__search_for_pattern --substring_pattern="{ERROR_PATTERN}"
   mcp__serena__think_about_collected_information
   ```

## Implementation Details

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

## File Structure
[Key symbols and their locations]

## Recent Updates (Updated: YYYY-MM-DD)
[Symbol-level changes and impact]
```

{{else}}

### Project Root CLAUDE.md Template

````markdown
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

## Requirements – Important:
- Do **not** clutter the `CLAUDE.md` file with transient notes or dev context. Instead, use the `serena_mcp.write_memory` function to persist information, ensuring accessibility for future development without bloating main documentation files.

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
````

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
```
