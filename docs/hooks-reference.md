# CDEV Hooks Reference

> **Complete guide to understanding and using CDEV's intelligent hook system**

## 📚 Table of Contents

1. [What Are Hooks?](#what-are-hooks)
2. [How Hooks Work](#how-hooks-work)
3. [Hook Categories](#hook-categories)
4. [Individual Hook Documentation](#individual-hook-documentation)
5. [Creating Custom Hooks](#creating-custom-hooks)
6. [Hook Configuration](#hook-configuration)
7. [Troubleshooting Hooks](#troubleshooting-hooks)

## What Are Hooks?

Think of hooks as **intelligent assistants** that watch over Claude's shoulder, catching mistakes before they happen and automating repetitive tasks. They're like having a senior developer review every action in real-time.

### Why Hooks Matter

Without hooks:
```bash
# Claude might accidentally:
- Edit .env files with secrets
- Run dangerous commands like rm -rf
- Create TypeScript files with syntax errors
- Commit code without running tests
```

With hooks:
```bash
# Claude is protected:
✅ Dangerous commands are blocked
✅ TypeScript is validated before saving
✅ Commits follow team conventions
✅ Tests run automatically
```

## How Hooks Work

Hooks intercept Claude's actions at specific points:

```
Claude wants to edit a file
    ↓
[pre_tool_use hook runs]
    ↓
✅ Safe? → Action proceeds
❌ Unsafe? → Action blocked with explanation
    ↓
[post_tool_use hook runs]
    ↓
Results processed/logged
```

## Hook Categories

### 🛡️ Tier 1: Critical Security & Validation

These hooks **cannot be disabled** - they protect your codebase from critical errors.

#### 1. pre_tool_use.py
**Purpose**: Your first line of defense against dangerous operations

**What it does**:
- Blocks destructive commands (`rm -rf`, `dd`, `format`)
- Prevents editing sensitive files (`.env`, private keys)
- Requires reading files before editing them
- Validates file paths for safety

**Example protection**:
```python
# This would be blocked:
rm -rf /important-directory

# Claude receives:
"BLOCKED: Dangerous rm command detected and prevented"
```

**Configuration**: None - always active for safety

---

#### 2. typescript-validator.py
**Purpose**: Ensures TypeScript code is valid before saving

**What it does**:
- Runs TypeScript compiler in check mode
- Validates syntax and basic type errors
- Prevents broken code from entering codebase
- Provides clear error messages

**Example**:
```typescript
// Claude tries to save:
const user: string = 123; // Type error!

// Hook response:
"TypeScript Error: Type 'number' is not assignable to type 'string'"
```

**Configuration**: 
```json
{
  "strictMode": true,
  "checkJs": false,
  "maxErrors": 10
}
```

---

#### 3. commit-message-validator.py
**Purpose**: Maintains clean, semantic git history

**What it does**:
- Enforces conventional commit format
- Validates commit message length
- Ensures proper emoji usage
- Checks for issue references

**Valid formats**:
```
✅ feat: add user authentication
✅ 🐛 fix: resolve memory leak in renderer
✅ 📝 docs: update API documentation
❌ "fixed stuff" (too vague)
❌ "FEAT: Add auth" (wrong format)
```

**Configuration**:
```json
{
  "enforceEmoji": true,
  "maxLength": 72,
  "requireIssueRef": false
}
```

---

#### 4. task-completion-enforcer.py
**Purpose**: Ensures no TODOs or FIXMEs are left behind

**What it does**:
- Scans for TODO/FIXME comments
- Blocks commits with unresolved tasks
- Tracks task completion
- Generates task reports

**Example**:
```javascript
// This would block commit:
function processPayment() {
  // TODO: Add payment validation
  return true;
}
```

**Configuration**:
```json
{
  "blockOnTodo": true,
  "allowedPatterns": ["TODO(@username)"],
  "scanFileTypes": [".js", ".ts", ".py"]
}
```

---

#### 5. pnpm-enforcer.py
**Purpose**: Prevents package manager conflicts

**What it does**:
- Detects pnpm projects
- Blocks npm/yarn commands
- Suggests correct pnpm alternatives
- Maintains lockfile integrity

**Example**:
```bash
# In pnpm project, this is blocked:
npm install express

# Hook suggests:
"Use 'pnpm add express' instead"
```

### 🚀 Tier 2: Productivity Enhancement

These hooks improve workflow but can be selectively disabled.

#### 6. api-standards-checker.py
**Purpose**: Ensures consistent API design

**What it does**:
- Validates REST endpoint patterns
- Checks GraphQL schema conventions
- Ensures consistent error responses
- Validates OpenAPI specifications

**Example validations**:
```javascript
✅ GET /api/v1/users
✅ POST /api/v1/users
❌ GET /api/getUsers (non-RESTful)
❌ POST /api/user/create (inconsistent)
```

---

#### 7. code-quality-reporter.py
**Purpose**: Real-time code quality feedback

**What it does**:
- Identifies code smells
- Suggests refactoring opportunities
- Checks complexity metrics
- Monitors technical debt

**Metrics tracked**:
- Cyclomatic complexity
- Function length
- Duplicate code
- Coupling metrics

---

#### 8. import-organizer.py
**Purpose**: Maintains clean import statements

**What it does**:
- Groups imports by type (external, internal, relative)
- Sorts alphabetically within groups
- Removes unused imports
- Adds missing imports

**Before**:
```javascript
import { z } from 'zod';
import React from 'react';
import { useUser } from './hooks';
import axios from 'axios';
```

**After**:
```javascript
// External
import axios from 'axios';
import React from 'react';
import { z } from 'zod';

// Internal
import { useUser } from './hooks';
```

---

#### 9. universal-linter.py
**Purpose**: Multi-language code quality

**What it does**:
- Detects file type automatically
- Applies appropriate linter
- Provides consistent formatting
- Supports 15+ languages

**Supported linters**:
- JavaScript/TypeScript: ESLint
- Python: Flake8, Black
- Go: golint
- Rust: clippy
- And more...

### 🎨 Tier 3: Optional Features

Nice-to-have features for enhanced development experience.

#### 10. notification.py
**Purpose**: System notifications for important events

**What it does**:
- Notifies when Claude needs input
- Alerts on task completion
- Error notifications
- Progress updates

**Notification types**:
- 🔔 Input needed
- ✅ Task complete
- ❌ Error occurred
- 📊 Progress update

---

#### 11. stop.py
**Purpose**: Graceful session cleanup

**What it does**:
- Saves work progress
- Closes open resources
- Updates task status
- Generates session summary

---

#### 12. post_tool_use.py
**Purpose**: Action logging and analysis

**What it does**:
- Logs all tool usage
- Tracks action patterns
- Generates usage reports
- Identifies optimization opportunities

## Creating Custom Hooks

### Basic Hook Structure

```python
#!/usr/bin/env python3
import json
import sys

def main():
    # Read input from Claude
    input_data = json.load(sys.stdin)
    
    tool_name = input_data.get('tool_name')
    tool_input = input_data.get('tool_input', {})
    
    # Your validation logic here
    if should_block_action(tool_name, tool_input):
        print("BLOCKED: Reason for blocking")
        sys.exit(1)
    
    # Allow action
    sys.exit(0)

if __name__ == "__main__":
    main()
```

### Hook Input Format

```json
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/src/index.ts",
    "old_string": "const x = 1",
    "new_string": "const x = 2"
  }
}
```

### Best Practices

1. **Fast Execution**: Hooks should complete in <100ms
2. **Clear Messages**: Provide actionable error messages
3. **Fail Gracefully**: Don't crash on unexpected input
4. **Log Wisely**: Use structured logging for debugging

## Hook Configuration

### Global Configuration
Location: `~/.cdev/hooks.config.json`

```json
{
  "enabled": true,
  "tiers": {
    "1": true,  // Cannot actually be disabled
    "2": true,
    "3": true
  },
  "individual": {
    "notification": false,  // Disable specific hook
    "import-organizer": {
      "grouping": "custom",
      "sortOrder": ["react", "external", "internal"]
    }
  }
}
```

### Project Configuration
Location: `.cdev/hooks.config.json`

```json
{
  "extends": "global",
  "overrides": {
    "typescript-validator": {
      "strictMode": false  // Project-specific setting
    }
  },
  "custom": [
    ".cdev/hooks/my-custom-hook.py"
  ]
}
```

## Troubleshooting Hooks

### Common Issues

#### Hook Blocking Legitimate Action
```bash
# Temporarily bypass specific hook
CDEV_DISABLE_HOOK=typescript-validator claude

# Check why hook is blocking
cdev debug-hook typescript-validator
```

#### Hook Not Running
```bash
# Verify hook is installed
cdev list-hooks

# Test hook directly
echo '{"tool_name":"Edit","tool_input":{}}' | python .claude/hooks/pre_tool_use.py
```

#### Performance Issues
```bash
# Profile hook execution
cdev profile-hooks

# See execution times
cdev hook-stats
```

### Debug Mode

Enable detailed hook logging:
```bash
export CDEV_HOOK_DEBUG=true
claude
```

## Advanced Hook Patterns

### Conditional Hooks
```python
# Only run in production branches
if get_current_branch().startswith('prod'):
    enforce_strict_validation()
```

### Async Hooks
```python
# Non-blocking notifications
async def notify_team():
    await send_slack_message("Deployment started")
```

### Hook Chains
```python
# One hook triggers another
if validation_passed:
    trigger_hook('run-tests')
```

## Hook API Reference

### Available Functions

```python
# Get project context
get_project_root() -> str
get_current_branch() -> str
get_project_config() -> dict

# Validation helpers
validate_typescript(code: str) -> ValidationResult
validate_python(code: str) -> ValidationResult
check_file_safety(path: str) -> bool

# Communication
send_notification(message: str, level: str)
log_action(action: str, details: dict)
```

---

*For more examples and patterns, check the [hooks directory](.claude/hooks/) in your CDEV installation.*