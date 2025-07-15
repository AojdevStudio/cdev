# Init-Protocol Improvement Guide

## Problem Statement

The `/init-protocol` command sometimes places CLAUDE.md in the wrong directory (e.g., `.claude/CLAUDE.md` instead of at the project root).

## Required Improvements

### 1. Be Explicit About Location

Add to the instructions section:

```yaml
instructions:
  - 'CRITICAL: Check if CLAUDE.md exists at the project root directory (not in subdirectories)'
  - 'CRITICAL: Create CLAUDE.md file and save it at the project root (same level as README.md)'
  - 'CRITICAL: DO NOT create CLAUDE.md in .claude/ directory or any subdirectory'
```

### 2. Add Context Checks

Add to context_gathering section:

```yaml
context_gathering:
  - name: 'CLAUDE.md Location Check'
    command: "!`find . -name 'CLAUDE.md' -not -path './.claude/*' -not -path './node_modules/*' | head -5`"
    description: 'Verify CLAUDE.md should be at project root, not in .claude/ or other subdirectories'
  - name: 'Project Root Verification'
    command: "!`test -f README.md && echo 'Project root confirmed' || echo 'Warning: May not be at project root'`"
    description: 'Verify we are at the project root by checking for README.md'
  - name: 'Misplaced CLAUDE.md Detection'
    command: "!`test -f .claude/CLAUDE.md && echo 'WARNING: CLAUDE.md found in .claude/ directory - should be at project root!' || echo 'Good: No CLAUDE.md in .claude/'`"
    description: 'Check for common mistake of placing CLAUDE.md in wrong directory'
```

### 3. Update Success Metrics

Add to success_metrics section:

```yaml
success_metrics:
  - '✅ CLAUDE.md created at project root (e.g., /path/to/project/CLAUDE.md)'
  - '✅ CLAUDE.md is NOT in .claude/ or any subdirectory'
  - '✅ File is at same directory level as README.md, package.json, etc.'
```

### 4. Add to Learning Protocol

Add to learning_protocol.common_mistakes_to_avoid:

```yaml
common_mistakes_to_avoid:
  - 'Placing CLAUDE.md in .claude/ directory instead of project root'
  - 'Creating CLAUDE.md in subdirectories instead of root'
```

Add to learning_protocol.improvement_actions:

```yaml
improvement_actions:
  - 'Always verify CLAUDE.md placement at project root before saving'
  - 'Check that CLAUDE.md is at same level as README.md'
```

### 5. Add Generation Phase

Add a new phase to generation_process:

```yaml
- phase: 6
  name: 'File Placement'
  description: 'CRITICAL: Save CLAUDE.md at project root, verify placement is correct'
```

## Implementation Steps

1. Open `.claude/commands/init-protocol.md`
2. Add the explicit location instructions
3. Add the context verification checks
4. Update the success metrics
5. Add the common mistakes to avoid
6. Test the improved command

## Testing Checklist

- [ ] Run `/init-protocol` in a fresh project
- [ ] Verify CLAUDE.md is created at project root
- [ ] Run `/init-protocol` in a project with existing `.claude/CLAUDE.md`
- [ ] Verify warning is shown about misplaced file
- [ ] Verify new CLAUDE.md is created at correct location

## Expected Behavior

When running `/init-protocol`, the command should:

1. Check if CLAUDE.md exists at project root
2. Warn if CLAUDE.md exists in wrong location (e.g., `.claude/`)
3. Always create CLAUDE.md at project root
4. Never create CLAUDE.md in subdirectories
5. Provide clear feedback about file placement

This guide ensures CLAUDE.md is always placed correctly at the project root level.
