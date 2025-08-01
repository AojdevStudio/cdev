# Command Index & Integration Guide

## Quick Command Reference

### Parallel Development Workflow

- `/orchestrate` - Transform tasks into parallel sub-agents
- `/agent-start` - Begin agent development workflow
- `/agent-status` - Monitor parallel agent progress
- `/agent-final-validation` - Validate agent work completion
- `/agent-commit` - Commit and merge agent work
- `/agent-cleanup` - Clean up completed workflows

### Pull Request & Code Review

- `/commit` - Create conventional commits with emoji
- `/create-pr` - Generate comprehensive pull requests
- `/pr-review` - Analyze PRs for adoption decisions
- `/review-merge` - Review and merge with validation

### Project Setup & Maintenance

- `/prime` - Load essential project context
- `/init-protocol` - Initialize protocol-based CLAUDE.md
- `/enforce-structure` - Validate and organize project structure
- `/generate-readme` - Create comprehensive documentation

### Analysis & Utilities

- `/git-status` - Analyze repository state
- `/quick-search` - Search project logs and files
- `/deep-search` - Advanced log analysis with filtering
- `/all-tools` - List available tools and signatures

### Configuration & Automation

- `/rule2hook` - Convert rules to executable hooks
- `/update-changelog` - Update changelog from commits
- `/create-command` - Create new custom commands
- `/build-roadmap` - Generate strategic project roadmaps

### Linear Integration

- `/write-linear-issue` - Create structured Linear issues
- `/create-coordination-files` - Generate workflow coordination files

## Integration Patterns

### Workflow Chains

Commands designed to work together in sequence:

**Parallel Development**: `orchestrate` → `agent-start` → `agent-status` → `agent-commit`
**PR Flow**: `commit` → `create-pr` → `pr-review` → `review-merge`  
**Project Setup**: `prime` → `init-protocol` → `enforce-structure`

### Sub-Agent Coordination

Commands share specialized sub-agents for consistent behavior:

- **git-flow-manager**: Handles all git operations across multiple commands
- **task-orchestrator**: Manages complex task decomposition
- **quality-guardian**: Ensures validation consistency

### Argument Patterns

All commands support standardized argument patterns:

- **$ARGUMENTS**: Universal parameter handling
- **Flag support**: Commands recognize standard flags
- **Context awareness**: Intelligent defaults based on project state

## Usage Examples

```bash
# Complete parallel development workflow
/orchestrate "Implement user authentication system"
/agent-start frontend-auth
/agent-status
/agent-commit frontend-auth

# Standard development workflow
/prime
/git-status
/commit "feat: add login component"
/create-pr "Add authentication frontend"
```
