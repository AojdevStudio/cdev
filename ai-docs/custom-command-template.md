---
title: "Custom Command Template"
description: "Standard template structure for creating custom Claude Code slash commands with proper formatting and tool specifications."
category: "Templates"
subcategory: "Claude Code Commands"
product_line: "Desktop Commander"
audience: "AI Developers"
status: "Active Template"
author: "AOJDevStudio"
created_date: "2025-08-29"
last_updated: "2025-09-19"
tags:
  - template
  - claude-code
  - slash-commands
  - command-structure
  - development
---

# Custom Command Template

Create instructional commands that tell Claude Code exactly what to do, not explanatory descriptions.

## Command Structure

### Structured Prompt Architecture

The core of the methodology revolves around a structured prompt format with distinct sections:

<-!-- Start of Template Structure -->
### Template Structure

1. METADATA SECTION (REQUIRED)
Contains configuration information specific to the AI tool being used. For Claude Code, this includes:
- Tool restrictions (read, write, bash tools only)
- Argument hints for dynamic parameter passing
- Configuration parameters for agent behavior
- **Purpose**: Context and constraint definition
- **Components**: Task description, audience specification, output format requirements
- **Benefit**: Eliminates ambiguity and ensures consistent execution

```yaml
---
allowed-tools: Tool1, Tool2, Tool3
description: Brief one-line description of what the command does
argument-hint: [Argument hints for dynamic parameter passing] 
model: [model to use] (optional)
---
```

2. Command name (REQUIRED)

```markdown
# Command Name

Description of the command using `USER_INPUT` to analyze the request and save to `OUTPUT_DIRECTORY` using the `TEMPLATE_NAME` format.
```

3. Variables Section (REQUIRED)

An underappreciated but crucial component that allows for dynamic prompt generation and reusability across different contexts and projects.
- **Purpose**: Dynamic input management
- **Components**: Parameterized inputs, context-specific data, customization points
- **Benefit**: Template reusability and scalability

```markdown
## Variables:
<!----FOR MULTIPLE ARGUMENTS, USE CLEAN VARIABLE SYNTAX WITH $1, $2, $3, etc., ALLOWING FOR POSITIONAL ARGUMENTS-->
VARIABLE_NAME: $1
VARIABLE_NAME_2: $2
VARIABLE_NAME_3: $3
OUTPUT_DIRECTORY: specific/path/
TEMPLATE_NAME: specific-value
```

4. Instructions Section (OPTIONAL USE FOR COMPLEX COMMANDS ONLY, DO NOT DUPLICATE THE INSTRUCTIONS IN THE WORKFLOW SECTION)

```markdown
## Instructions:

- Parse the `USER_INPUT` to understand the requirements
- Use the `TEMPLATE_NAME` format for consistent output
- Save all results to `OUTPUT_DIRECTORY` location
- [additional specific actions as needed]
```

5. Workflow Section (REQUIRED)

A sequential list of tasks that the agent should execute to complete the job. This provides clear, step-by-step guidance that ensures consistent execution regardless of the complexity of the underlying task.
- **Purpose**: Step-by-step process definition
- **Components**: Sequential task breakdown, decision points, validation steps
- **Benefit**: Reproducible processes and quality assurance

```markdown
## Workflow 

- [numbered steps]
- [numbered steps]
- [numbered steps]
```

6. Report Section (REQUIRED)

Defines the expected output format and structure, ensuring consistent and actionable results from agent execution.
- **Purpose**: Output structure and format specification
- **Components**: Deliverable format, quality metrics, success criteria
- **Benefit**: Consistent, actionable outputs

```markdown
## Report

[Task Name] Complete

File: `OUTPUT_DIRECTORY`/<filename>
Topic: [brief description of what was accomplished]
Key Components:
- [main component 1]
- [main component 2]
- [main component 3]
```
7. RELEVANT FILES (OPTIONAL)

```markdown
## Relevant Files 

- [@file1.md]
- [@file2.md]
```
8. CODEBASE STRUCTURE (OPTIONAL)

```markdown
## Codebase Structure
```tree
{codebase structure}
```
```
<!-- End of Template Structure -->

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
