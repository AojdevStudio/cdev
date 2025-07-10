---
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Task
description: Load agent workspace context and begin working on assigned tasks
---

# Agent Start

This command loads agent workspace context and begins working on assigned tasks by reading agent configuration files and systematically completing validation criteria.

**variables:**
WorkspacePath: $ARGUMENTS

**Usage Examples:**
- `/agent-start` - Load context from current directory
- `/agent-start ../workspaces/AOJ-100-backend_api_agent` - Start specific agent workspace
- `/agent-start .` - Explicitly start in current directory

## Instructions
- Parse $ARGUMENTS to determine workspace path (default to current directory)
- Load agent_context.json to understand agent role and responsibilities
- Read files_to_work_on.txt to identify files to create or modify
- Load validation_checklist.txt as the primary task tracking system
- Begin working through validation checklist items systematically
- Update checklist by changing [ ] to [x] as tasks are completed
- Create and modify files according to specifications
- Run tests as specified in test_contracts.txt if present
- Provide progress updates as work proceeds

## Context
- Agent context file: !`cat agent_context.json 2>/dev/null || echo "No agent context found"`
- Files to work on: !`cat files_to_work_on.txt 2>/dev/null || echo "No file list found"`
- Validation checklist: !`cat validation_checklist.txt 2>/dev/null || echo "No checklist found"`
- Test contracts: !`cat test_contracts.txt 2>/dev/null || echo "No test contracts"`
- Current directory: !`pwd`
- Git branch: !`git branch --show-current 2>/dev/null || echo "Not in git repo"`
- Agent role: Determined dynamically from agentRole field in context
- Focus area: Extracted from focusArea field for specialized work
- Success criteria: All validation checklist items marked complete
- Work approach: Systematic, checklist-driven development