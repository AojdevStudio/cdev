# Tier 1 - Critical Hooks

This directory contains critical security and validation hooks that are essential for project integrity.

## Hooks in this tier:

- **commit-message-validator.py**: Validates commit message format and content
- **typescript-validator.py**: Validates TypeScript code and type safety
- **task-completion-enforcer.py**: Ensures tasks are completed before proceeding
- **pnpm-enforcer.py**: Enforces use of pnpm package manager

## Characteristics:

- Security-focused
- Validation and enforcement
- Required for all projects
- Cannot be disabled without explicit override

## Usage:

These hooks are automatically included in all project setups unless explicitly excluded.
