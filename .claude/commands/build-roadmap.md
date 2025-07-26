---
allowed-tools: Read, Write, Bash, TodoWrite, WebSearch
description: Build comprehensive project roadmaps with strategic planning and timeline visualization
---

# Build Roadmap

This command creates comprehensive project roadmaps by analyzing current state, defining objectives, and organizing deliverables into strategic phases with timelines and dependencies.

**🤖 Sub-Agent Integration:** This command leverages the specialized `roadmap-architect` sub-agent for expert strategic planning and roadmap development. The sub-agent will be automatically invoked to handle feature prioritization, timeline estimation, strategic planning, and comprehensive roadmap creation with deep understanding of project management and strategic thinking principles.

**variables:**
RoadmapScope: $ARGUMENTS

**Primary Action:** Use the roadmap-architect sub-agent to handle strategic planning and roadmap development including feature prioritization, timeline estimation, and comprehensive roadmap creation.

**Usage Examples:**

- `/build-roadmap` - Interactive roadmap creation for current project
- `/build-roadmap "OAuth implementation Q1-Q2"` - Specific feature roadmap
- `/build-roadmap "product launch" --strategic` - High-level strategic roadmap
- `/build-roadmap "technical debt" --quarterly` - Technical improvement roadmap

```yaml
# A comprehensive protocol for building project roadmaps with strategic planning and execution details.
roadmap_building_protocol:
  description: 'Create structured project roadmaps with phases, timelines, dependencies, and success metrics.'

  # The sequence of operations for roadmap creation.
  execution_flow:
    - phase: 'Discovery & Analysis'
      steps:
        - 'Parse $ARGUMENTS to extract scope, timeline, and focus areas.'
        - 'Analyze current project state from git history, documentation, and codebase.'
        - 'Identify stakeholders, constraints, and success criteria.'
        - 'Gather requirements from existing documentation and user feedback.'

    - phase: 'Strategic Planning'
      steps:
        - 'Define vision, objectives, and key results (OKRs).'
        - 'Identify major themes and strategic initiatives.'
        - 'Assess technical feasibility and resource requirements.'
        - 'Create high-level timeline with major milestones.'

    - phase: 'Roadmap Structure'
      steps:
        - 'Break down objectives into executable phases.'
        - 'Define deliverables, acceptance criteria, and success metrics.'
        - 'Map dependencies between features and initiatives.'
        - 'Assign effort estimates and resource requirements.'

    - phase: 'Documentation & Visualization'
      steps:
        - 'Create structured roadmap document with timelines.'
        - 'Generate visual timeline with Mermaid diagrams.'
        - 'Document assumptions, risks, and mitigation strategies.'
        - 'Create tracking mechanisms and review processes.'

  # Contextual data and reference materials for roadmap creation.
  context_and_standards:
    data_sources:
      - name: 'Project Structure'
        command: 'find . -name "*.md" -o -name "package.json" -o -name "README*" | head -20'
      - name: 'Git History Analysis'
        command: 'git log --oneline --since="3 months ago" | head -10'
      - name: 'Current Issues'
        command: 'grep -r "TODO\\|FIXME\\|BUG" --include="*.md" --include="*.ts" --include="*.js" . | head -5 || echo "No issues found"'
      - name: 'Documentation Files'
        command: 'find . -name "docs" -type d -exec find {} -name "*.md" \\; | head -10'
      - name: 'Recent Changes'
        command: 'git status --porcelain | head -10'
      - name: 'Branch Analysis'
        command: 'git branch -r | head -5'

    input_files:
      - '@README.md'
      - '@CHANGELOG.md'
      - '@package.json'
      - '@docs/'
      - '@CLAUDE.md'

    reference_docs:
      - '@ai-docs/readme-template.yaml'
      - '@docs/implementation-plan.md'
      - '@docs/oauth-token-refresh-research.md'

    roadmap_frameworks:
      - name: 'NOW-NEXT-LATER'
        description: 'Simple three-phase prioritization framework'
        phases: ['NOW (0-3 months)', 'NEXT (3-6 months)', 'LATER (6+ months)']
      - name: 'OKR-BASED'
        description: 'Objectives and Key Results driven roadmap'
        structure: ['Objectives', 'Key Results', 'Initiatives', 'Metrics']
      - name: 'FEATURE-DRIVEN'
        description: 'Feature-centric development roadmap'
        phases: ['Discovery', 'Design', 'Development', 'Launch', 'Iterate']
      - name: 'QUARTERLY'
        description: 'Quarter-based strategic planning'
        phases: ['Q1', 'Q2', 'Q3', 'Q4']

    roadmap_components:
      strategic_elements:
        - 'Vision statement'
        - 'Strategic objectives'
        - 'Success metrics'
        - 'Key assumptions'
        - 'Risk assessment'
      tactical_elements:
        - 'Feature specifications'
        - 'Technical requirements'
        - 'Resource allocation'
        - 'Timeline estimates'
        - 'Dependency mapping'
      operational_elements:
        - 'Sprint planning'
        - 'Milestone tracking'
        - 'Progress reporting'
        - 'Stakeholder communication'
        - 'Review processes'

    timeline_patterns:
      - pattern: 'AGILE_SPRINTS'
        duration: '2-4 weeks per sprint'
        focus: 'Incremental delivery'
      - pattern: 'MONTHLY_MILESTONES'
        duration: '4 weeks per milestone'
        focus: 'Feature completion'
      - pattern: 'QUARTERLY_GOALS'
        duration: '12 weeks per quarter'
        focus: 'Strategic objectives'
      - pattern: 'ANNUAL_PLANNING'
        duration: '52 weeks per year'
        focus: 'Long-term vision'

    success_metrics:
      delivery_metrics:
        - 'Features delivered on time'
        - 'Quality metrics (bugs, performance)'
        - 'User adoption and satisfaction'
        - 'Technical debt reduction'
      process_metrics:
        - 'Planning accuracy'
        - 'Velocity consistency'
        - 'Stakeholder engagement'
        - 'Risk mitigation effectiveness'

    risk_categories:
      - category: 'TECHNICAL'
        examples: ['Scalability limits', 'Technology constraints', 'Integration complexity']
      - category: 'RESOURCE'
        examples: ['Team capacity', 'Budget constraints', 'Skill gaps']
      - category: 'MARKET'
        examples: ['Competitive pressure', 'User needs evolution', 'Regulatory changes']
      - category: 'EXECUTION'
        examples: ['Scope creep', 'Communication gaps', 'Process inefficiencies']

  # Validation rules and quality checks for roadmaps.
  validation_framework:
    completeness_checks:
      - 'Vision and objectives clearly defined'
      - 'Success metrics are measurable'
      - 'Timeline is realistic and achievable'
      - 'Dependencies are identified and managed'
      - 'Risks are assessed with mitigation plans'

    feasibility_assessment:
      - 'Resource requirements vs availability'
      - 'Technical complexity vs team capability'
      - 'Timeline vs historical velocity'
      - 'Scope vs strategic priorities'

    stakeholder_alignment:
      - 'Business objectives alignment'
      - 'User value proposition'
      - 'Technical architecture consistency'
      - 'Resource allocation approval'

  # Templates for different roadmap types and formats.
  roadmap_templates:
    strategic_roadmap:
      sections:
        - 'Executive Summary'
        - 'Vision & Objectives'
        - 'Strategic Initiatives'
        - 'Timeline & Milestones'
        - 'Resource Requirements'
        - 'Success Metrics'
        - 'Risk Management'

    feature_roadmap:
      sections:
        - 'Feature Overview'
        - 'User Value Proposition'
        - 'Technical Requirements'
        - 'Development Phases'
        - 'Testing Strategy'
        - 'Launch Plan'
        - 'Success Criteria'

    technical_roadmap:
      sections:
        - 'Current Architecture'
        - 'Technical Objectives'
        - 'Improvement Initiatives'
        - 'Migration Plans'
        - 'Quality Metrics'
        - 'Performance Targets'
        - 'Security Considerations'

  # Output formats and delivery mechanisms.
  deliverable_formats:
    documentation:
      - 'Comprehensive roadmap document (Markdown)'
      - 'Executive summary presentation'
      - 'Technical implementation guide'
      - 'Timeline visualization (Mermaid)'

    tracking_tools:
      - 'TodoWrite integration for task management'
      - 'Milestone tracking spreadsheet'
      - 'Progress dashboard'
      - 'Stakeholder communication templates'

    review_processes:
      - 'Weekly progress reviews'
      - 'Monthly stakeholder updates'
      - 'Quarterly strategic assessments'
      - 'Annual roadmap planning'
```
