---
allowed-tools: Read, Write, Bash, TodoWrite
description: Build concrete project roadmaps with clear decisions, dates, and accountability
---

# Build Roadmap

Creates actionable project roadmaps focused on decisions, deadlines, and deliverables rather than analysis.

**variables:**
RoadmapScope: $ARGUMENTS

**Core Principle:** A roadmap is a **commitment document** - it shows what will be built, by when, by whom, and how success is measured.

**Usage Examples:**
- `/build-roadmap "OAuth implementation Q1"` - Feature delivery roadmap
- `/build-roadmap "technical debt sprint"` - Infrastructure improvement roadmap
- `/build-roadmap "product launch"` - Go-to-market roadmap

```yaml
# Focused protocol for building decision-oriented roadmaps
roadmap_protocol:
  description: 'Create actionable roadmaps with clear commitments, not analysis documents'

  # Core roadmap components (mandatory)
  essential_elements:
    - 'WHAT: Specific deliverables with acceptance criteria'
    - 'WHEN: Concrete dates and milestones'
    - 'WHO: Clear ownership and accountability'
    - 'WHY: Business justification and success metrics'
    - 'DEPENDENCIES: What must happen first'
    - 'DECISIONS: Key choices made and alternatives rejected'

  # Simple execution flow
  execution_steps:
    1. 'Extract scope and constraints from $ARGUMENTS'
    2. 'Identify current state and target outcome'
    3. 'Define 3-5 concrete deliverables'
    4. 'Set realistic dates based on capacity'
    5. 'Map dependencies and critical path'
    6. 'Assign ownership for each deliverable'
    7. 'Define success criteria and review checkpoints'

  # Context gathering (minimal, focused)
  context_sources:
    project_state:
      - command: 'git log --oneline --since="1 month ago" | head -5'
        purpose: 'Recent development velocity'
      - command: 'find . -name "*.md" | grep -E "(README|TODO|ROADMAP)" | head -3'
        purpose: 'Existing plans and documentation'
    
    input_files:
      - '@README.md'
      - '@package.json'
      - '@CLAUDE.md'

  # Roadmap structure (simplified)
  output_structure:
    sections:
      executive_summary:
        - 'One sentence: What we\'re building and why'
        - 'Target completion date'
        - 'Success definition (1-2 metrics)'
      
      deliverables:
        format: |
          ## [Deliverable Name]
          **Owner:** [Person/Team]
          **Due Date:** [Specific date]
          **Definition of Done:** [Acceptance criteria]
          **Dependencies:** [What must be completed first]
          **Risk Level:** [High/Medium/Low with mitigation]
      
      timeline:
        - 'Mermaid gantt chart with critical path'
        - 'Key milestone dates'
        - 'Review/checkpoint schedule'
      
      decisions_made:
        - 'Architecture choices and alternatives rejected'
        - 'Scope boundaries (what\'s NOT included)'
        - 'Resource allocation decisions'

  # Quality gates (prevent AI slop)
  validation_rules:
    mandatory_checks:
      - 'Every deliverable has specific due date'
      - 'Every deliverable has named owner'
      - 'Success criteria are measurable'
      - 'Dependencies are explicitly mapped'
      - 'No "TBD" or "To be determined" items'
    
    slop_detection:
      reject_if_contains:
        - 'Strategic thinking'
        - 'Comprehensive analysis'
        - 'Multiple options without decisions'
        - 'Vague timelines like "Q1-Q2"'
        - 'Bullet points without owners'

  # Simple templates by type
  templates:
    feature_roadmap:
      focus: 'Single feature from idea to production'
      timeline: '4-12 weeks'
      deliverables: ['Requirements', 'Design', 'Implementation', 'Testing', 'Launch']
    
    technical_roadmap:
      focus: 'Infrastructure or technical improvement'
      timeline: '2-8 weeks'
      deliverables: ['Assessment', 'Plan', 'Implementation', 'Validation', 'Documentation']
    
    sprint_roadmap:
      focus: 'Short-term execution plan'
      timeline: '1-4 weeks'
      deliverables: ['Tasks defined', 'Daily progress', 'Sprint review', 'Retrospective']

  # Output format (concrete, not fluffy)
  deliverable_format: |
    # [Project Name] Roadmap
    
    **Target:** [One clear sentence]
    **Completion:** [Specific date]
    **Success Metric:** [How we measure success]
    
    ## Deliverables
    
    [For each deliverable: Name, Owner, Date, Done criteria, Dependencies]
    
    ## Timeline
    
    ```mermaid
    gantt
        title Project Timeline
        [Actual gantt chart with dependencies]
    ```
    
    ## Key Decisions
    
    - **Architecture:** [What we chose and why]
    - **Scope:** [What's included/excluded]
    - **Resources:** [Team allocation]
    
    ## Review Schedule
    
    - [Date]: Milestone 1 review
    - [Date]: Milestone 2 review
    - [Date]: Final delivery review
    
    ## Risks & Mitigation
    
    [Only real risks with specific mitigation plans]

# Sub-agent instructions
sub_agent_focus:
  - 'Force concrete decisions over analysis'
  - 'Require specific dates and owners'
  - 'Reject vague or aspirational language'
  - 'Focus on execution over strategy'
  - 'Create commitment documents, not wish lists'
```