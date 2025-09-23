---
allowed-tools: Bash, Read, Write, Task
description: Execute HYBRID commit strategy balancing parallel analysis with sequential execution
argument-hint: [Optional commit options like --no-verify or custom message]
---

# Commit Hybrid Mode

Balanced commit strategy for codebases with moderate formatting hooks that require some coordination but allow for parallel analysis. Uses multiple git-flow-manager subagents for analysis phase, then single coordinator for sequential execution to minimize hook conflicts while maintaining efficiency.

**🤖 Sub-Agent Integration:** This command leverages multiple `git-flow-manager` sub-agents for parallel analysis with coordinated sequential execution.

## Variables:
COMMIT_OPTIONS: $ARGUMENTS
HOOK_TYPE: moderate-formatting
COMMIT_APPROACH: parallel-analysis-sequential-execution
ANALYSIS_SUBAGENTS: auto-calculated
COORDINATOR_SUBAGENT: 1

## Instructions:

- Parse `COMMIT_OPTIONS` to extract flags like `--no-verify` or custom messages
- Deploy multiple `git-flow-manager` subagents for parallel change analysis
- Each subagent analyzes assigned file groups and prepares commit metadata
- Single coordinator subagent executes commits sequentially based on analysis
- Execute commits in dependency order to minimize formatting hook conflicts
- Push all commits to remote repository after successful completion

## Workflow:

### Phase 1: Parallel Analysis
1. Run `git status --porcelain` to confirm hybrid strategy environment
2. Execute `git diff --staged --name-status` to analyze staged changes
3. Calculate `ANALYSIS_SUBAGENTS` based on logical change groupings
4. Deploy multiple `git-flow-manager` subagents for parallel analysis

### Phase 2: Analysis Coordination
5. Assign each analysis subagent specific file groups:
   - **Subagent 1**: Core functionality changes (models, services, utils)
   - **Subagent 2**: Interface changes (components, API endpoints, views)
   - **Subagent 3**: Supporting changes (tests, docs, configs)
6. Each subagent analyzes assigned files and prepares:
   - Commit message content for their scope
   - File staging recommendations
   - Dependency order suggestions
   - Hook conflict risk assessment

### Phase 3: Sequential Execution
7. Deploy single coordinator `git-flow-manager` subagent
8. Coordinator reviews all analysis results and creates execution plan
9. Execute commits in optimal order based on:
   - Logical dependencies between changes
   - Hook conflict minimization
   - Conventional commit message quality
10. Each commit follows format: `<emoji> <type>(<scope>): <description>`

### Phase 4: Validation
11. Validate all commits completed successfully using `git log --oneline`
12. Execute `git push` to push all commits to remote repository
13. Verify push completion with `git status`
14. Display hybrid strategy summary with commit breakdown

## Commit Execution Order:

**Priority 1 - Foundation Changes:**
- Database schema and migrations
- Core model updates
- Utility function modifications

**Priority 2 - Interface Changes:**
- API endpoint modifications
- Component updates
- Frontend routing changes

**Priority 3 - Supporting Changes:**
- Test updates and additions
- Documentation updates
- Configuration changes

## Report:

Hybrid Commit Complete

Strategy: HYBRID (moderate formatting hooks detected)
Approach: Parallel analysis with sequential execution
Analysis Phase: `ANALYSIS_SUBAGENTS` subagents analyzed changes in parallel
Execution Phase: 1 coordinator executed `COMMIT_COUNT` commits sequentially
Files: All staged changes committed with optimal ordering
Topic: Balanced approach minimizing hook conflicts while maintaining efficiency
Key Components:
- Parallel analysis for faster processing
- Sequential execution preventing hook conflicts
- Dependency-aware commit ordering
- Conventional commit messages with appropriate emoji
- Clean execution with minimal recovery needs
- Hook-aware timing reducing formatting conflicts