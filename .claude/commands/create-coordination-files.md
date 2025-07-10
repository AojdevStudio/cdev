---
allowed-tools: Read, Write, Bash, Edit
description: Generate coordination files for parallel workflow integration
---

# Create Coordination Files

This command generates integration coordination files for parallel development workflow compatibility by creating status files, deployment plans, and completion reports.

**variables:**
AgentWorkspace: $ARGUMENTS

**Usage Examples:**
- `/create-coordination-files workspaces/AOJ-100-backend_api_agent` - Generate coordination for specific agent
- `/create-coordination-files ./` - Use current directory as agent workspace
- `/create-coordination-files ../agent-workspace` - Generate from relative path

## Instructions
- Parse $ARGUMENTS to extract agent workspace path
- Validate workspace contains required files (agent_context.json, validation_checklist.txt)
- Extract agent metadata including ID, role, task information
- Calculate validation completion percentage from checklist
- Create coordination directory structure if missing
- Generate validation-status.json with completion metrics
- Generate integration-status.json for workflow compatibility
- Create deployment plan JSON for integration scripts
- Preserve agent workspace in workspaces directory
- Generate markdown completion report with summary

## Context
- Agent context: !`cat agent_context.json 2>/dev/null || echo "{}"`
- Validation status: !`grep -c "\[x\]" validation_checklist.txt 2>/dev/null || echo "0"`
- Total criteria: !`grep -c "\[.\]" validation_checklist.txt 2>/dev/null || echo "0"`
- Current branch: !`git branch --show-current`
- Coordination directory: shared/coordination/
- Deployment plans: shared/deployment-plans/
- Reports directory: shared/reports/
- Required files: agent_context.json, validation_checklist.txt, files_to_work_on.txt
- Output format: JSON status files, deployment plan, markdown report
- Integration compatibility: Supports parallel workflow scripts