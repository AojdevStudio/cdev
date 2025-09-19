---
allowed-tools: Glob, Grep, Read, Write
description: Generate new Claude Code slash commands using structured template
argument-hint: [command-name] [command-purpose] [tools-needed] [output-type]
---

# Create Command

Generate a new Claude Code slash command following the structured prompt architecture template. Parse `COMMAND_DETAILS` to create a complete command file with proper metadata, workflow, variables, and report sections saved to `OUTPUT_DIRECTORY`.

## Variables:
COMMAND_NAME: $ARGUMENTS (first argument - the command name)
COMMAND_PURPOSE: $ARGUMENTS (second argument - what the command does)
TOOLS_NEEDED: $ARGUMENTS (third argument - required tools)
OUTPUT_TYPE: $ARGUMENTS (fourth argument - expected output format)
OUTPUT_DIRECTORY: .claude/commands/

## Instructions:

- Parse the `COMMAND_NAME`, `COMMAND_PURPOSE`, `TOOLS_NEEDED`, and `OUTPUT_TYPE` from user input
- Read @ai-docs/custom-command-template.md to understand the structured architecture
- Generate a complete command following the 6-section template structure exactly
- Use INSTRUCTIONAL language (not explanatory) throughout the command
- Save the new command to `OUTPUT_DIRECTORY` location

## Workflow:

1. Parse $ARGUMENTS to extract `COMMAND_NAME`, `COMMAND_PURPOSE`, `TOOLS_NEEDED`, and `OUTPUT_TYPE`
2. Read @ai-docs/custom-command-template.md to understand the template structure
3. Generate METADATA section with `TOOLS_NEEDED` restrictions and argument hints
4. Create COMMAND NAME section with clear description using backtick variables
5. Build VARIABLES section with both dynamic ($ARGUMENTS) and static values
6. Develop INSTRUCTIONS section referencing variables with backticks
7. Construct WORKFLOW section with numbered, specific action steps using variables
8. Define REPORT section using `OUTPUT_DIRECTORY` and other variables
9. Add RELEVANT FILES section if applicable
10. Save the new command to `OUTPUT_DIRECTORY`/`COMMAND_NAME`.md
11. Validate the command follows instructional vs explanatory patterns

## Report:

Command Created

File: `OUTPUT_DIRECTORY`/`COMMAND_NAME`.md
Topic: `COMMAND_PURPOSE` command following structured prompt architecture
Key Components:
- Metadata section with `TOOLS_NEEDED` restrictions and argument hints
- Variables section with both dynamic and static values
- Workflow section with numbered action steps using backtick variables

## Relevant Files:

- [@ai-docs/custom-command-template.md]