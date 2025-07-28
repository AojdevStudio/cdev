# Anthropic Claude Code Custom Command Conventions

**Official Standards Reference** - Based on Anthropic Documentation Analysis via Context7

This document establishes definitive conventions for custom Claude Code commands based on official Anthropic documentation and examples. Use this as the authoritative reference for auditing and creating custom commands.

## Status: Production Ready ✅

**Implementation Status**: All 24 commands achieved 100% compliance as of Phase 2 completion.
**Validation**: Automated compliance checking via `.claude/scripts/validate-commands.sh`
**Ecosystem**: Complete integration mapping and workflow orchestration implemented.

---

## 1. File Structure and Organization

### Directory Structure

```
Project Commands:
.claude/commands/           # Project-specific commands (team-wide)
├── optimize.md            # Available as /project:optimize
├── security-review.md     # Available as /project:security-review
└── fix-issue.md           # Available as /project:fix-issue

Personal Commands:
~/.claude/commands/         # User-specific commands (personal)
├── security-review.md     # Available as /user:security-review
└── analyze-pattern.md     # Available as /user:analyze-pattern
```

### Official Standards

- **Project Commands**: `.claude/commands/` directory in project root
- **Personal Commands**: `~/.claude/commands/` directory in user home
- **File Extension**: Always `.md` (Markdown)
- **Directory Creation**: `mkdir -p .claude/commands` or `mkdir -p ~/.claude/commands`

---

## 2. File Naming Conventions

### Naming Rules

- **Format**: `kebab-case.md` (lowercase with hyphens)
- **Command Derivation**: Filename without `.md` becomes command name
- **Character Set**: Alphanumeric characters and hyphens only
- **No Spaces**: Use hyphens instead of spaces or underscores

### Examples from Official Documentation

```bash
# File: .claude/commands/optimize.md
# Command: /project:optimize

# File: .claude/commands/security-review.md
# Command: /project:security-review

# File: .claude/commands/fix-issue.md
# Command: /project:fix-issue

# File: ~/.claude/commands/security-review.md
# Command: /user:security-review
```

---

## 3. Content Format Requirements

### Primary Format: Instructional Prompts

Commands should contain **direct instructions** to Claude, not explanatory documentation.

#### ✅ Correct Format (Instructional)

```markdown
Analyze this code for performance issues and suggest optimizations:
```

```markdown
Review this code for security vulnerabilities, focusing on:
```

```markdown
Find and fix issue #$ARGUMENTS. Follow these steps: 1. Understand the issue described in the ticket 2. Locate the relevant code in our codebase 3. Implement a solution that addresses the root cause 4. Add appropriate tests 5. Prepare a concise PR description
```

#### ❌ Incorrect Format (Explanatory)

```markdown
# Code Optimization Command

This command helps analyze code for performance issues. It will:

- Review the code structure
- Identify bottlenecks
- Suggest improvements

## Usage

Use this command when you need to optimize performance.
```

### Writing Style Standards

- **Imperative Voice**: Use direct commands ("Analyze", "Review", "Fix")
- **Specific Instructions**: Be explicit about what Claude should do
- **Action-Oriented**: Focus on the task, not the description
- **Concise**: Avoid unnecessary explanations or context

---

## 4. Command Invocation Patterns

### Syntax Structure

```bash
/<prefix>:<command-name> [arguments]
```

### Prefix Types

- **`project:`** - Commands from `.claude/commands/`
- **`user:`** - Commands from `~/.claude/commands/`
- **`mcp__<server>__<prompt>`** - MCP server commands (auto-discovered)

### Official Examples

```bash
# Project-specific commands
> /project:optimize
> /project:security-review
> /project:fix-issue 123

# Personal commands
> /user:security-review
> /user:analyze-pattern

# With arguments
> /project:fix-issue 123
> /project:deploy staging
```

---

## 5. $ARGUMENTS Placeholder Usage

### Purpose

The `$ARGUMENTS` placeholder allows commands to accept dynamic user input.

### Official Implementation Pattern

```bash
# Command Definition
echo "Fix issue #$ARGUMENTS. Follow these steps: 1. Understand the issue described in the ticket 2. Locate the relevant code in our codebase 3. Implement a solution that addresses the root cause 4. Add appropriate tests 5. Prepare a concise PR description" > .claude/commands/fix-issue.md

# Command Usage
> /project:fix-issue 123
```

### Replacement Behavior

- **Single Placeholder**: `$ARGUMENTS` is replaced with entire argument string
- **Position**: Can appear anywhere in the command text
- **Multiple Uses**: Same value replaces all `$ARGUMENTS` instances
- **No Arguments**: `$ARGUMENTS` becomes empty string

### Examples

```markdown
# File: optimize-function.md

Optimize the function named $ARGUMENTS for better performance and readability.

# Usage: /project:optimize-function calculateTotal

# Result: "Optimize the function named calculateTotal for better performance and readability."
```

