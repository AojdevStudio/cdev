---
description: Creates a concise engineering implementation plan using Serena-first codebase analysis
arguement-hint: [user prompt]
allowed-tools: Read, Write, Edit, Grep, Glob, MultiEdit, mcp__serena__*
model: opus
---

# Quick Plan

Create a detailed implementation plan based on the user's requirements using `Serena-First Analysis` to understand the codebase context, then save a comprehensive specification document to the `PLAN_OUTPUT_DIRECTORY/<name-of-plan>.md`.

## Variables

USER_PROMPT: $ARGUMENTS
PLAN_OUTPUT_DIRECTORY: `specs/`

## Serena-First Analysis Workflow

### 1. Initial Setup
- Check Serena onboarding: `mcp__serena__check_onboarding_performed`
- If not onboarded, complete onboarding process first
- Use `mcp__serena__think_about_task_adherence` to validate requirements

### 2. Codebase Context Analysis
- **NEVER read entire files** - use symbol navigation
- Use `mcp__serena__list_dir` to understand project structure relevant to requirements
- Use `mcp__serena__search_for_pattern` to find existing related functionality
- Use `mcp__serena__get_symbols_overview` for relevant files to understand current architecture
- Use `mcp__serena__find_symbol` to examine existing implementations that might be extended or modified

### 3. Requirements Analysis & Solution Design
- Parse the `USER_PROMPT` to understand core problem and desired outcome
- Use collected codebase insights to inform technical approach
- Leverage existing patterns and architecture discovered through symbol analysis
- Store analysis insights: `mcp__serena__write_memory --memory_name="requirements_analysis"`

### 4. Plan Creation
Create a comprehensive implementation plan that includes:
- **Codebase Context**: Current relevant symbols and their locations
- **Problem Statement**: Clear objectives based on requirements
- **Technical Approach**: Architecture decisions informed by existing code patterns
- **Symbol-Based Implementation Guide**: Specific functions/classes to modify using Serena tools
- **Integration Points**: How new code connects to existing symbols
- **Testing Strategy**: Leveraging existing test patterns
- **Success Criteria**: Measurable outcomes

### 5. Documentation & Memory Management
- Generate descriptive, kebab-case filename based on the main topic
- Save plan to `PLAN_OUTPUT_DIRECTORY/<descriptive-name.md>`
- Store key insights: `mcp__serena__write_memory --memory_name="plan_<topic>"`
- Use `mcp__serena__think_about_collected_information` to validate completeness

## Plan Structure Template

```markdown
# [Plan Title]

## Codebase Context
- **Relevant Files**: List key files with symbol overviews
- **Existing Patterns**: Current architecture patterns to follow
- **Integration Points**: Specific symbols/functions to extend

## Problem Statement & Objectives
[Clear problem definition]

## Technical Approach
[Architecture decisions informed by codebase analysis]

## Symbol-Based Implementation Guide
### Phase 1: [Description]
- Use `mcp__serena__find_symbol` for: [specific symbols]
- Use `mcp__serena__replace_symbol_body` for: [functions to modify]
- Use `mcp__serena__insert_after_symbol` for: [new additions]

### Phase 2: [Description]
[Continue with symbol-specific instructions]

## Integration & Testing
[Testing approach using existing patterns]

## Success Criteria
[Measurable outcomes]
```

## Report

After creating and saving the implementation plan, provide a concise report:

```
Implementation Plan Created

File: PLAN_OUTPUT_DIRECTORY/<filename.md>
Topic: <brief description of what the plan covers>
Codebase Analysis:
- <key files/symbols analyzed>
- <existing patterns leveraged>
Key Components:
- <main component 1>
- <main component 2>
- <main component 3>
Memory Stored: plan_<topic>
```