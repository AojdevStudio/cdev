---
allowed-tools: Task, Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(find:*), Bash(ls:*)
description: Update existing documentation in docs/ directory based on uncommitted or recent code changes
argument-hint: [--depth 5|10|20] [--focus api|config|usage|architecture] [--uncommitted]
flags:
  --depth: Number of commits to analyze for changes (default: 10)
  --focus: Specific documentation area to prioritize (default: all)
  --uncommitted: Only analyze uncommitted changes (working directory and staged)
---

# Update Docs

Use the doc-curator subagent to surgically update existing documentation in the `docs/` directory based on recent code changes. This command focuses on intelligent, incremental updates to keep documentation synchronized with code changes.

## Variables

DOCS_DIR: docs
COMMIT_DEPTH: {{if flags.depth}}{{flags.depth}}{{else}}10{{endif}}
FOCUS_AREA: {{if flags.focus}}{{flags.focus}}{{else}}all{{endif}}
ANALYZE_MODE: {{if flags.uncommitted}}uncommitted{{else}}all{{endif}}

## Workflow

### 1. Quick Documentation Inventory
- Check docs directory exists: !`ls docs/ 2>/dev/null | head -5`
- List existing documentation files: !`find docs/ -type f -name "*.md" -o -name "*.rst" -o -name "*.txt" | sort`

### 2. Identify What Changed

#### Check for uncommitted changes first:
- Working directory changes: !`git status --short | head -20`
- Unstaged modifications: !`git diff --stat | head -15`
- Staged changes: !`git diff --cached --stat | head -15`
- Show uncommitted function changes: !`git diff --function-context | grep -E "^@@|^\+\+\+|function|class|def|interface" | head -30`

#### If no uncommitted changes, analyze recent commits:
- Get recent commits: !`git log --oneline -COMMIT_DEPTH --name-status | grep -E "^[AM]" | head -20`
- Show committed changes: !`git diff HEAD~COMMIT_DEPTH --stat | head -15`
- Identify committed function changes: !`git diff HEAD~COMMIT_DEPTH --function-context | grep -E "^@@|^\+\+\+|function|class|def|interface" | head -30`

### 3. Launch Doc-Curator for Surgical Updates

Use the doc-curator subagent with specific instructions based on FOCUS_AREA:

```
Analyze these code changes (both uncommitted and recent commits) and update ONLY the affected sections in existing documentation:

Uncommitted changes:
- [Output from git diff for working directory]
- [Output from git diff --cached for staged changes]

Recent committed changes (if analyzing history):
- [Output from git diff HEAD~COMMIT_DEPTH]
- [Specific functions/APIs that changed]

Documentation focus: FOCUS_AREA
Target directory: docs/

Instructions:
1. Read existing documentation files in docs/
2. Identify which docs reference the changed code
3. Make surgical updates ONLY where needed:
   - Update function signatures if they changed
   - Update configuration options if modified
   - Update API endpoints if altered
   - Update example code if it's now incorrect
   - Add brief notes for new features
   - Mark deprecated features
4. Preserve all other content exactly as is
5. Do NOT rewrite entire sections unless absolutely necessary
6. Focus on accuracy over comprehensive rewrites
```

### 4. Types of Surgical Updates

#### For API Changes (focus: api)
- Update endpoint paths if renamed
- Update request/response formats if changed
- Update parameter descriptions if modified
- Add new endpoints to existing lists
- Mark deprecated endpoints

#### For Configuration Changes (focus: config)
- Update environment variable names
- Update default values if changed
- Add new configuration options
- Remove obsolete settings
- Update example configurations

#### For Usage Changes (focus: usage)
- Update command-line examples
- Fix code snippets that no longer work
- Update import statements if paths changed
- Adjust setup instructions if process changed

#### For Architecture Changes (focus: architecture)
- Update component diagrams if structure changed
- Revise data flow descriptions
- Update dependency lists
- Adjust system requirements

## Report

Documentation Synchronization Complete

Directory: `DOCS_DIR`
Commits Analyzed: COMMIT_DEPTH
Focus Area: FOCUS_AREA

Surgical Updates Applied:
- [List of specific sections updated]
- [Line-by-line changes made]
- [New content added where needed]

Update Summary:
- Files Modified: [count and list]
- Sections Updated: [specific sections touched]
- Code Examples Fixed: [count]
- Configuration Updates: [count]
- API Changes Reflected: [count]

## Examples of Surgical Updates

**Function Signature Change:**
```diff
- `processData(input: string): void`
+ `processData(input: string, options?: ProcessOptions): Promise<void>`
```

**Configuration Update:**
```diff
- `API_TIMEOUT`: 5000 (milliseconds)
+ `API_TIMEOUT`: 10000 (milliseconds, increased for stability)
```

**Deprecated Feature:**
```diff
+ **Deprecated:** The `oldMethod()` function is deprecated as of v2.0. Use `newMethod()` instead.
```
