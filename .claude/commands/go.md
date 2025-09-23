---
allowed-tools: mcp__serena__list_dir, mcp__serena__find_file, mcp__serena__search_for_pattern, mcp__serena__get_symbols_overview, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__replace_symbol_body, mcp__serena__insert_after_symbol, mcp__serena__insert_before_symbol, mcp__context7__resolve-library-id, mcp__context7__get-library-docs, mcp__sequential-thinking__process_thought, mcp__sequential-thinking__generate_summary, Read
description: Complete task execution using semantic tools, documentation, and structured implementation
argument-hint: [task description or development requirement]
---

# Go

Complete task execution command that uses `USER_TASK` to analyze, implement, and deliver full solutions through semantic code tools, up-to-date documentation, and structured implementation processes.

## Variables:
USER_TASK: $1
PROJECT_ROOT: .
CLAUDE_CONFIG: CLAUDE.md

## Instructions:

- Read `CLAUDE_CONFIG` to understand project context and requirements
- Use `USER_TASK` to determine complete implementation requirements and deliver working solutions
- Apply serena tools for semantic code analysis, modification, and full implementation
- Leverage context7 for current third-party library documentation and implementation examples
- Use sequential thinking for all decision-making, planning, and execution processes
- Execute complete code implementation and testing to deliver functional results
- Maintain structured approach with clear reasoning for all implementation decisions

## Workflow:

1. Read `CLAUDE_CONFIG` file to understand project structure and context
2. Use sequential thinking to process and break down `USER_TASK` requirements into actionable steps
3. Use serena semantic tools to explore relevant codebase sections and identify implementation targets
4. Retrieve up-to-date documentation using context7 for any third-party dependencies needed
5. Apply structured decision-making through sequential thinking for complete implementation strategy
6. Execute full code implementation using serena's semantic editing tools for precise modifications
7. Implement all required functionality, ensuring code follows project patterns and conventions
8. Test and validate implementation works correctly within the existing codebase
9. Document implementation decisions and verify task completion requirements are met
10. Generate comprehensive summary of implementation and confirm task delivery

## Report:

Task Implementation Complete

Task: `USER_TASK` fully implemented using semantic tools and structured execution
Key Components:
- Project context analysis from `CLAUDE_CONFIG`
- Complete semantic code implementation using serena tools
- Third-party documentation integration via context7
- Structured decision-making and execution through sequential thinking process
- Full code implementation with testing and validation
- Working solution delivered with comprehensive implementation documentation

## Relevant Files:

- [@CLAUDE.md]