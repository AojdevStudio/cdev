# Custom Claude Code Slash Command Template

This document defines the standard structure and patterns for creating custom Claude Code slash commands based on the established `prime.md` pattern.

## Command Structure

All custom slash commands should follow this exact 6-part structure:

### 1. YAML Frontmatter
```yaml
---
allowed-tools: Tool1, Tool2, Tool3
description: Brief one-line description of what the command does
---
```

**Guidelines:**
- List only the tools the command actually needs
- Keep description under 80 characters
- Use action verbs (analyze, convert, generate, etc.)

### 2. Main Heading
```markdown
# Command Name
```

**Guidelines:**
- Use title case
- Keep it concise (1-3 words)
- Match the filename (without .md extension)

### 3. Brief Description
```markdown
This command [does what] by [how it works] for [purpose/benefit].
```

**Guidelines:**
- Single sentence explaining the command
- Focus on the "what" and "why"
- Mention key technologies/patterns if relevant

### 4. Arguments Section
```markdown
**variables:**
[VariableName]: $ARGUMENTS

**Usage Examples:**
- `/command` - Default behavior with no arguments  
- `/command value1` - Behavior with first argument
- `/command value1 "value with spaces"` - Multiple arguments example
```

**Guidelines:**
- Replace `[VariableName]` with a descriptive name for your argument type:
  - `Query` for search commands
  - `FilePath` for file operations
  - `Topic` for documentation/help commands
  - `ToolName` for tool-specific commands
  - `IssueId` for issue tracking
  - `Pattern` for matching/filtering
  - Or any other descriptive name that fits your command
- Some commands may not need arguments - in that case, omit the variables section
- Provide clear usage examples showing different argument patterns
- Reference `$ARGUMENTS` in instructions to process the user input
- Keep it simple and flexible

### 5. Instructions Section
```markdown
## Instructions
- [Step 1: What to do first]
- [Step 2: How to process/analyze]
- [Step 3: What to generate/create]
- [Step 4: Where to save/output]
- [Step 5: What to provide as summary]
```

**Guidelines:**
- Use bullet points for clarity
- Start each bullet with an action verb
- Keep steps logical and sequential
- Be specific about inputs and outputs

### 6. Context Section
```markdown
## Context
- Current state: !`command to check current state`
- Input files: @file1.md, @file2.md
- Reference docs: @path/to/documentation.md
- Key concepts: concept1 (explanation), concept2 (explanation)
- Important values: value1, value2, value3
```

**Guidelines:**
- Use `!` commands for dynamic data gathering
- Use `@` references for file includes
- Include inline reference info to avoid external dependencies
- Group related context items together
- Keep explanations concise (parenthetical notes)

## Template Example

```markdown
---
allowed-tools: Read, Write, Bash
description: Convert project rules to executable hooks using modern patterns
---

# Rule to Hook

This command converts natural language project rules into Claude Code hook configurations, leveraging modern uv scripting patterns for sophisticated implementations.

**variables:**
RuleText: $ARGUMENTS

**Usage Examples:**
- `/rule2hook` - Convert all rules from CLAUDE.md files
- `/rule2hook PreToolUse "validate bash commands for security"` - Create specific PreToolUse hook
- `/rule2hook PostToolUse "format code after file changes"` - Create PostToolUse hook

## Instructions
- If arguments provided: use $ARGUMENTS to get hook_event and rule_text
- If no arguments: read and analyze project CLAUDE.md files
- Determine appropriate hook events and tool matchers based on rule keywords
- Generate hook configurations using jq for simple cases, uv scripts for complex logic
- Create complete JSON configuration and save to `~/.claude/hooks.json`
- Provide implementation summary with usage examples

## Context
- Current hooks configuration: !`cat ~/.claude/hooks.json 2>/dev/null || echo "{}"`
- Project rules: @CLAUDE.md
- Local project rules: @CLAUDE.local.md  
- User rules: @~/.claude/CLAUDE.md
- Hook documentation: @ai_docs/claude-code-hooks-documentation.md
- uv scripting patterns: @ai_docs/astral-uv-scripting-documentation.md
- Hook events: PreToolUse (before, can block), PostToolUse (after), Stop (end), Notification (alerts)
- Common matchers: Bash, Write|Edit|MultiEdit, Read, WebFetch|WebSearch, .*
- Exit codes: 0 (continue), 2 (block execution), other (log error)
```

## Key Patterns

### Dynamic Data Gathering
- Use `!` commands to get current system state
- Handle missing files gracefully with `2>/dev/null || echo "default"`
- Prefer commands that provide structured output

### File References
- Use `@` for file includes that provide context
- Reference project files relatively when possible
- Include both local and user-level configuration files

### Inline Reference
- Include essential reference information directly in context
- Use parenthetical explanations for clarity
- Avoid external documentation dependencies
- Keep reference data concise but complete

### Action-Oriented Language
- Use imperative verbs in instructions
- Be specific about inputs and outputs
- Focus on the process, not just the outcome

## Best Practices

1. **Self-Contained**: Command should work without external documentation
2. **Consistent**: Follow the 5-part structure exactly
3. **Actionable**: Clear steps that can be executed
4. **Contextual**: Include all necessary reference information
5. **Concise**: Every line should serve a purpose

## Usage

When creating a new custom command:
1. Copy this template
2. Fill in the 5 sections following the guidelines
3. Test that all `!` commands work in the target environment
4. Verify all `@` file references exist
5. Save to `.claude/commands/[name].md`

This template ensures consistent, reliable, and maintainable custom slash commands across all projects.