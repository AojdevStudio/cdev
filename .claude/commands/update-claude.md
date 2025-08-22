---
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(find:*), Bash(grep:*), Bash(wc:*), Bash(ls:*)
description: Automatically update CLAUDE.md file based on recent code changes
flags:
  --directory: Create/update CLAUDE.md for a specific directory instead of project root
---

# Update Claude.md File

## Mode Selection
{{if flags.directory}}
### Directory-Specific CLAUDE.md Mode
Updating CLAUDE.md for directory: {{flags.directory}}
{{else}}
### Project Root CLAUDE.md Mode
{{endif}}

## Current Claude.md State
{{if flags.directory}}
@{{flags.directory}}/CLAUDE.md
{{else}}
@CLAUDE.md
{{endif}}

## Git Analysis

### Current Repository Status
!`git status --porcelain`

### Recent Changes (Last 10 commits)
!`git log --oneline -10`

### Detailed Recent Changes
!`git log --since="1 week ago" --pretty=format:"%h - %an, %ar : %s" --stat`

### Recent Diff Analysis
!`git diff HEAD~5 --name-only | head -20`

### Detailed Diff of Key Changes
!`git diff HEAD~5 -- "*.js" "*.ts" "*.jsx" "*.tsx" "*.py" "*.md" "*.json" | head -200`

### New Files Added
!`git diff --name-status HEAD~10 | grep "^A" | head -15`

### Deleted Files
!`git diff --name-status HEAD~10 | grep "^D" | head -10`

### Modified Core Files
!`git diff --name-status HEAD~10 | grep "^M" | grep -E "(package\.json|README|config|main|index|app)" | head -10`

## Project Structure Changes
!`find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" | head -10`

## Configuration Changes
!`git diff HEAD~10 -- package.json tsconfig.json webpack.config.js next.config.js .env* docker* | head -100`

## API/Route Changes  
!`git diff HEAD~10 -- "**/routes/**" "**/api/**" "**/controllers/**" | head -150`

## Database/Model Changes
!`git diff HEAD~10 -- "**/models/**" "**/schemas/**" "**/migrations/**" | head -100`

## Your Task

{{if flags.directory}}
### Directory-Specific Task
Based on the directory's CLAUDE.md (if it exists) and git analysis, create/update the CLAUDE.md for the {{flags.directory}} directory that:
- Focuses specifically on that directory's purpose and contents
- Documents how it relates to the rest of the project
- Explains the internal structure and key files
- Notes recent changes specific to that directory
{{else}}
### Project Root Task
Based on the current CLAUDE.md content and all the git analysis above, create an updated CLAUDE.md file that:
{{endif}}

## 1. Preserves Important Existing Content
- Keep the core project description and architecture
- Maintain important setup instructions
- Preserve key architectural decisions and patterns
- Keep essential development workflow information

## 2. Integrates Recent Changes
Analyze the git diff and logs to identify:
- **New Features**: What new functionality was added?
- **API Changes**: New endpoints, modified routes, updated parameters
- **Configuration Updates**: Changes to build tools, dependencies, environment variables
- **File Structure Changes**: New directories, moved files, deleted components
- **Database Changes**: New models, schema updates, migrations
- **Bug Fixes**: Important fixes that affect how the system works
- **Refactoring**: Significant code reorganization or architectural changes

## 3. Updates Key Sections
Intelligently update these CLAUDE.md sections:

### Project Overview
- Update description if scope changed
- Note new technologies or frameworks added
- Update version information

### Architecture
- Document new architectural patterns
- Note significant structural changes
- Update component relationships

### Setup Instructions  
- Add new environment variables
- Update installation steps if dependencies changed
- Note new configuration requirements

### API Documentation
- Add new endpoints discovered in routes
- Update existing endpoint documentation
- Note authentication or parameter changes

### Development Workflow
- Update based on new scripts in package.json
- Note new development tools or processes
- Update testing procedures if changed

### Recent Changes Section
Add a "Recent Updates" section with:
- Summary of major changes from git analysis
- New features and their impact
- Important bug fixes
- Breaking changes developers should know about

### File Structure
- Update directory explanations for new folders
- Note relocated or reorganized files
- Document new important files

## 4. Smart Content Management
- **Don't duplicate**: Avoid repeating information already well-documented
- **Prioritize relevance**: Focus on changes that affect how developers work with the code
- **Keep it concise**: Summarize rather than listing every small change
- **Maintain structure**: Follow existing CLAUDE.md organization
- **Add timestamps**: Note when major updates were made

## 5. Output Format

{{if flags.directory}}
### Directory-Specific Template
For directory-specific CLAUDE.md files, use this structure:

```markdown
# Directory Name

## Overview
[Directory purpose and responsibility]

## Architecture
[How this directory fits into the overall system]

## Setup & Installation
[Any specific setup for this directory]

## Development Workflow
[Directory-specific development processes]

## API Documentation
[APIs exposed by this directory]

## File Structure
[Explanation of files within this directory]

## Recent Updates (Updated: YYYY-MM-DD)
[Recent changes to this directory]

## Important Notes
[Key information about this directory]
```

### Directory Analysis Commands
When analyzing a specific directory:
!`find {{flags.directory}} -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | head -20`
!`git log --oneline -10 -- {{flags.directory}}`
!`git diff HEAD~5 -- {{flags.directory}} | head -200`

{{else}}
### Project Root Template
For the main project CLAUDE.md, use this structure:

```markdown
# Project Name

## Overview
[Updated project description]

## Architecture
[Updated architecture information]

## Setup & Installation
[Updated setup instructions]

## Development Workflow
[Updated development processes]

## API Documentation
[Updated API information]

## File Structure
[Updated directory explanations]

## Recent Updates (Updated: YYYY-MM-DD)
[Summary of recent changes]

## Important Notes
[Key information for developers]
```
{{endif}}