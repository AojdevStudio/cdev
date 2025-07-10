---
allowed-tools: Bash, Read, Write
description: Create well-formatted commits with conventional messages and emoji
---

# Commit

This command creates well-formatted Git commits using conventional commit messages with emoji, automated quality checks, and intelligent change analysis.

$ARGUMENTS

**Usage Examples:**
- `/commit` - Full commit workflow with pre-commit checks
- `/commit --no-verify` - Skip pre-commit checks and commit directly
- `/commit "fix: resolve authentication bug"` - Commit with specific message

## Instructions
- Check if `--no-verify` flag is present in $ARGUMENTS
- If not no-verify: run pre-commit checks (`pnpm lint`, `pnpm build`, `pnpm generate:docs`)
- **Ensure logs are ignored**: Check if `logs/` is in `.gitignore`; if not, add it to prevent hook conflicts
- Check git status to see staged files
- If no files staged: automatically stage all modified and new files with `git add .` (excluding cache files, .DS_Store, and other ignore patterns)
- Perform `git diff --staged` to analyze changes being committed
- Analyze diff to determine if multiple distinct logical changes are present
- If multiple changes detected: suggest splitting into separate atomic commits
- For multiple commits: use sub-agents in parallel to handle each commit simultaneously
- For each commit: determine appropriate conventional commit type and emoji based on changes
- Create commit message using format: `<emoji> <type>: <description>`
- Execute git commit with generated message
- Show commit summary with `git log --oneline -1`

## Guidelines for Splitting Commits

When analyzing the diff, consider splitting commits based on these criteria:

1. **Different concerns**: Changes to unrelated parts of the codebase
2. **Different types of changes**: Mixing features, fixes, refactoring, etc.
3. **File patterns**: Changes to different types of files (e.g., source code vs documentation)
4. **Logical grouping**: Changes that would be easier to understand or review separately
5. **Size**: Very large changes that would be clearer if broken down

## Context
- Current git status: !`git status --porcelain`
- Staged changes: !`git diff --staged --name-status`
- Recent commits: !`git log --oneline -5`
- Branch info: !`git branch --show-current`
- Exclude from staging: cache files, .DS_Store, node_modules, .env files, build artifacts, temporary files
- **Emoji**: Each commit type is paired with an appropriate emoji:
    - Read: '@ai-docs/emoji-commit-ref.md'

## Examples

Good commit messages:
- ✨ feat: add user authentication system
- 🐛 fix: resolve memory leak in rendering process
- 📝 docs: update API documentation with new endpoints
- ♻️ refactor: simplify error handling logic in parser
- 🚨 fix: resolve linter warnings in component files
- 🧑‍💻 chore: improve developer tooling setup process
- 👔 feat: implement business logic for transaction validation
- 🩹 fix: address minor styling inconsistency in header
- 🚑️ fix: patch critical security vulnerability in auth flow
- 🎨 style: reorganize component structure for better readability
- 🔥 fix: remove deprecated legacy code
- 🦺 feat: add input validation for user registration form
- 💚 fix: resolve failing CI pipeline tests
- 📈 feat: implement analytics tracking for user engagement
- 🔒️ fix: strengthen authentication password requirements
- ♿️ feat: improve form accessibility for screen readers

Example of splitting commits:
- First commit: ✨ feat: add new solc version type definitions
- Second commit: 📝 docs: update documentation for new solc versions
- Third commit: 🔧 chore: update package.json dependencies
- Fourth commit: 🏷️ feat: add type definitions for new API endpoints
- Fifth commit: 🧵 feat: improve concurrency handling in worker threads
- Sixth commit: 🚨 fix: resolve linting issues in new code
- Seventh commit: ✅ test: add unit tests for new solc version features
- Eighth commit: 🔒️ fix: update dependencies with security vulnerabilities