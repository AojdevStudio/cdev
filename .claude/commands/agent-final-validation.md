---
allowed-tools: Bash, Read, Glob, Grep
description: Strict 100% validation of all parallel agent work completion and integration
---

# Agent Final Validation

This command performs an extremely strict final validation of all parallel agent work by analyzing git history, file existence, and task completion to ensure 100% integration success.

$ARGUMENTS

**Usage Examples:**
- `/agent-final-validation` - Validate all agents from the most recent deployment plan
- `/agent-final-validation TASK-123` - Validate specific task's agent work
- `/agent-final-validation --strict` - Maximum validation strictness with detailed reporting

## Instructions
- Discover all deployment plans in shared/deployment-plans/ to identify completed tasks and agents
- For each agent, extract their original task requirements: files to create/modify, validation criteria, test contracts
- Use git log and git diff to verify every required file was actually committed to main branch
- Cross-reference git commit messages to confirm agent work was properly merged
- Validate file contents against original requirements using targeted analysis
- Check that all validation criteria from agent contexts were met
- Verify all test contracts exist and are properly implemented
- Calculate completion percentages and identify any missing deliverables
- Generate comprehensive validation report with pass/fail status for each agent
- Fail validation if ANY agent has less than 100% completion
- Provide actionable remediation steps for any failures found

## Context
- Git commit history: !`git log --oneline -20 --grep="agent" --grep="TASK-" --grep="feat:" --grep="fix:"`
- Recent file changes: !`git diff --name-only HEAD~5..HEAD`
- Deployment plans: !`find shared/deployment-plans -name "*.json" -exec basename {} .json \; 2>/dev/null || echo "no-plans"`
- Current branch status: !`git status --porcelain`
- Available agent contexts: !`find . -name "agent_context.json" -o -name "*-deployment-plan.json" 2>/dev/null | head -10`
- Git worktree status: !`git worktree list 2>/dev/null || echo "no-worktrees"`
- Validation criteria format: taskId, agentId, filesToCreate[], filesToModify[], validationCriteria[], testContracts[]
- Strict validation rules: All files must exist, all commits must be merged, all criteria must be verifiable
- Pass threshold: 100% completion required - no partial credit
- Report format: JSON validation results with detailed failure analysis