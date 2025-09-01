---
allowed-tools: Task, Read, Glob, Bash
description: Intelligently select and use appropriate sub-agent based on task requirements
---

# Use Agent

Analyze $ARGUMENTS to determine the most appropriate sub-agent from the .claude/agents directory and use it to handle the specified task.

$ARGUMENTS: [task description or agent:task format]

## Instructions - IMPORTANT: YOU MUST FOLLOW THESE INSTRUCTIONS EXACTLY IN THIS ORDER

1. Run !`ls -l ~/.claude/agents` to see available sub-agents.
2. Parse $ARGUMENTS to identify task type, domain, and requirements
3. If sub-agent is specified → Use specified sub-agent directly
4. If format is "youtube-url", IMPORTANT: you must immediately send task to youtube-transcript-analyzer sub-agent.
5. Otherwise, analyze task keywords to select appropriate sub-agent from the list of available sub-agents.
6. Use the Task tool to spawn the selected sub-agent with appropriate parameters

## Context

Available sub-agents in @~/.claude/agents/:

## Output

- Selected sub-agent name and rationale
- Task execution through the chosen sub-agent
- Results from the sub-agent's processing
