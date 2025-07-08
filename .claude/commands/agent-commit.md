# Agent Commit & Merge Command

Commit agent work and merge the worktree back to main branch.

Parse the agent context from $ARGUMENTS (workspace path) to:

1. **Validate Completion**: Check validation_checklist.txt - ensure all items marked [x]
2. **Verify Files**: Confirm all files from files_to_work_on.txt were created/modified
3. **Generate Commit**: Auto-create commit message from agent context if none provided
4. **Git Operations**: Add all changes, commit, switch to main, merge, and push
5. **Cleanup**: Remove worktree directory and provide completion summary

## Context Files Used
- @workspaces/*/agent_context.json - Extract agent info and task details
- @workspaces/*/validation_checklist.txt - Verify completion status
- @workspaces/*/files_to_work_on.txt - Confirm file changes

## Git Commands Executed
```bash
git add .
git commit -m "$GENERATED_MESSAGE"
git checkout main
git pull origin main
git merge $AGENT_BRANCH --no-ff
git push origin main
git worktree remove $WORKTREE_PATH
git branch -d $AGENT_BRANCH
```

## Auto-Generated Commit Format
```
feat(${agentId}): ${taskTitle}

- ${completedValidationCriteria}
- Agent: ${agentRole}
- Files: ${filesCreated.length} created, ${filesModified.length} modified
- Task: ${taskId}

🤖 Generated with AOJDevStudio 
Co-Authored-By: Claude <noreply@anthropic.com>
```

Usage: `/agent-commit [workspace-path] [custom-message]`
