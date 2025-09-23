---
allowed-tools: Read, Write, Edit, MultiEdit, Grep, Glob, Bash
description: Enforce logging discipline protocol - eliminate console statements and implement structured logging
argument-hint: [TARGET_DIRECTORY] [LANGUAGE] [CHECK_ONLY]
---

# Enforce Logging Discipline

Scan `TARGET_DIRECTORY` for logging violations, eliminate all console statements, and implement structured logging following the discipline protocol. Save enforcement report to `OUTPUT_DIRECTORY` with violations found and fixes applied.

## Variables:

TARGET_DIRECTORY: $1
LANGUAGE: $2
CHECK_ONLY: $3
OUTPUT_DIRECTORY: .claude/data/
PROTOCOL_FILE: ai-docs/logging-discipline.md

## Instructions:

- Read `PROTOCOL_FILE` to understand the complete logging discipline requirements
- Scan `TARGET_DIRECTORY` for console.*, print(), and other logging violations
- For `LANGUAGE` JavaScript/TypeScript: configure ESLint no-console rule and implement Pino logger
- For `LANGUAGE` Python: configure Ruff rules and implement structlog
- If `CHECK_ONLY` is true, report violations without making changes
- Apply all fixes following the protocol's structured logging patterns
- Generate enforcement report with before/after comparison

## Workflow:

1. Read `PROTOCOL_FILE` to understand logging discipline requirements
2. Use Grep to scan `TARGET_DIRECTORY` for console.log, console.error, print() violations
3. Identify `LANGUAGE` from file extensions (.js, .ts, .py) if not specified
4. Check existing logger configuration (ESLint, Pino, structlog)
5. If `CHECK_ONLY` is false, configure appropriate linting rules for `LANGUAGE`
6. Install and configure structured logging library (Pino for JS/TS, structlog for Python)
7. Use MultiEdit to replace all console.* statements with structured logger calls
8. Ensure stdout/stderr separation follows protocol requirements
9. Add correlation IDs and redaction configuration
10. Run linting validation to confirm no violations remain
11. Generate enforcement report with violations count and fixes applied
12. Save report to `OUTPUT_DIRECTORY`/logging-discipline-report.md

## Report:

Logging Discipline Enforced

File: `OUTPUT_DIRECTORY`/logging-discipline-report.md
Target: `TARGET_DIRECTORY` (`LANGUAGE` files)
Violations Fixed:
- Console statements eliminated: [count]
- Structured logging implemented: [yes/no]
- ESLint/Ruff rules configured: [yes/no]
Protocol Compliance: [compliant/violations remaining]

## Relevant Files:

- [@ai-docs/logging-discipline.md]