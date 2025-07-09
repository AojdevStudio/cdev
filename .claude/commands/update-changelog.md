---
allowed-tools: Read, Write, Bash
description: Add new entries to project CHANGELOG.md following Keep a Changelog format
---

# Update Changelog

This command adds a new entry to the project's CHANGELOG.md file following Keep a Changelog conventions and Semantic Versioning standards.

$ARGUMENTS

**Usage Examples:**
- `/update-changelog` - Analyze git history and automatically generate changelog entries
- `/update-changelog 1.1.0 added "New user authentication system"`
- `/update-changelog 1.0.2 fixed "Bug in file upload causing timeout errors"`
- `/update-changelog 2.0.0 removed "Deprecated legacy API endpoints"`

## Instructions
- If no arguments provided: analyze git history and suggest changelog entries automatically
- If arguments provided: parse $ARGUMENTS to extract version, change_type, and message
- Check if CHANGELOG.md exists in project root
- If CHANGELOG.md doesn't exist: create new file with Keep a Changelog standard header and structure
- Analyze recent git commits to understand what changes have been made since last release/tag
- For new changelog: start with version 0.1.0 or 1.0.0 based on project maturity
- Categorize git commit messages into appropriate change types (Added, Changed, Fixed, etc.)
- If CHANGELOG.md exists: read current content and parse existing structure
- Look for existing version section or create new version section with today's date
- Add entries under appropriate change types based on git analysis or provided arguments
- Format according to Keep a Changelog conventions with proper markdown structure
- Write updated content back to CHANGELOG.md
- Suggest committing changes and updating project version files if this is a new version

## Context
- Current CHANGELOG: @CHANGELOG.md
- Project structure: !`find . -name "package.json" -o -name "pyproject.toml" -o -name "Cargo.toml" -o -name "go.mod" -o -name "pom.xml" | head -5`
- Git status: !`git status --porcelain | head -10`
- Recent commits: !`git log --oneline -20`
- Git tags: !`git tag --sort=-version:refname | head -10`
- Last release: !`git describe --tags --abbrev=0 2>/dev/null || echo "No tags found"`
- Commits since last tag: !`git rev-list $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline 2>/dev/null || git log --oneline`
- File changes: !`git diff --name-status HEAD~10..HEAD | head -10`
- Keep a Changelog format: https://keepachangelog.com/en/1.1.0/
- Semantic Versioning: https://semver.org/
- Change types: Added, Changed, Deprecated, Removed, Fixed, Security
- Version format: MAJOR.MINOR.PATCH (e.g., 1.2.3)
- Entry format: `- Description of change [#issue-number]`
- Commit keywords: feat/add (Added), fix (Fixed), refactor (Changed), remove/delete (Removed), deprecate (Deprecated), security (Security)