# @aojdevstudio/cdev Hooks Reference

> **Complete guide to understanding and using cdev's intelligent hook system that acts as your AI pair programmer's safety net**

## 📚 Table of Contents

1. [What Are Hooks?](#what-are-hooks)
2. [How Hooks Work](#how-hooks-work)
3. [Hook Categories](#hook-categories)
4. [Individual Hook Documentation](#individual-hook-documentation)
5. [Creating Custom Hooks](#creating-custom-hooks)
6. [Hook Configuration](#hook-configuration)
7. [Troubleshooting Hooks](#troubleshooting-hooks)
8. [Real-World Examples](#real-world-examples)

## Quick Reference

| Hook Name                   | Tier | Purpose                                           | Can Disable? |
| --------------------------- | ---- | ------------------------------------------------- | ------------ |
| pre_tool_use.py             | 1    | Blocks dangerous operations & date hallucinations | ❌ No        |
| typescript-validator.py     | 1    | Validates TypeScript syntax                       | ❌ No        |
| commit-message-validator.py | 1    | Enforces commit conventions                       | ❌ No        |
| task-completion-enforcer.py | 1    | Blocks commits with TODOs                         | ❌ No        |
| pnpm-enforcer.py            | 1    | Prevents package manager conflicts                | ❌ No        |
| api-standards-checker.py    | 2    | Ensures REST/GraphQL standards                    | ✅ Yes       |
| code-quality-reporter.py    | 2    | Reports code metrics                              | ✅ Yes       |
| import-organizer.py         | 2    | Organizes import statements                       | ✅ Yes       |
| universal-linter.py         | 2    | Multi-language linting                            | ✅ Yes       |
| notification.py             | 3    | System notifications                              | ✅ Yes       |
| stop.py                     | 3    | Session cleanup                                   | ✅ Yes       |
| post_tool_use.py            | 3    | Action logging                                    | ✅ Yes       |
| auto-changelog-updater.py   | 3    | Auto-updates changelog after git commits          | ✅ Yes       |

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

**Purpose**: Your first line of defense against dangerous operations and AI hallucinations

**What it does**:

- Blocks destructive commands (`rm -rf`, `dd`, `format`)
- Prevents editing sensitive files (`.env`, private keys)
- Enforces command template reading before creating new commands
- **NEW: Date Awareness Check** - Detects when AI writes dates without verification
- Validates file paths for safety

**Example protections**:

1. **Dangerous Command Protection**:

```bash
# This would be blocked:
rm -rf /important-directory

# Claude receives:
"BLOCKED: Dangerous rm command detected and prevented"
```

2. **Date Hallucination Prevention** (NEW):

```python
# When writing "Released in January 2025":
📅 Date Awareness Check: Content contains date references
⚠️  WARNING: You're writing date-sensitive content without verifying the current date!
💡 Recommendation: Run 'date' command first to ensure accuracy
```

3. **Command Template Protection**:

```bash
# When creating new command without reading template:
❌ BLOCKED: You must read and understand the custom command template first!
📖 Please read: ai-docs/custom-command-template.md
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
("TypeScript Error: Type 'number' is not assignable to type 'string'");
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

---

#### 13. auto-changelog-updater.py

**Purpose**: Automatically maintains project changelog after commits

**What it does**:

- Monitors for successful git commit commands
- Runs changelog update script in automatic mode
- Analyzes recent commits and categorizes them
- Updates CHANGELOG.md following conventional format

**Trigger conditions**:

- Detects git commit patterns in Bash commands
- Only runs after successful commits (exit code 0)
- Supports various commit formats (commit -m, commit -am, amend)

**Example workflow**:

```bash
# Developer makes a commit
git commit -m "feat: add user authentication"

# Hook automatically:
1. Detects the git commit
2. Runs scripts/changelog/update-changelog.py --auto
3. Updates CHANGELOG.md with the new feature entry
```

**Configuration**:

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "cd \"$CLAUDE_PROJECT_DIR\" && uv run .claude/hooks/auto-changelog-updater.py"
    }
  ]
}
```

**Benefits**:

- Zero manual changelog maintenance
- Consistent changelog formatting
- Automatic semantic versioning support
- Never forget to update changelogs

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
    "1": true, // Cannot actually be disabled
    "2": true,
    "3": true
  },
  "individual": {
    "notification": false, // Disable specific hook
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
      "strictMode": false // Project-specific setting
    }
  },
  "custom": [".cdev/hooks/my-custom-hook.py"]
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

## Additional Hooks

### pre_tool_use_command_template_guard.py

**Purpose**: Ensures proper command creation workflow

**What it does**:

- Validates command file structure
- Enforces template compliance
- Prevents malformed commands
- Guides proper command creation

### subagent_stop.py

**Purpose**: Manages sub-agent lifecycle

**What it does**:

- Tracks sub-agent completion
- Aggregates sub-agent results
- Manages resource cleanup
- Reports back to main agent

## Real-World Examples

### Example 1: Preventing Production Disasters

```bash
# Scenario: Claude tries to clean up temporary files
Claude: "I'll remove the temporary files"
Command: rm -rf /tmp/*

# Hook intervention:
🛡️ pre_tool_use.py: "BLOCKED: Dangerous rm command with wildcard detected"
Suggestion: "Use specific file paths or safer alternatives like find with -delete"
```

### Example 2: Maintaining Code Quality

```typescript
// Scenario: Claude fixes a bug quickly
const processPayment = (amount) => {
  // TODO: Add currency validation
  return amount * 1.1; // Add tax
}

// Hook intervention:
❌ task-completion-enforcer.py: "Blocked: Unresolved TODO found"
📝 typescript-validator.py: "Warning: 'amount' parameter needs type annotation"
```

### Example 3: Date Accuracy in Documentation

```markdown
// Scenario: Claude updates README

## Version History

- v1.0.0 - Released January 2025
- v1.1.0 - Planned for Q2 2025

// Hook intervention:
📅 pre_tool_use.py: "Date Awareness Check: Verify dates are accurate"
💡 Suggestion: "Run 'date' command first to confirm current date"
```

### Example 4: Consistent API Design

```javascript
// Scenario: Claude adds new endpoint
router.get('/api/getUsers', fetchUsers);

// Hook intervention:
🎯 api-standards-checker.py: "Non-RESTful endpoint detected"
✅ Suggestion: "Use '/api/users' for REST compliance"
```

### Example 5: Automatic Changelog Maintenance

```bash
# Scenario: Claude commits a new feature
Claude: "I'll commit the authentication feature"
Command: git commit -m "feat: implement JWT authentication with refresh tokens"

# Hook automation:
✅ Commit successful
🔄 auto-changelog-updater.py: "Automatically updating changelog..."
📝 CHANGELOG.md updated with:
   ### Added
   - feat: implement JWT authentication with refresh tokens
```

## Hook Development Best Practices

### 1. Performance Optimization

```python
# ❌ Bad: Reading entire file for every check
content = open(large_file).read()
if "pattern" in content:
    # process

# ✅ Good: Stream file and exit early
with open(large_file) as f:
    for line in f:
        if "pattern" in line:
            # process and break
```

### 2. User-Friendly Messages

```python
# ❌ Bad: Technical jargon
print("E_INVALID_AST_NODE: Unexpected token at position 42")

# ✅ Good: Clear, actionable feedback
print("Syntax Error: Missing closing bracket ')' on line 5")
print("Hint: Check if all parentheses are properly matched")
```

### 3. Graceful Degradation

```python
# ✅ Good: Handle missing dependencies
try:
    import typescript_parser
    can_validate_ts = True
except ImportError:
    can_validate_ts = False
    print("Note: TypeScript validation unavailable (parser not installed)")
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: CDEV Hooks Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run CDEV Hooks
        run: |
          npx @aojdevstudio/cdev validate
          npx @aojdevstudio/cdev run-hooks --all
```

### Pre-commit Integration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: cdev-hooks
        name: CDEV Hook Validation
        entry: cdev run-hooks
        language: system
        pass_filenames: true
```

## Summary

The cdev hook system provides multiple layers of protection and enhancement for AI-assisted development:

1. **Safety First**: Tier 1 hooks prevent catastrophic mistakes before they happen
2. **Quality Assurance**: Tier 2 hooks maintain code standards automatically
3. **Developer Experience**: Tier 3 hooks enhance workflow with notifications and logging
4. **Extensibility**: Custom hooks allow project-specific validations
5. **AI Awareness**: Special features like date detection prevent common AI hallucinations

Whether you're working solo or in a team, hooks ensure that AI assistance remains helpful without introducing risks or inconsistencies.

### Next Steps

- Install cdev: `npm install -g @aojdevstudio/cdev`
- Run setup: `cdev init`
- Customize hooks: Edit `.cdev/hooks.config.json`
- Create custom hooks: See examples above

---

_For more examples and patterns, check the [hooks directory](.claude/hooks/) in your cdev installation._

**Last Updated**: August 2025
