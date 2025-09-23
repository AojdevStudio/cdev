---
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git branch:*), mcp__serena__get_symbols_overview, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__search_for_pattern, mcp__serena__list_dir
description: Perform comprehensive code review analysis of recent changes with semantic code understanding
argument-hint: [Optional: specify file paths or commit range for focused review]
---

# Code Review Analysis

Analyze `RECENT_CHANGES` using semantic code understanding to perform comprehensive code review covering quality, security, performance, testing, and documentation with specific actionable feedback saved to `REVIEW_OUTPUT`.

## Variables:
TARGET_SCOPE: $1 (optional - specific files, commit range, or "recent" for latest changes)
GIT_CONTEXT: recent changes and commit history
REVIEW_CRITERIA: code quality, security, performance, testing, documentation
ANALYSIS_DEPTH: semantic symbol analysis with cross-references
REVIEW_OUTPUT: logs/code-review-analysis.md

## Workflow:

1. Gather git context using `git status`, `git diff HEAD~1`, `git log --oneline -5`, and `git branch --show-current`
2. Identify changed files from git diff output for semantic analysis scope
3. Use `mcp__serena__list_dir` to understand project structure and identify key directories
4. For each modified file, use `mcp__serena__get_symbols_overview` to understand code structure and symbols
5. Use `mcp__serena__find_symbol` with `include_body=true` for detailed analysis of modified functions/classes
6. Apply `mcp__serena__find_referencing_symbols` to understand impact of changes on dependent code
7. Use `mcp__serena__search_for_pattern` to identify potential security patterns, anti-patterns, or code smells
8. Analyze code quality: readability, maintainability, adherence to project conventions and best practices
9. Evaluate security: scan for vulnerabilities, input validation, authentication, authorization issues
10. Assess performance: identify bottlenecks, inefficient algorithms, resource usage patterns
11. Review testing: evaluate test coverage, test quality, missing test scenarios for changed code
12. Verify documentation: check inline comments, README updates, API documentation completeness
13. Generate specific, actionable feedback with file:line references and suggested improvements
14. Save comprehensive review analysis to `REVIEW_OUTPUT` with prioritized recommendations

## Report:

Code Review Analysis Complete

File: `REVIEW_OUTPUT`
Topic: Comprehensive semantic code review of `TARGET_SCOPE` with actionable recommendations
Key Components:
- Git context analysis with change scope identification
- Semantic symbol analysis using serena-mcp tools for deep code understanding
- Multi-dimensional review covering quality, security, performance, testing, documentation
- Specific actionable feedback with file:line references and improvement suggestions