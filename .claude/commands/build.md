---
description: Build the codebase based on a plan using Serena-first approach
arguement-hint: [path-to-plan]
allowed-tools: Bash, Read, Write, mcp__serena__*
---

# Build

Follow the `Serena-First Workflow` to implement the `PATH_TO_PLAN` then `Report` the completed work.

## Variables

PATH_TO_PLAN: $ARGUMENTS

## Serena-First Workflow

### 1. Initial Setup
- If no `PATH_TO_PLAN` is provided, STOP immediately and ask the user to provide it
- Check Serena onboarding: `mcp__serena__check_onboarding_performed`
- If not onboarded, complete onboarding process first

### 2. Plan Analysis
- Read the plan at `PATH_TO_PLAN`
- Use `mcp__serena__think_about_task_adherence` to validate plan alignment
- Store plan insights: `mcp__serena__write_memory --memory_name="build_plan_analysis"`

### 3. Symbol-Based Implementation
- **NEVER read entire files** - use symbol navigation
- Use `mcp__serena__get_symbols_overview` to understand file structure
- Use `mcp__serena__find_symbol` for targeted code examination
- Use `mcp__serena__find_referencing_symbols` to understand dependencies
- Use symbol-based editing tools:
  - `mcp__serena__replace_symbol_body` for function/class updates
  - `mcp__serena__insert_after_symbol` for new code additions
  - `mcp__serena__insert_before_symbol` for imports/declarations

### 4. Quality Validation
- Run quality checks: `npm run quality`
- Run tests: `npm test`
- Use `mcp__serena__think_about_collected_information` to validate implementation
- Use `mcp__serena__think_about_whether_you_are_done` before completion

### 5. Memory Management
- Store implementation insights: `mcp__serena__write_memory`
- Document any architectural decisions or patterns discovered

## Report

- Summarize the work you've just done in a concise bullet point list
- Report the files and total lines changed with `git diff --stat`
- Document key symbols modified and their locations (file:line format)
- Note any stored memories for future reference