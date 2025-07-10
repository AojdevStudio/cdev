# Command Creation Guide

This guide provides a streamlined approach to creating custom Claude commands that fit our template format while giving users control over their command creation process.

## Quick Start

Use the `/create-command` slash command to interactively create new commands:

```bash
# Interactive mode
/create-command

# With specifications
/create-command "analyze-deps" project utility
/create-command "git-flow" user workflow
```

## Command Categories

### 1. **Planning Commands**
- Multi-stage workflows
- Interactive and conversational
- Create documentation artifacts
- Example: brainstorming, proposals, roadmaps

### 2. **Implementation Commands**
- Direct action execution
- File creation/modification
- Code generation
- Example: scaffolding, refactoring, migrations

### 3. **Analysis Commands**
- Review and audit operations
- Generate reports and insights
- Provide recommendations
- Example: code review, dependency analysis, performance audit

### 4. **Workflow Commands**
- Orchestrate multiple steps
- Coordinate between tools
- Track progress
- Example: release process, testing pipeline, deployment

### 5. **Utility Commands**
- Simple tools and helpers
- Quick operations
- Reusable functions
- Example: formatting, search, validation

## Creation Process

### Step 1: Define Purpose
```markdown
What problem does this command solve?
Who will use it and when?
What's the expected output?
```

### Step 2: Choose Location
- **Project Commands** (`.claude/commands/`): Specific to this codebase
- **User Commands** (`~/.claude/commands/`): Available across all projects

### Step 3: Select Pattern
Study similar commands for patterns:
```bash
# List existing commands
ls -la .claude/commands/
ls -la ~/.claude/commands/

# Read similar command
cat .claude/commands/similar-command.md
```

### Step 4: Generate Command
Follow the 6-part template structure:
1. YAML frontmatter
2. Main heading
3. Brief description
4. Arguments section (if needed)
5. Instructions section
6. Context section

## Template Example

```markdown
---
allowed-tools: Read, Write, Bash
description: Brief description of what the command does
---

# Command Name

This command [does what] by [how it works] for [purpose/benefit].

**variables:**
InputType: $ARGUMENTS

**Usage Examples:**
- `/command` - Default behavior
- `/command value` - With argument
- `/command "complex value"` - With quoted argument

## Instructions
- Step 1: Initial action
- Step 2: Process/analyze
- Step 3: Generate output
- Step 4: Save results
- Step 5: Provide summary

## Context
- Current state: !`relevant command`
- Input files: @relevant/files.md
- Key concepts: concept1 (explanation)
```

## Best Practices

### 1. **Self-Contained Commands**
- Include all necessary context
- Don't rely on external documentation
- Provide clear examples

### 2. **Dynamic Context**
- Use `!` for runtime data: `!git status`
- Use `@` for file references: `@README.md`
- Use `$ARGUMENTS` for user input

### 3. **Clear Instructions**
- Start with action verbs
- Be specific about inputs/outputs
- Keep steps sequential and logical

### 4. **Consistent Naming**
- Use lowercase with hyphens: `analyze-code`
- Use descriptive verbs: `generate`, `validate`, `convert`
- Add numeric prefix for ordered workflows: `01-plan`, `02-implement`

## Advanced Patterns

### Conditional Logic
```markdown
## Instructions
- If $ARGUMENTS contains "test": focus on test generation
- If $ARGUMENTS contains "docs": focus on documentation
- Otherwise: provide general analysis
```

### Multiple File Operations
```markdown
## Instructions
- Read all TypeScript files: !`find . -name "*.ts" -type f`
- Analyze import patterns in each file
- Generate dependency graph
- Save visualization to `docs/dependencies.svg`
```

### Integration with Tools
```markdown
## Context
- Linear issues: !`cdev list issues`
- Git worktrees: !`git worktree list`
- Test results: !`npm test -- --json`
```

## Testing Your Command

1. **Create the command file**
2. **Test with various inputs**:
   ```bash
   /your-command
   /your-command test
   /your-command "complex input"
   ```
3. **Verify output matches expectations**
4. **Refine based on usage**

## Sharing Commands

### Project Commands
- Commit to `.claude/commands/`
- Document in README
- Include usage examples

### User Commands
- Save to `~/.claude/commands/`
- Share via gist or repo
- Include installation instructions

## Command Maintenance

- Review commands periodically
- Update for new project patterns
- Remove obsolete commands
- Consolidate similar commands

This guide ensures consistent, powerful, and maintainable custom commands that enhance your Claude Code workflow.