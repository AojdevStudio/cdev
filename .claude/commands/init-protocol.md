---
allowed-tools: Read, Write, Bash, Glob, Grep, Task
description: Initialize protocol-based CLAUDE.md with intelligent framework selection
---

# Init Protocol

This command generates a comprehensive protocol-based CLAUDE.md file by analyzing your project structure, technologies, and complexity to select and customize appropriate protocol frameworks for optimal AI assistance.

$ARGUMENTS

**Usage Examples:**
- `/init-protocol` - Analyze current project and generate protocol-based CLAUDE.md
- `/init-protocol --force` - Overwrite existing CLAUDE.md without confirmation
- `/init-protocol --level advanced` - Force specific framework maturity level
- `/init-protocol --focus "parallel-development microservices"` - Emphasize specific domains

## Instructions
- Check if CLAUDE.md exists; if yes and no --force, prompt for confirmation
- Analyze project structure: languages, frameworks, patterns, team indicators
- Determine project complexity using the framework decision matrix
- Select appropriate protocol categories based on project profile
- Generate customized protocols adapted to discovered technologies
- Create comprehensive CLAUDE.md with all selected frameworks
- Update Claude.md with any new functionality (condense and summarize as needed while preserving memories)
- Include quick start guide and success criteria specific to project
- Save CLAUDE.md and provide implementation summary

## Context
- Protocol template: @ai-docs/CLAUDE-protocol-template.md
- Current directory: !`pwd`
- Existing CLAUDE.md: !`test -f CLAUDE.md && echo "exists" || echo "none"`
- Project languages: !`find . -type f -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.go" -o -name "*.java" -o -name "*.rs" | head -20 | sed 's/.*\.//' | sort | uniq`
- Package managers: !`ls package.json requirements.txt go.mod Cargo.toml pom.xml build.gradle 2>/dev/null | head -5`
- Git info: !`git rev-parse --is-inside-work-tree 2>/dev/null && echo "Git repo detected" || echo "Not a git repo"`
- Team indicators: !`test -d .github/workflows && echo "CI/CD workflows found"; test -f CONTRIBUTING.md && echo "Contributing guide found"`
- Framework Decision Matrix:
  - Simple Projects (Solo, <5 files) → Minimal Protocol Set
  - Medium Projects (Small team, standard features) → Core Protocol Set  
  - Complex Projects (Multi-team, enterprise features) → Full Protocol Set
  - Specialized Projects (AI/ML, crypto, parallel dev) → Domain-Specific Extensions

## Protocol Categories
- **Core Meta-Cognitive**: Project understanding, problem analysis, decision making
- **Development Workflow**: Primary workflow, code review, deployment/release
- **Code Quality**: Analysis tools, testing strategy, refactoring protocols
- **Project Management**: Task management, documentation, communication
- **Domain-Specific**: Technology tools, business logic, integrations
- **Self-Improvement**: Learning capture, process optimization, knowledge base

## Dynamic Analysis Logic
```
Project Complexity Score = 
  (File Count × 0.2) + 
  (Language Diversity × 0.3) + 
  (Framework Count × 0.2) + 
  (Team Indicators × 0.3)

If score > 0.7: Full Protocol Set
If score > 0.4: Core Protocol Set
If score > 0.2: Minimal Protocol Set
Else: Basic Protocol Set
```

## Special Detections
- Parallel Development: Git worktrees + Linear API usage
- Microservices: Multiple service directories + Docker/K8s
- AI/ML Projects: Jupyter notebooks + ML libraries
- Frontend Heavy: React/Vue/Angular + component patterns
- API First: OpenAPI specs + REST/GraphQL patterns

## Generation Process
1. **Analysis Phase**: Scan codebase for technologies and patterns
2. **Selection Phase**: Choose protocols based on complexity score
3. **Customization Phase**: Adapt protocols to specific tech stack
4. **Validation Phase**: Ensure protocol compatibility and completeness
5. **Documentation Phase**: Add project-specific examples and guides

## Success Metrics
- ✅ Protocols match project technologies and workflows
- ✅ Framework complexity aligns with project needs
- ✅ Custom commands relevant to development patterns
- ✅ Self-improvement mechanisms capture project learnings
- ✅ Team coordination protocols match collaboration style