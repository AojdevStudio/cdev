---
allowed-tools: Bash, Read, Write, Task
description: Create intelligent parallel git commits using multiple git-flow-manager subagents
argument-hint: [Optional commit options like --no-verify or custom message]
---

# Commit 2.0

Analyze staging area to determine optimal commit strategy, then deploy multiple `git-flow-manager` subagents in parallel to create atomic commits efficiently. Parse `COMMIT_OPTIONS` for flags, analyze changes for commit splitting opportunities, and coordinate parallel subagent execution for faster commit processing.

**🤖 Sub-Agent Integration:** This command leverages multiple `git-flow-manager` sub-agents working in parallel for optimal git workflow management and atomic commit generation.

## Variables:
COMMIT_OPTIONS: $ARGUMENTS
PARALLEL_STRATEGY: auto-detected
COMMIT_COUNT: auto-calculated
SUBAGENT_COUNT: auto-determined

## Instructions:

- Parse `COMMIT_OPTIONS` to extract flags like `--no-verify` or custom messages
- Analyze `git status` and `git diff --staged` to determine optimal commit splitting strategy
- Calculate `COMMIT_COUNT` based on logical change groupings
- Deploy `SUBAGENT_COUNT` git-flow-manager subagents equal to `COMMIT_COUNT` for parallel execution
- Coordinate subagent execution to ensure proper commit order and dependencies
- Push all commits to remote repository after successful local commit completion

## Workflow:

1. Run `git status --porcelain` to analyze current repository state
2. Execute `git diff --staged --name-status` to examine staged changes
3. Analyze changes using commit splitting guidelines to determine `COMMIT_COUNT`
4. Calculate `SUBAGENT_COUNT` equal to `COMMIT_COUNT` for parallel processing
5. Deploy multiple `git-flow-manager` subagents using Task tool with parallel execution
6. Assign each subagent specific file groups and commit scope based on logical separation
7. Coordinate subagent execution to ensure atomic commits with proper conventional messaging
8. Monitor parallel subagent progress and handle any conflicts or dependencies
9. Execute commits in proper order with each subagent handling its assigned scope
10. Validate all commits completed successfully using `git log --oneline`
11. Execute `git push` to push all commits to remote repository
12. Verify push completion with `git status` to confirm remote sync
13. Display summary of all commits created and pushed with conventional messages and emoji

## Report:

Parallel Commit 2.0 Complete

Files: Multiple atomic commits created and pushed to remote
Topic: Intelligent parallel git commit and push processing with `SUBAGENT_COUNT` git-flow-manager subagents
Key Components:
- `COMMIT_COUNT` atomic commits created simultaneously
- All commits pushed to remote repository
- Conventional commit messages with appropriate emoji
- Parallel subagent coordination for faster processing
- Proper commit splitting based on logical change groupings