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

## Template Reference

Use the comprehensive template from: @ai-docs/serena-enhanced-claude-template.md

### Template Selection Logic

{{if flags.directory}}
- Apply directory-specific template sections from the referenced file
- Focus on symbol-based architecture and development workflow patterns
{{else}}
- Apply full project root template structure from the referenced file
- Include all Serena-first development patterns and core command references
{{endif}}
