# CDEV Project Context

## What is CDEV?

**CDEV (Claude Development)** is an AI-powered development orchestration system designed to enhance Claude Code with sophisticated parallel development workflows, intelligent automation, and universal task understanding.

### Project Purpose

- **Transform Claude Code workflows** with parallel agent coordination and advanced automation
- **Universal task processing** from Linear tickets, markdown tasks, or plain descriptions
- **Zero-friction setup** with one-command installation for any project type
- **Production-ready distribution** as a global NPM package
  (`@aojdevstudio/cdev`)

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
{DOMAIN_GUIDELINES}

## Quality Standards
[Serena-enhanced quality patterns]


## Current Development Status

**v0.0.21** - Production-ready NPM package with active development

### Recently Completed

- ✅ **Interactive Installation System**: Fully functional with project detection and hook customization
- ✅ **3-Tier Hook Architecture**: Critical, Important, and Optional hooks with intelligent categorization
- ✅ **Python Script Migration**: 15+ Python automation scripts for parallel development workflows
- ✅ **Agent System Optimization**: 20+ specialized AI agents with streamlined tool selection
- ✅ **Command Ecosystem**: 25+ custom Claude Code commands for enhanced workflows
- ✅ **Testing Infrastructure**: Comprehensive Jest configuration with multiple test environments
- ✅ **NPM Package Distribution**: Published to `@aojdevstudio/cdev` with automated CI/CD

### In Progress

- 🔄 **Modular Installation System**: Refactoring installation components for improved maintainability
- 🔄 **Enhanced Documentation**: Comprehensive updates to reflect current implementation
- 🔄 **Template System Expansion**: Additional framework-specific templates
- 🔄 **Performance Optimization**: Hook execution and agent response time improvements

### Planned Features

- 📋 **Enhanced Linear Integration**: Advanced ticket decomposition and tracking
- 📋 **Web Dashboard**: Real-time agent monitoring and progress visualization
- 📋 **Plugin Architecture**: Extensible system for custom hooks and agents
- 📋 **Team Collaboration**: Multi-developer parallel workflow coordination

### Development Memories

- removing obsolete tests is better than maintaining stale mocks.
- After making changes to existing functionality or adding new features, update existing tests, remove old obsolete tests, build new tests
- When writing code, always add clear, descriptive comments explaining each section. Always group related items together. It is important to explain the purpose of each script, dependency, and configuration. Make it easy to understand for someone who might be overwhelmed by complexity. It should not be too verbose, but it should use complete, concise sentences that an educated person can follow.
- For JSON-related files, make sure to create separate documentation to explain those files, because comments are not approved or allowed in JSON.
- IMPORTANT: proactively aim to adhere to the principle "Don't Repeat Yourself" (DRY), which is a fundamental software development practice designed to eliminate code duplication and redundancy. The main idea is that each piece of knowledge or logic should exist only once in a codebase. If a particular functionality needs to be used in multiple places, it should be implemented in a single, reusable module—like a function, class, or method—and referenced wherever needed

- respect the @ai-docs/naming-conventions.md
