---
allowed-tools: Bash, Read, Write, Task
description: Intelligent commits with hook-aware strategy detection
argument-hint: [Optional: --no-verify or custom message]
---

# Commit

Use the git-flow-manager sub-agent to intelligently analyze staging area and project formatting hooks, then execute optimal commit strategy (PARALLEL/COORDINATED/HYBRID) to prevent conflicts while maintaining commit organization. Parse `$ARGUMENTS` for commit options, run pre-commit checks, analyze changes for atomic splitting, and execute commits with conventional messages.

## Variables:
COMMIT_OPTIONS: $ARGUMENTS
STRATEGY_MODE: auto-detected
COMMIT_COUNT: auto-calculated
HOOK_ANALYSIS: auto-performed

## Instructions:

- Parse `COMMIT_OPTIONS` to extract flags like `--no-verify` or custom messages
- Use the git-flow-manager sub-agent for comprehensive workflow management with automatic strategy detection
- Auto-detect formatting hook aggressiveness and choose optimal commit strategy
- Run pre-commit checks unless `--no-verify` flag is present
- Validate `.gitignore` configuration and alert for large files (>1MB)
- Auto-stage modified files if none staged, analyze changes for atomic splitting
- Execute commits using detected strategy with conventional messages and emoji
- Include issue references for GitHub/Linear integration when applicable
- **CRITICAL**: Output the final report using the EXACT template format in the Report section, replacing placeholder variables with actual values

## Workflow:

1. Deploy git-flow-manager sub-agent with strategy detection capabilities
2. Run `!git status --porcelain` to analyze current repository state
3. Execute formatting hook analysis to determine optimal commit strategy
4. Check for `--no-verify` flag in `COMMIT_OPTIONS`, skip pre-commit checks if present
5. Run pre-commit validation: `!pnpm lint`, `!pnpm build`, `!pnpm generate:docs`
6. Validate `.gitignore` configuration and check for large files
7. Auto-stage files with `!git add .` if no files currently staged
8. Execute `!git diff --staged --name-status` to analyze staged changes
9. Analyze changes for atomic commit splitting opportunities
10. Execute commits using detected strategy (PARALLEL/COORDINATED/HYBRID)
11. Generate conventional commit messages with appropriate emoji from @ai-docs/emoji-commit-ref.yaml
12. Include issue references in commit body for automatic linking
13. Execute `!git commit` with generated messages
14. Display commit summary using `!git log --oneline -1`
15. **Generate final report using the EXACT template format, replacing `STRATEGY_MODE` with the actual strategy (PARALLEL/COORDINATED/HYBRID) and `COMMIT_COUNT` with the number of commits created**

## Report Template (MUST USE THIS EXACT FORMAT):

**IMPORTANT**: The git-flow-manager agent MUST output the following report format, replacing the placeholder variables with actual values:

Intelligent Commit Complete

Strategy: `STRATEGY_MODE` (replace with: PARALLEL, COORDINATED, or HYBRID)
Files: `COMMIT_COUNT` (replace with: actual number of commits created)
Topic: Hook-aware commit processing with adaptive strategy selection
Key Components:
- Automatic strategy detection preventing formatting hook conflicts
- Conventional commit messages with appropriate emoji
- Pre-commit validation and quality gates
- Atomic commit splitting for logical organization
- GitHub/Linear issue integration
- Clean working directory achieved without conflicts

**Note to Agent**: This is a REQUIRED output template. You must replace `STRATEGY_MODE` with the actual strategy used and `COMMIT_COUNT` with the actual number of commits created.

## Relevant Files:

- @~/.claude/agents/git-flow-manager.md
- @ai-docs/emoji-commit-ref.yaml
