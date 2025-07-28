# Custom Command Template

Create instructional commands that tell Claude Code exactly what to do, not explanatory descriptions.

## Command Structure

### 1. YAML Frontmatter

```yaml
---
allowed-tools: Tool1, Tool2, Tool3
description: Brief one-line description of what the command does
---
```

### 2. Command Instructions

Write direct instructions for Claude Code:

````markdown
# Command Name

One sentence description of what the command does.

$ARGUMENTS: [specific arguments]

## Instructions

- [specific action]
- [specific action]

## Context

Include any relevant context that is needed to understand the command, such as bash commands, or file references in the @ai-docs/ directory or the codebase. IMPORTANT: Should not exceed 3 files. 

## Output

- [specific output]
- [specific output]

````

### 3. Sub-Agent Commands (if applicable)

For sub-agent commands, use explicit spawning language:

```markdown
Use the [sub-agent-name] sub-agent to [specific action and domain expertise].
````

### 4. Arguments Section (if needed)

```markdown
**variables:**
[VariableName]: $ARGUMENTS

**Usage Examples:**

- `/command` - Default behavior
- `/command value1` - With argument
```

### 5. YAML Configuration Section

````yaml
```yaml
command_configuration:
  instructions:
    # For Sub-Agent Commands: Use explicit spawning language
    - step: 1
      action: "Use the [sub-agent-name] sub-agent to handle [specific functionality]"
      details: "The sub-agent will manage [domain-specific tasks]"

    # For Regular Commands: Standard action flow
    - step: 1
      action: "What to do first"
      details: "Specific implementation details"

  context:
    current_state:
      - name: "State Check Name"
        command: "!`command to check current state`"
        description: "What this state check reveals"
    input_files:
      - "@file1.md"
    reference_docs:
      - "@path/to/documentation.md"
````

```

## Key Requirements

**INSTRUCTIONAL vs EXPLANATORY**:
- ✅ "Run this command: `npm test`"
- ❌ "This command runs tests"
- ✅ "Edit the file according to conventions in docs/style.md"
- ❌ "The file can be edited for better formatting"

**Command Structure**:
- Keep descriptions under 80 characters
- Use direct action verbs (run, edit, review, commit)
- Use `!`command`` for shell commands
- Use `@filename` for file references
- **For sub-agent commands**: Use explicit "Use the [agent-name] sub-agent to [action]" language

## Best Practices

- **Direct instructions**: Tell Claude Code what to do, not what the tool does
- **Clear workflow**: Command → Review → Edit → Next action
- **Reference standards**: Point to specific documentation/conventions
- **Self-contained**: Each command works independently
- **Action-oriented**: Focus on the task, not the explanation
```
