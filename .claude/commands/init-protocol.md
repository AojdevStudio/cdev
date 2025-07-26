---
allowed-tools: Read, Write, Bash, Glob, Grep, Task
description: Initialize protocol-based CLAUDE.md with intelligent framework selection
---

# Init Protocol

This command generates a comprehensive protocol-based CLAUDE.md file by analyzing project structure, technologies, and complexity to select and customize appropriate protocol frameworks for optimal AI assistance.

**🤖 Sub-Agent Integration:** This command leverages the specialized `deep-searcher` sub-agent for advanced codebase analysis and comprehensive project understanding. The sub-agent will be automatically invoked to handle complex search patterns, systematic analysis, and thorough project discovery with domain expertise in search optimization.

**Primary Action:** Use the deep-searcher sub-agent to handle comprehensive project analysis including technology detection, pattern recognition, and architectural understanding.

```yaml
# Defines the '/init-protocol' command for intelligent framework selection.
init_protocol_command:
  # General information about the command.
  metadata:
    title: 'Init Protocol'
    description: 'Generates a comprehensive protocol-based CLAUDE.md file by analyzing project structure, technologies, and complexity to select and customize appropriate protocol frameworks for optimal AI assistance.'

  # How to use the command, including arguments and examples.
  usage:
    arguments_placeholder: '$ARGUMENTS'
    examples:
      - command: '/init-protocol'
        purpose: 'Analyze the current project and generate a protocol-based CLAUDE.md.'
      - command: '/init-protocol --force'
        purpose: 'Overwrite an existing CLAUDE.md file without user confirmation.'
      - command: '/init-protocol --level advanced'
        purpose: 'Force the selection of a specific framework maturity level.'
      - command: '/init-protocol --focus "parallel-development microservices"'
        purpose: 'Emphasize specific domains for protocol selection.'

  # The core protocol that drives the generation process.
  generator_protocol:
    # A sequence of high-level actions for the generator to perform.
    instructions:
      - 'Check if CLAUDE.md exists; if yes and no --force flag, prompt for confirmation.'
      - 'Use the deep-searcher sub-agent to comprehensively analyze the project structure and identify technologies, patterns, and architecture.'
      - 'CRITICAL: The deep-searcher will look for and read project documentation (README.md, PLAN.md, PRD.md, IMPLEMENT.md, docs/) to understand what the user is actually building.'
      - "The deep-searcher will distinguish between Claude Code framework files (.claude/, ai-docs/) and the actual project - focusing on understanding the user's project goals."
      - "If the project appears empty or only contains framework files, ASK THE USER: 'What type of project are you planning to build here?'"
      - 'Use the deep-searcher sub-agent to analyze actual project structure (not framework): identify languages, patterns, architecture from non-framework files with comprehensive search patterns.'
      - 'Determine project complexity using the framework decision matrix based on the deep-searcher analysis of the ACTUAL PROJECT, not the framework.'
      - 'Select protocol categories that match what the user is TRYING TO BUILD, not just what tools are present.'
      - "Generate protocols customized for the user's actual project goals and context."
      - "Start CLAUDE.md with a clear 'Project Context' section explaining what this project is actually about."
      - "Create a comprehensive CLAUDE.md file with all selected frameworks adapted to the project's true purpose and place it in the root of the project."
      - 'Include a project-specific quick start guide based on the actual project goals.'
      - 'Reference the naming conventions guide (@ai-docs/naming-conventions.md) for consistent, professional naming across files, functions, and project organization.'
      - 'IMPORTANT: Include a section in CLAUDE.md about sub-agent usage patterns with explicit spawning language requirements.'
      - 'Add guidance that when working with specialized tasks, users should use explicit language like "Use the [agent-name] sub-agent to [action]" for proper sub-agent activation.'
      - 'Reference the available CDEV sub-agents (git-flow-manager, task-orchestrator, pr-specialist, structure-enforcer, etc.) and their domains of expertise.'
      - "Save the final CLAUDE.md and provide a summary focused on how it will help achieve the project's objectives."

    # Defines the information to be gathered from the project environment.
    context_gathering:
      - name: 'Protocol Template Source'
        command: '@ai-docs/CLAUDE-protocol-template.yaml'
        description: 'The base template for generating protocols.'
      - name: 'Naming Conventions Guide'
        command: '@ai-docs/naming-conventions.md'
        description: 'Official naming conventions for files, functions, and project organization to ensure professional, consistent naming.'
      - name: 'Sub-Agent Integration Patterns'
        command: '@ai-docs/custom-command-template.yaml'
        description: 'Sub-agent spawning patterns and explicit invocation language requirements for specialized task delegation.'
      - name: 'Current Directory'
        command: '!`pwd`'
        description: 'The working directory where the script is run.'
      - name: 'Existing CLAUDE.md Check'
        command: "!`test -f CLAUDE.md && echo 'exists' || echo 'none'`"
        description: 'Checks if a CLAUDE.md file already exists.'
      - name: 'Deep Project Analysis via Sub-Agent'
        command: 'Use the deep-searcher sub-agent to perform comprehensive project discovery'
        description: "CRITICAL: The deep-searcher will read project documentation (README.md, docs/) to understand the project's purpose, not just its technical frameworks."
      - name: 'Project Content Analysis via Sub-Agent'
        command: 'Use the deep-searcher sub-agent for systematic content analysis'
        description: "The deep-searcher will analyze non-framework files to understand the project's substance and note if the repository is empty to prompt the user for goals."
      - name: 'Project Type Detection via Sub-Agent'
        command: 'Use the deep-searcher sub-agent for intelligent project type classification'
        description: 'The deep-searcher will determine the project type (e.g., web app, CLI tool, library) based on comprehensive content analysis.'
      - name: 'Advanced Language and Pattern Detection'
        command: 'Use the deep-searcher sub-agent for comprehensive technology stack analysis'
        description: 'The deep-searcher will identify programming languages, frameworks, and architectural patterns used in the project, excluding framework files with advanced search capabilities.'
      - name: 'Package Manager Detection'
        command: '!`ls package.json requirements.txt go.mod Cargo.toml pom.xml 2>/dev/null | head -5`'
        description: 'Looks for dependency management files.'
      - name: 'Team Indicators'
        command: "!`test -d .github/workflows && echo 'CI/CD workflows found'; test -f CONTRIBUTING.md && echo 'Contributing guide found'`"
        description: 'Checks for signs of team collaboration, such as CI/CD workflows or contributing guides.'

    # A matrix to decide the protocol scope based on project characteristics.
    framework_decision_matrix:
      - scope: 'Minimal Protocol Set'
        criteria: 'Simple Projects (e.g., solo developer, less than 5 files).'
      - scope: 'Core Protocol Set'
        criteria: 'Medium Projects (e.g., small team, standard features).'
      - scope: 'Full Protocol Set'
        criteria: 'Complex Projects (e.g., multi-team, enterprise features).'
      - scope: 'Domain-Specific Extensions'
        criteria: 'Specialized Projects (e.g., AI/ML, crypto, parallel development).'

    # Available protocol categories for inclusion in the CLAUDE.md file.
    protocol_categories:
      - name: 'Core Meta-Cognitive'
        description: 'Protocols for project understanding, problem analysis, and decision making.'
      - name: 'Development Workflow'
        description: 'Protocols for the primary workflow, code reviews, and deployment.'
      - name: 'Code Quality'
        description: 'Protocols for analysis tools, testing strategy, and refactoring.'
      - name: 'Project Management'
        description: 'Protocols for task management, documentation, and communication.'
      - name: 'Domain-Specific'
        description: 'Protocols for technology-specific tools, business logic, and integrations.'
      - name: 'Self-Improvement'
        description: 'Protocols for learning capture, process optimization, and knowledge base updates.'

    # Logic for dynamically analyzing project complexity to select the right protocol set.
    dynamic_analysis:
      complexity_score_formula: 'Project Complexity = (File Count × 0.2) + (Language Diversity × 0.3) + (Framework Count × 0.2) + (Team Indicators × 0.3)'
      protocol_set_rules:
        - condition: 'score > 0.7'
          result: 'Full Protocol Set'
        - condition: 'score > 0.4'
          result: 'Core Protocol Set'
        - condition: 'score > 0.2'
          result: 'Minimal Protocol Set'
        - condition: 'score <= 0.2'
          result: 'Basic Protocol Set'

    # Rules for detecting specialized project types requiring domain-specific protocols.
    special_detections:
      - project_type: 'Parallel Development'
        criteria: 'Git worktrees are found, and Linear API usage patterns are detected.'
      - project_type: 'Microservices'
        criteria: 'Multiple service directories are found, along with Docker or Kubernetes configurations.'
      - project_type: 'AI/ML Projects'
        criteria: 'Jupyter notebooks are present, or ML library imports (e.g., TensorFlow, PyTorch) are detected.'
      - project_type: 'Frontend Heavy'
        criteria: 'React, Vue, or Angular dependencies are found, along with component-based file patterns.'
      - project_type: 'API First'
        criteria: 'OpenAPI/Swagger specs are found, along with REST or GraphQL server patterns.'

    # The step-by-step process for generating the final CLAUDE.md file.
    generation_process:
      - phase: 1
        name: 'Analysis'
        description: 'Scan the codebase for technologies, dependencies, and architectural patterns.'
      - phase: 2
        name: 'Selection'
        description: 'Choose appropriate protocols based on the complexity score and special detections.'
      - phase: 3
        name: 'Customization'
        description: 'Adapt selected protocols to the specific technology stack and project structure.'
      - phase: 4
        name: 'Validation'
        description: 'Ensure all generated protocols are compatible and complete.'
      - phase: 5
        name: 'Documentation'
        description: 'Add project-specific examples, a quick start guide, and usage instructions.'

    # Criteria to evaluate the success of the generated CLAUDE.md file.
    success_metrics:
      - '✅ CLAUDE.md located in the root of the project and clearly explains what the project is actually about (not just the framework).'
      - "✅ Protocols match the user's actual project goals and technologies."
      - '✅ Framework complexity aligns with project needs.'
      - '✅ Custom commands are relevant to what the user is building.'
      - '✅ Self-improvement mechanisms capture project learnings.'
      - '✅ Team coordination protocols match the collaboration style.'
      - '✅ Project context section is clear and informative.'

    # Self-improvement mechanism to learn from protocol generation experiences.
    learning_protocol:
      common_mistakes_to_avoid:
        - 'Focusing on framework files instead of actual project content.'
        - 'Generating generic protocols without understanding project purpose.'
        - 'Missing the distinction between tools (framework) and goals (project).'
        - 'Not asking the user about their project when repo appears empty.'
      improvement_actions:
        - 'Always read project documentation first before analyzing code.'
        - 'Distinguish between framework presence and project substance.'
        - 'Include clear project context at the top of every CLAUDE.md.'
        - 'Ask clarifying questions when project purpose is unclear.'
      feedback_integration:
        - 'When users point out missing context, update the init-protocol to capture it.'
        - 'Learn from each generation to improve future protocol creation.'
        - 'Maintain awareness that this is a meta-tool for helping users with their actual projects.'
```
