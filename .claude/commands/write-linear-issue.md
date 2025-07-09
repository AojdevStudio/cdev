---
allowed-tools: mcp__linear__create_issue, mcp__linear__update_issue, mcp__linear__list_teams, mcp__linear__get_team, mcp__linear__list_users, mcp__linear__get_user, mcp__linear__list_issue_statuses, mcp__linear__list_issue_labels, mcp__linear__list_projects, mcp__linear__get_project, Read
description: Create well-structured Linear issues for parallel development workflow
---

# Write Linear Issue

This command creates well-structured Linear issues that work optimally with the parallel development workflow's semantic analysis and decomposition system using Linear MCP tools.

$ARGUMENTS

**Usage Examples:**
- `/write-linear-issue` - Interactive issue creation with team/project selection
- `/write-linear-issue "Add user authentication"` - Create issue with basic title
- `/write-linear-issue "Implement OAuth system" "AUTH-TEAM"` - Create issue for specific team

## Instructions

- If $ARGUMENTS provided: use first argument as feature description, second as team identifier
- If no arguments: ask user for feature description and gather requirements interactively
- Use Linear MCP tools to list available teams, projects, and users for proper issue creation
- Structure the issue using EXACTLY the template format: REPLACE existing content entirely with template structure
- Use ONLY the three template sections: numbered description, acceptance criteria, technical constraints
- Do NOT preserve existing sections or add additional sections like "Overview", "Requirements", etc.
- Include specific technologies, action verbs, and complexity indicators
- Create the issue directly in Linear using mcp__linear__create_issue with proper team/project assignment
- Provide the created issue ID and URL for immediate access

## Context

- Current Linear teams: !`echo "Will fetch via mcp__linear__list_teams"`
- Issue template: @ai-docs/linear-issue-template.md
- Semantic analysis patterns: actions (implement, create, build, add), technologies (React, Node.js, Docker), complexity levels (basic, enhanced, enterprise)
- Optimal structure: 2-6 numbered requirements, 30-60 minutes each, progressive complexity (infrastructure → backend → frontend → testing)
- Required elements: numbered lists (parsed by `/^\s*\d+\.\s*(.+)/`), specific technologies, action verbs, file operations, acceptance criteria
- Linear MCP tools: create_issue, update_issue, list_teams, get_team, list_users, list_issue_statuses, list_projects
- Issue format: Title: [Action] [Technology/System] - [Key Capability/Feature], numbered description, acceptance criteria, technical constraints
- Template format validation: Final output must match template EXACTLY - no additional sections beyond the three required parts
- When editing existing issues: completely replace content with template structure, do not merge or preserve existing format