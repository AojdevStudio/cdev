# Agent Commit & Merge Command

Commit completed agent work and merge the worktree back to main branch with comprehensive validation and safety checks.

## Variables
WORKSPACE_PATH: $ARGUMENTS[0]
CUSTOM_MESSAGE: $ARGUMENTS[1] (optional)

## Execute these tasks

**VALIDATE PREREQUISITES**

VERIFY workspace exists and is valid:
- CHECK `$WORKSPACE_PATH` directory exists
- VERIFY it's a git worktree: `git -C "$WORKSPACE_PATH" rev-parse --is-inside-work-tree`
- EXTRACT current branch: `AGENT_BRANCH=$(git -C "$WORKSPACE_PATH" rev-parse --abbrev-ref HEAD)`
- EXIT with error if not a valid git worktree
- use git -C to check status without changing the current working directory
- VERIFY you are in the main branch and directory, if not, exit with error and inform the user to run this command from the main project directory and not a worktree. 

**VALIDATE COMPLETION**

CHECK validation checklist completion:
- READ `$WORKSPACE_PATH/validation_checklist.txt`
- COUNT completed items: `COMPLETED=$(grep -c "^\s*[0-9]*\.\s*\[x\]" "$WORKSPACE_PATH/validation_checklist.txt")`
- COUNT total items: `TOTAL=$(grep -c "^\s*[0-9]*\.\s*\[[x ]\]" "$WORKSPACE_PATH/validation_checklist.txt")`
- IF counts don't match, EXIT with error: "❌ Validation incomplete: $COMPLETED/$TOTAL criteria completed"

VERIFY required files exist:
- CHECK `$WORKSPACE_PATH/agent_context.json` exists
- CHECK `$WORKSPACE_PATH/files_to_work_on.txt` exists
- VERIFY git status shows changes: `git -C "$WORKSPACE_PATH" diff --quiet HEAD || echo "Changes detected"`

**EXTRACT AGENT CONTEXT**

READ agent details from `$WORKSPACE_PATH/agent_context.json`:
- EXTRACT `agentId`, `agentRole`, `taskTitle`, `taskId`
- GET file statistics from git:
  - `FILES_CREATED=$(git -C "$WORKSPACE_PATH" diff --name-only --diff-filter=A HEAD~1 | wc -l)`
  - `FILES_MODIFIED=$(git -C "$WORKSPACE_PATH" diff --name-only --diff-filter=M HEAD~1 | wc -l)`
  - `FILES_DELETED=$(git -C "$WORKSPACE_PATH" diff --name-only --diff-filter=D HEAD~1 | wc -l)`

**SAFETY CHECKS**

VERIFY main branch is clean:
- STASH any uncommitted changes in main: `git stash push -m "Auto-stash before agent merge"`
- CHECK main branch status: `git status --porcelain`
- PULL latest changes: `git pull origin main`

CHECK for potential conflicts:
- PREVIEW merge: `git merge-tree $(git merge-base main "$AGENT_BRANCH") main "$AGENT_BRANCH"`
- WARN if conflicts detected but continue (user can resolve)

**GENERATE COMMIT MESSAGE**

CREATE structured commit message (unless custom provided):
```
feat(${agentId}): ${taskTitle}

Completed validation criteria:
${completedValidationCriteria}

- Agent: ${agentRole}  
- Files: ${filesCreated} created, ${filesModified} modified, ${filesDeleted} deleted
- Task: ${taskId}
- Branch: ${agentBranch}

🤖 Generated with AOJDevStudio
Co-Authored-By: Claude <noreply@anthropic.com>
```

USE custom message if provided:
- IF `$CUSTOM_MESSAGE` is not empty, use it instead of generated message
- APPEND AOJDevStudio signature to custom messages

**EXECUTE GIT OPERATIONS**

SWITCH to agent worktree:
- RUN `cd "$WORKSPACE_PATH"`

STAGE and commit changes:
- RUN `git add .`
- RUN `git commit -m "$FINAL_MESSAGE" --no-edit`
- CAPTURE commit hash: `COMMIT_HASH=$(git rev-parse HEAD)`

**RUN OPTIONAL TESTS**

IF package.json exists in workspace:
- RUN `npm test` or configured test command
- IF tests fail, offer option to continue or abort
- RECORD test results in commit message

**MERGE TO MAIN**

SWITCH to main branch:
- RUN `git checkout main`
- ENSURE we're on main: `git symbolic-ref HEAD refs/heads/main`

MERGE agent work:
- RUN `git merge "$AGENT_BRANCH" --no-ff --no-edit -m "Merge agent work: $agentRole"`
- IF merge fails:
  - RUN `git reset --hard HEAD~1`
  - RUN `git worktree add "$WORKSPACE_PATH" "$AGENT_BRANCH"`
  - EXIT with error: "❌ Merge failed. Worktree restored for conflict resolution."

SKIP remote push:
- LOCAL merge only - no automatic push to remote
- USER can manually push when ready: `git push origin main`

**UPDATE COORDINATION**

UPDATE agent status in coordination file:
- READ `../paralell-development-claude-work-trees/coordination/parallel-agent-status.json`
- MARK agent as "completed" with timestamp
- UPDATE `completedAt` field
- WRITE back to coordination file

**CLEANUP WORKTREE**

REMOVE worktree directory:
- RUN `git worktree remove "$WORKSPACE_PATH" --force`

DELETE agent branch:
- RUN `git branch -d "$AGENT_BRANCH"`
- IF branch not fully merged, use `-D` flag

**PROVIDE COMPLETION SUMMARY**

OUTPUT detailed success message:
```
✅ Agent Commit Complete
  ${agentRole} work has been successfully completed and committed!
  
  📋 Validation Results
  - All ${validationCount} validation criteria completed ✅
  - Git operations completed successfully ✅
  - No conflicts detected ✅
  
  🎯 Delivered Features
  - ${taskTitle}
  
  💾 Git Operations
  - Branch: ${agentBranch}
  - Commit: ${commitHash}
  - Status: Successfully merged to main branch
  - Remote: Ready to push (manual step required)
  
  📊 File Changes
  - Created: ${filesCreated} files
  - Modified: ${filesModified} files  
  - Deleted: ${filesDeleted} files
  
  🔄 Integration Status
  The agent work is complete and integrated into main branch.
  Other agents depending on this work can now proceed.
  
  📤 Next Steps
  To share your changes: git push origin main
  
  🚀 The ${agentRole} has successfully completed its mission!
```

**ERROR HANDLING**

FOR any step failure:
- CAPTURE error message and step
- PROVIDE recovery instructions
- PRESERVE agent worktree for manual fixes
- SUGGEST next steps for resolution

**ROLLBACK CAPABILITY**

IF --rollback flag provided:
- FIND last agent merge commit
- RUN `git reset --hard HEAD~1`
- RECREATE agent worktree
- RESTORE agent branch

**USAGE EXAMPLES**
```bash
# Standard commit with auto-generated message
claude /project:agent-commit workspaces/AOJ-100-infrastructure_validation_agent

# Custom commit message
claude /project:agent-commit workspaces/AOJ-100-backend_api_agent "feat: custom backend integration"

# Dry run (validate only, no commit)
claude /project:agent-commit workspaces/AOJ-100-custom_feature_agent --dry-run

# Rollback previous agent commit
claude /project:agent-commit --rollback AOJ-100-infrastructure_validation_agent
```

**DEPENDENCY AWARENESS**

CHECK other agents waiting for this completion:
- READ coordination file for dependent agents
- NOTIFY about agents that can now start
- SUGGEST optimal next agent to work on
- PROVIDE agent startup commands for ready agents