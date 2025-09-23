---
allowed-tools: Bash, Read, Write, Task
description: Execute COORDINATED commit strategy for aggressive formatting hook environments
argument-hint: [Optional commit options like --no-verify or custom message]
---

# Commit Coordinated Mode

Specialized commit strategy for codebases with aggressive formatting hooks (prettier --write ., eslint --fix ., biome format ., etc.) that modify files across the entire staging area. Uses single git-flow-manager to create one well-structured commit with logical message sections, avoiding hook conflicts while maintaining organization.

**🤖 Sub-Agent Integration:** This command uses a single `git-flow-manager` sub-agent optimized for handling aggressive formatting environments.

## Variables:
COMMIT_OPTIONS: $ARGUMENTS
HOOK_TYPE: aggressive-formatting
COMMIT_APPROACH: single-structured
MESSAGE_FORMAT: sectioned-conventional

## Instructions:

- Parse `COMMIT_OPTIONS` to extract flags like `--no-verify` or custom messages
- Deploy single `git-flow-manager` subagent to handle entire staging area
- Analyze all staged changes for logical grouping within single commit
- Create structured commit message with clear sections for different change types
- Execute single commit to avoid formatting hook conflicts and file lock issues
- Push commit to remote repository after successful completion

## Workflow:

### Pre-Commit Analysis:
1. Run `git status --porcelain` to confirm aggressive formatting environment detected
2. Execute `git diff --staged --name-status` to analyze all staged changes
3. Log coordinated strategy selection reasoning

### Change Organization:
4. Group staged changes by logical categories:
   - **Authentication**: Auth-related files and logic
   - **Database**: Schema, models, migrations
   - **Frontend**: UI components and styling
   - **Backend**: API endpoints and services
   - **Tests**: Test files and test utilities
   - **Documentation**: README, docs, comments
   - **Configuration**: Config files, dependencies

### Commit Execution:
5. Deploy single `git-flow-manager` subagent with coordinated mode
6. Create structured commit message following format:
   ```
   🔧 feat: multi-component feature implementation

   - Authentication: JWT token implementation and validation
   - Database: User model schema with migration scripts
   - Frontend: Login component with responsive styling
   - Tests: Unit tests for auth flow and edge cases
   - Documentation: API documentation updates
   ```
7. Execute single commit with conventional format and appropriate emoji
8. Allow formatting hooks to run once on complete changeset
9. Validate commit completed successfully

### Completion:
10. Execute `git push` to push commit to remote repository
11. Verify push completion with `git status`
12. Display coordinated strategy summary with logical groupings

## Report:

Coordinated Commit Complete

Strategy: COORDINATED (aggressive formatting hooks detected)
Approach: Single structured commit with logical message sections
Files: All staged changes committed in one operation
Topic: Hook-aware commit execution preventing formatting conflicts
Key Components:
- Single commit avoiding hook-induced file conflicts
- Structured message with clear logical groupings
- Conventional format with appropriate emoji
- Clean execution without sequential recovery needs
- Formatting hooks run once on complete changeset