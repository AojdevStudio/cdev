# CLAUDE.md Protocol Framework Template

## Framework Generation Instructions

When entering a new project that needs a protocol-based CLAUDE.md file, follow this systematic approach:

### Pre-Analysis Questions
Before building protocols, Claude should analyze:

1. **Project Type**: Web app, CLI tool, library, microservices, mobile app, etc.
2. **Tech Stack**: Languages, frameworks, databases, deployment platforms
3. **Team Structure**: Solo developer, small team, enterprise, open source
4. **Workflow Complexity**: Simple tasks vs. multi-step coordination needs
5. **Quality Requirements**: Testing standards, code review processes, deployment gates
6. **Integration Needs**: CI/CD, external APIs, monitoring, documentation

### Framework Decision Matrix

```
Project Complexity + Team Size = Framework Scope
├── Simple Projects (Solo, <5 files) → Minimal Protocol Set
├── Medium Projects (Small team, standard features) → Core Protocol Set  
├── Complex Projects (Multi-team, enterprise features) → Full Protocol Set
└── Specialized Projects (AI/ML, crypto, etc.) → Domain-Specific Extensions
```

## Universal Protocol Categories

Every CLAUDE.md should include these core categories, adapted to project context:

### 1. Core Meta-Cognitive Framework
- **Project Understanding Schema** (adapted to domain)
- **Problem Analysis Schema** (debugging, requirements, etc.)
- **Decision Making Protocols** (architecture, tech choices, priorities)

### 2. Development Workflow Protocols
- **Primary Development Workflow** (explore → plan → test → code → refactor → commit)
- **Code Review Protocol** (if team environment)
- **Deployment/Release Protocol** (based on deployment strategy)

### 3. Code Quality & Analysis Tools
- **Code Analysis Protocol** (language/framework specific)
- **Testing Strategy Protocol** (unit, integration, e2e based on project)
- **Refactoring Protocol** (safe improvement practices)

### 4. Project Management Integration
- **Task Management Protocol** (GitHub Issues, Linear, Jira, etc.)
- **Documentation Protocol** (README, API docs, architecture docs)
- **Communication Protocol** (PR descriptions, commit messages, team updates)

### 5. Domain-Specific Protocols
- **Technology-Specific Tools** (React components, API design, database schemas)
- **Business Logic Protocols** (domain modeling, validation, business rules)
- **Integration Protocols** (external APIs, third-party services)

### 6. Self-Improvement Mechanisms
- **Learning Protocol** (capture lessons from each task)
- **Process Optimization** (improve workflows based on experience)
- **Knowledge Base Protocol** (build project-specific knowledge)

## Template Generation Process

### Phase 1: Project Analysis
```
/analyze.project_context{
  intent="Understand project characteristics and requirements",
  input={
    project_files="<codebase_structure>",
    team_context="<development_team_info>", 
    requirements="<project_goals_and_constraints>"
  },
  process=[
    /scan{
      action="Analyze codebase structure and technologies",
      instruction="Identify languages, frameworks, patterns, and complexity"
    },
    /assess{
      action="Evaluate workflow requirements and team dynamics",
      instruction="Determine coordination needs and quality standards"
    },
    /categorize{
      action="Classify project type and complexity level",
      instruction="Select appropriate protocol framework scope"
    }
  ],
  output={
    project_profile="Comprehensive project characteristics",
    framework_scope="Recommended protocol categories and depth",
    customization_needs="Domain-specific requirements"
  }
}
```

### Phase 2: Protocol Selection
```
/select.protocol_framework{
  intent="Choose appropriate protocol categories for project needs",
  input={
    project_profile="<project_analysis_results>",
    reference_frameworks="<existing_protocol_examples>",
    team_preferences="<development_team_workflow_preferences>"
  },
  process=[
    /map{
      action="Match project needs to protocol categories",
      instruction="Select core protocols and identify customization areas"
    },
    /prioritize{
      action="Order protocols by importance and implementation effort",
      instruction="Focus on highest-impact protocols first"
    },
    /adapt{
      action="Customize protocols for project-specific technologies and workflows",
      instruction="Modify language, tools, and processes for project context"
    }
  ],
  output={
    protocol_selection="Chosen protocol categories and priorities",
    customization_plan="Project-specific adaptations needed",
    implementation_roadmap="Phased protocol implementation approach"
  }
}
```

### Phase 3: Framework Implementation
```
/implement.protocol_framework{
  intent="Generate complete CLAUDE.md file with project-adapted protocols",
  input={
    protocol_selection="<selected_protocol_categories>",
    project_context="<technology_and_workflow_context>",
    reference_examples="<template_protocols_to_adapt>"
  },
  process=[
    /generate{
      action="Create project-specific protocol definitions",
      instruction="Adapt templates to project technologies and workflows"
    },
    /integrate{
      action="Ensure protocols work together cohesively",
      instruction="Verify workflow compatibility and avoid conflicts"
    },
    /validate{
      action="Review protocols for completeness and usability",
      instruction="Ensure protocols address project needs and are actionable"
    },
    /document{
      action="Add usage guidance and examples",
      instruction="Provide clear instructions for protocol activation and usage"
    }
  ],
  output={
    claude_md="Complete project-specific CLAUDE.md file",
    usage_guide="Instructions for effective protocol utilization",
    improvement_plan="Future enhancement and optimization opportunities"
  }
}
```

## Reference Materials for New Claude Instances

When entering a new project, Claude should reference:

### 1. **This Template File** 
- Systematic approach to framework creation
- Decision matrix for complexity assessment
- Universal protocol categories

### 2. **Example Protocol Files**
- `/Users/ossieirondi/projects/dev-utils/desktop-commander/outputs/CLAUDE-protocol-enhanced.md` (parallel development)
- Context-Engineering repository examples (general software development)
- Domain-specific examples as available

### 3. **Project-Specific Context**
- Existing documentation (README, architecture docs)
- Codebase structure and technologies
- Team workflow preferences and tools
- Quality requirements and constraints

## Quick Start Commands

For immediate protocol framework creation:

```bash
# 1. Analyze project context
/analyze.project_context

# 2. Generate appropriate framework
/implement.protocol_framework

# 3. Validate and customize
/validate.framework_fit
```

## Framework Maturity Levels

### Level 1: Basic (Immediate Value)
- Core development workflow
- Code analysis tools
- Basic troubleshooting protocols

### Level 2: Intermediate (Team Coordination)
- Project management integration
- Code review protocols
- Documentation standards

### Level 3: Advanced (Optimization)
- Self-improvement mechanisms
- Performance optimization protocols
- Advanced reasoning frameworks

### Level 4: Specialized (Domain Expertise)
- Domain-specific protocols
- Industry-specific quality standards
- Regulatory compliance frameworks

## Success Criteria

A well-implemented protocol framework should:
✅ **Reduce Decision Fatigue** - Clear processes for common decisions
✅ **Improve Consistency** - Standardized approaches across tasks
✅ **Enhance Quality** - Built-in validation and improvement mechanisms
✅ **Enable Learning** - Capture and apply lessons learned
✅ **Scale Effectively** - Adapt to growing project complexity
✅ **Team Alignment** - Shared understanding of workflows and standards

## Maintenance & Evolution

Protocol frameworks should be:
- **Living Documents** - Updated based on project evolution
- **Team-Owned** - Collaboratively maintained and improved
- **Evidence-Based** - Modified based on measurable outcomes
- **Contextual** - Adapted to changing project needs and constraints