```markdown
# File: test-component.md

Create comprehensive tests for the $ARGUMENTS component, including unit tests, integration tests, and edge cases.

# Usage: /project:test-component UserAuth

# Result: "Create comprehensive tests for the UserAuth component, including unit tests, integration tests, and edge cases."
```

---

## 6. Best Practices from Official Examples

### Command Complexity Levels

#### Simple Commands (No Arguments)

```markdown
Analyze the performance of this code and suggest three specific optimizations:
```

#### Parameterized Commands (With Arguments)

```markdown
Fix issue #$ARGUMENTS following our coding standards and best practices.
```

#### Complex Workflows (Multi-Step)

```markdown
Find and fix issue #$ARGUMENTS. Follow these steps: 1. Understand the issue described in the ticket 2. Locate the relevant code in our codebase 3. Implement a solution that addresses the root cause 4. Add appropriate tests 5. Prepare a concise PR description
```

### Domain-Specific Commands

```markdown
# Security Focus

Review this code for security vulnerabilities, focusing on:

# Performance Focus

Analyze this code for performance issues and suggest optimizations:

# Code Quality Focus

Review this code for maintainability and suggest improvements:
```

---

## 7. Quality Criteria for Command Auditing

### Structure Compliance

- [ ] **File Location**: Correct `.claude/commands/` or `~/.claude/commands/` placement
- [ ] **File Extension**: Uses `.md` extension
- [ ] **Naming Convention**: Uses kebab-case naming
- [ ] **Directory Structure**: Follows official directory patterns

### Content Standards

- [ ] **Instructional Format**: Contains direct instructions, not explanations
- [ ] **Action-Oriented**: Uses imperative voice and specific verbs
- [ ] **Clarity**: Clear, unambiguous instructions
- [ ] **Conciseness**: No unnecessary explanatory content

### Functionality

- [ ] **Argument Support**: Proper `$ARGUMENTS` usage when needed
- [ ] **Command Scope**: Appropriate level of complexity for single command
- [ ] **Reusability**: Generalizable across similar use cases
- [ ] **Team Compatibility**: Works for all team members (if project-scoped)

### Integration

- [ ] **Invocation Pattern**: Follows `/project:name` or `/user:name` format
- [ ] **Argument Handling**: Correctly processes passed arguments
- [ ] **Context Awareness**: Works within project context appropriately

---

## 8. Migration and Audit Guidelines

### Audit Process

1. **Inventory**: List all existing custom commands
2. **Structure Check**: Verify file locations and naming
3. **Content Review**: Ensure instructional format
4. **Functionality Test**: Verify command invocation and arguments
5. **Quality Assessment**: Apply quality criteria checklist

### Common Issues to Fix

- **Explanatory Content**: Remove documentation-style content
- **Incorrect Naming**: Fix non-kebab-case filenames
- **Missing Arguments**: Add `$ARGUMENTS` where beneficial
- **Complex Instructions**: Split overly complex commands
- **Inconsistent Tone**: Standardize to imperative voice

### Recommendations

- **Start Simple**: Begin with basic instructional commands
- **Test Thoroughly**: Verify commands work as expected
- **Document Usage**: Maintain separate usage documentation if needed
- **Regular Review**: Periodically audit command effectiveness
- **Team Coordination**: Ensure project commands serve team needs

---

## 9. Official Examples for Reference

### From Anthropic Documentation

#### Basic Optimization Command

```bash
# File Creation
echo "Analyze this code for performance issues and suggest optimizations:" > .claude/commands/optimize.md

# Usage
> /project:optimize
```

#### Security Review Command

```bash
# File Creation
echo "Review this code for security vulnerabilities, focusing on:" > ~/.claude/commands/security-review.md

# Usage
> /user:security-review
```

#### Parameterized Issue Fix Command

```bash
# File Creation
echo "Find and fix issue #$ARGUMENTS. Follow these steps: 1. Understand the issue described in the ticket 2. Locate the relevant code in our codebase 3. Implement a solution that addresses the root cause 4. Add appropriate tests 5. Prepare a concise PR description" > .claude/commands/fix-issue.md

# Usage
> /project:fix-issue 123
```

---

## 10. Integration with CDEV

### CDEV-Specific Considerations

- **Parallel Development**: Commands should support parallel workflow patterns
- **Agent Context**: Consider integration with CDEV's agent system
- **Quality Gates**: Align with CDEV's validation requirements
- **Task Processing**: Support various task input formats (Linear, markdown, plain text)

### Recommended CDEV Command Categories

- **Task Processing**: Commands for handling different task formats
- **Agent Management**: Commands for parallel development workflows
- **Quality Assurance**: Commands for validation and testing
- **Integration**: Commands for git workflows and deployment
- **Analysis**: Commands for codebase analysis and optimization

This document provides the authoritative reference for creating and auditing Claude Code custom commands according to official Anthropic standards.
