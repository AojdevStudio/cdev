# CDEV Project Context

## What is CDEV?

**CDEV (Claude Development)** is an AI-powered development orchestration system designed to enhance Claude Code with sophisticated parallel development workflows, intelligent automation, and universal task understanding.

### Project Purpose
- **Transform Claude Code workflows** with parallel agent coordination and advanced automation
- **Universal task processing** from Linear tickets, markdown tasks, or plain descriptions 
- **Zero-friction setup** with one-command installation for any project type
- **Production-ready distribution** as a global NPM package (`@aojdevstudio/cdev`)

### Target Users
Developers using Claude Code who want to:
- Work on multiple parts of features simultaneously through parallel agents
- Automate quality gates and validation with intelligent hooks
- Process any task format (Linear, markdown, plain text) seamlessly
- Enhance their development workflows with AI-powered orchestration

### Architecture
- **CLI Tool** with modular command system and interactive installation
- **Multi-language Hybrid** (JavaScript core + Python automation scripts)
- **Git Worktree Management** for isolated parallel development environments
- **Hook System** with quality gates and automated validation
- **NPM Distribution** with cross-platform compatibility

---

## 1. Core Meta-Cognitive Framework

### Parallel Development Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Parallel Development Schema",
  "description": "Standardized format for analyzing and managing parallel development workflows",
  "type": "object",
  "properties": {
    "task": {
      "type": "object",
      "properties": {
        "taskId": {
          "type": "string",
          "description": "Linear task identifier"
        },
        "title": {
          "type": "string",
          "description": "Task title and description"
        },
        "complexity": {
          "type": "string",
          "enum": ["simple", "moderate", "complex", "enterprise"],
          "description": "Task complexity assessment"
        },
        "parallelizability": {
          "type": "string",
          "enum": ["high", "medium", "low"],
          "description": "Suitability for parallel decomposition"
        }
      }
    },
    "agents": {
      "type": "array",
      "description": "Decomposed agent specifications",
      "items": {
        "type": "object",
        "properties": {
          "agentId": { "type": "string" },
          "role": { "type": "string" },
          "focusArea": { "type": "string" },
          "dependencies": { "type": "array" },
          "estimatedTime": { "type": "number" },
          "canStartImmediately": { "type": "boolean" }
        }
      }
    },
    "integration": {
      "type": "object",
      "properties": {
        "mergeStrategy": { "type": "string" },
        "testingRequired": { "type": "boolean" },
        "riskAssessment": { "type": "string" }
      }
    }
  }
}
```

### Agent Context Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Agent Context Schema",
  "description": "Framework for agent role definition and task assignment",
  "type": "object",
  "properties": {
    "identity": {
      "type": "object",
      "properties": {
        "agentId": { "type": "string" },
        "taskId": { "type": "string" },
        "agentRole": { "type": "string" },
        "focusArea": { "type": "string" },
        "branchName": { "type": "string" }
      }
    },
    "execution": {
      "type": "object",
      "properties": {
        "canStartImmediately": { "type": "boolean" },
        "dependencies": { "type": "array" },
        "estimatedTime": { "type": "number" }
      }
    },
    "deliverables": {
      "type": "object",
      "properties": {
        "filesToCreate": { "type": "array" },
        "filesToModify": { "type": "array" },
        "validationCriteria": { "type": "array" },
        "testContracts": { "type": "array" }
      }
    }
  }
}
```

```yaml
# A comprehensive cognitive operating system for parallel development workflows.
development_operating_system:
  # Section 2: Core protocols for managing parallel development tasks.
  parallel_development_protocols:
    linear_issue_processing:
      protocol_id: /workflow.linear_issue_processing
      intent: 'Transform Linear issues into executable parallel development plans'
      input:
        task_id: '<linear_task_identifier>'
        requirements: '<task_requirements_and_context>'
      process:
        - step: cache
          action: 'Retrieve and cache Linear issue details'
          instruction: 'Store complete task context including requirements, acceptance criteria, and dependencies'
        - step: analyze
          action: 'Assess task complexity and parallelizability'
          instruction: 'Determine if task can be effectively decomposed into parallel agents'
        - step: decompose
          action: 'Break task into independent agent workstreams'
          instruction: 'Create agent specifications with clear boundaries and minimal dependencies'
        - step: validate
          action: 'Verify decomposition feasibility and integration strategy'
          instruction: 'Ensure agents can work independently and merge cleanly'
      output:
        deployment_plan: 'Complete parallel development plan'
        agent_contexts: 'Individual agent context files'
        integration_strategy: 'Merge and testing approach'
    agent_workflow:
      protocol_id: /workflow.explore_plan_test_code_refactor_commit
      intent: 'Implement comprehensive TDD approach with parallel agent coordination'
      input:
        agent_context: '<agent_context.yaml>'
        workspace_path: '<agent_worktree_path>'
        validation_checklist: '<validation_checklist.txt>'
      process:
        - step: explore
          action: 'Read agent context and understand assigned role and deliverables'
          instruction: "Analyze codebase, existing patterns, and integration points but don't write code yet"
        - step: plan
          action: 'Create detailed implementation plan with test strategy'
          instruction: 'Use extended thinking to evaluate alternatives and define acceptance criteria from validation checklist'
        - step: write_tests
          action: 'Create comprehensive test cases based on validation criteria'
          instruction: 'Define expected behavior and test contracts before implementation'
        - step: implement
          action: 'Write code to fulfill agent role and make tests pass'
          instruction: 'Follow files_to_work_on.txt systematically, verify correctness at each step'
        - step: refactor
          action: 'Improve code quality while maintaining passing tests'
          instruction: 'Clean up implementation without changing behavior, update validation checklist'
        - step: commit
          action: 'Commit agent work with dependency-aware integration'
          instruction: 'Generate clear commit messages from agent context, prepare for merge'
      output:
        tests: 'Comprehensive test suite for agent deliverables'
        implementation: 'Working code that fulfills agent role'
        refactored_code: 'Clean, maintainable implementation'
        validation_evidence: 'Completed validation checklist with evidence'
        integration_artifacts: 'Commit message, PR details, and merge readiness'
    agent_orchestration:
      protocol_id: /workflow.agent_orchestration
      intent: 'Coordinate multiple parallel agents and manage integration workflow'
      input:
        deployment_plan: '<task-deployment-plan.yaml>'
        workspace_root: '<parallel_development_workspace>'
      process:
        - step: spawn
          action: 'Create isolated git worktrees for each agent'
          instruction: 'Generate agent contexts and initialize independent working directories'
        - step: monitor
          action: 'Track agent progress and dependency resolution'
          instruction: 'Monitor validation checklist completion and identify integration readiness'
        - step: coordinate
          action: 'Manage dependencies and agent handoffs'
          instruction: 'Ensure agents can proceed without conflicts and handle sequential dependencies'
        - step: integrate
          action: 'Merge completed agent work into main branch'
          instruction: 'Validate integration, run tests, and ensure clean merge without conflicts'
      output:
        agent_worktrees: 'Isolated development environments'
        progress_tracking: 'Real-time agent status and completion metrics'
        integration_results: 'Successful merge and validation results'

  # Section 3: Tools and protocols for managing individual agents.
  agent_management_tools:
    context_analysis:
      protocol_id: /agent.analyze_context
      intent: 'Deep analysis of agent context and role validation'
      input:
        agent_context: '<agent_context.yaml>'
        codebase_context: '<relevant_project_files>'
      process:
        - step: parse
          identity: 'Extract agent ID, role, and focus area'
          deliverables: 'Identify files to create/modify and validation criteria'
          dependencies: 'Map agent dependencies and execution readiness'
        - step: validate
          feasibility: 'Assess if agent role is clearly defined and achievable'
          scope: 'Verify agent scope is appropriate and not overlapping'
          integration: 'Confirm integration points are well-defined'
        - step: optimize
          efficiency: 'Identify opportunities to streamline agent work'
          quality: 'Ensure validation criteria are comprehensive'
          risks: 'Assess potential integration challenges'
      output:
        context_analysis: 'Comprehensive agent context assessment'
        recommendations: 'Suggested improvements or adjustments'
        readiness_status: 'Agent readiness for immediate execution'
    status_monitoring:
      protocol_id: /agent.monitor_status
      intent: 'Track progress across all parallel agents and identify next actions'
      input:
        workspace_root: '<parallel_workspace_path>'
        filter: '<status_filter: all|active|complete|ready|blocked>'
      process:
        - step: discover
          action: 'Scan for all agent worktrees and contexts'
          instruction: 'Automatically identify active agent directories and their status'
        - step: assess
          action: 'Evaluate completion percentage and blockers'
          instruction: 'Check validation checklists and identify dependencies'
        - step: categorize
          action: 'Group agents by status and readiness'
          instruction: 'Classify as ready-to-start, in-progress, ready-to-commit, or blocked'
        - step: recommend
          action: 'Provide actionable next steps'
          instruction: 'Suggest specific actions to advance workflow progress'
      output:
        status_report: 'Comprehensive agent status overview'
        progress_metrics: 'Completion percentages and time estimates'
        action_items: 'Prioritized list of next steps'
    integration_workflow:
      protocol_id: /agent.integration_workflow
      intent: 'Safely merge agent work while maintaining code quality'
      input:
        agent_workspace: '<agent_worktree_path>'
        validation_complete: '<boolean>'
        custom_message: '<optional_commit_message>'
      process:
        - step: validate
          checklist: 'Verify all validation criteria are met'
          tests: 'Ensure all tests pass in agent workspace'
          conflicts: 'Check for potential merge conflicts'
        - step: prepare
          commit: 'Generate clear commit message from agent context'
          documentation: 'Update relevant documentation'
          cleanup: 'Prepare workspace for merge'
        - step: merge
          branch: 'Switch to main branch and merge agent work'
          resolve: 'Handle any merge conflicts systematically'
          verify: 'Run integration tests post-merge'
        - step: finalize
          push: 'Push merged changes to remote'
          cleanup: 'Remove agent worktree after successful merge'
          notify: 'Update project status and stakeholders'
      output:
        merge_result: 'Successful integration confirmation'
        commit_details: 'Commit hash and message details'
        cleanup_status: 'Worktree cleanup completion'

  # Section 4: Protocols governing reasoning and decision-making processes.
  reasoning_and_decision_making_protocols:
    task_decomposition:
      protocol_id: /reasoning.task_decomposition
      intent: 'Systematically analyze tasks for optimal parallel decomposition'
      input:
        task: '<linear_task_description>'
        codebase: '<project_context>'
        constraints: '<technical_and_time_constraints>'
      process:
        - step: understand
          action: 'Parse task requirements and acceptance criteria'
          instruction: 'Identify core functionality, dependencies, and success metrics'
        - step: analyze
          action: 'Assess task complexity and decomposition potential'
          instruction: 'Evaluate technical dependencies, shared resources, and integration points'
        - step: design
          action: 'Create agent boundaries with minimal coupling'
          instruction: 'Define clear interfaces and responsibilities for each agent'
        - step: validate
          action: 'Verify decomposition maintains task integrity'
          instruction: 'Ensure all requirements are covered and integration is feasible'
      output:
        decomposition_plan: 'Agent breakdown with roles and boundaries'
        dependency_map: 'Inter-agent dependencies and execution order'
        integration_strategy: 'Approach for merging agent work'
    conflict_resolution:
      protocol_id: /reasoning.conflict_resolution
      intent: 'Resolve conflicts between parallel agents or during integration'
      input:
        conflict_type: '<merge|dependency|resource|scope>'
        affected_agents: '<list_of_agent_ids>'
        conflict_details: '<specific_conflict_description>'
      process:
        - step: analyze
          root_cause: 'Identify underlying cause of conflict'
          impact: 'Assess scope and severity of conflict'
          alternatives: 'Generate potential resolution strategies'
        - step: evaluate
          trade_offs: 'Compare resolution approaches'
          risks: 'Assess risks of each approach'
          effort: 'Estimate resolution effort and timeline'
        - step: resolve
          strategy: 'Select and implement resolution approach'
          communication: 'Coordinate with affected agents'
          validation: 'Verify resolution maintains quality'
        - step: prevent
          lessons: 'Document lessons learned'
          improvements: 'Update processes to prevent recurrence'
          monitoring: 'Enhance conflict detection mechanisms'
      output:
        resolution: 'Implemented conflict resolution'
        process_updates: 'Improved workflow processes'
        prevention_measures: 'Future conflict prevention strategies'

  # Section 5: Protocols for learning and self-improvement of the system.
  self_improvement_and_learning_protocols:
    workflow_optimization:
      protocol_id: /self.optimize_workflow
      intent: 'Continuously improve parallel development efficiency and quality'
      input:
        workflow_metrics: '<completion_times_and_quality_metrics>'
        feedback: '<developer_and_stakeholder_feedback>'
        bottlenecks: '<identified_process_bottlenecks>'
      process:
        - step: assess
          efficiency: 'Measure current workflow performance'
          quality: 'Evaluate output quality and defect rates'
          satisfaction: 'Gather developer experience feedback'
        - step: identify
          improvements: 'Spot optimization opportunities'
          automation: 'Find tasks suitable for automation'
          simplification: 'Identify unnecessary complexity'
        - step: experiment
          pilots: 'Test improvements in controlled environment'
          measure: 'Track impact of changes'
          iterate: 'Refine based on results'
        - step: integrate
          adoption: 'Roll out successful improvements'
          training: 'Update documentation and guidance'
          monitoring: 'Establish ongoing performance tracking'
      output:
        optimizations: 'Implemented workflow improvements'
        metrics: 'Updated performance baselines'
        documentation: 'Enhanced process documentation'
    agent_learning:
      protocol_id: /self.agent_learning
      intent: 'Learn from agent execution patterns to improve future decomposition'
      input:
        completed_tasks: '<historical_task_data>'
        agent_performance: '<agent_execution_metrics>'
        integration_results: '<merge_success_and_conflict_data>'
      process:
        - step: analyze
          patterns: 'Identify successful decomposition patterns'
          failures: 'Study failed or problematic agent interactions'
          optimization: 'Find areas for improved efficiency'
        - step: synthesize
          best_practices: 'Extract proven approaches'
          anti_patterns: 'Document approaches to avoid'
          guidelines: 'Create actionable guidance'
        - step: adapt
          templates: 'Update agent context templates'
          validation: 'Improve validation criteria'
          processes: 'Refine decomposition and integration processes'
        - step: validate
          testing: 'Test improvements with new tasks'
          feedback: 'Gather developer feedback on changes'
          metrics: 'Measure impact on workflow performance'
      output:
        learned_patterns: 'Documented successful approaches'
        improved_templates: 'Enhanced agent context templates'
        process_refinements: 'Updated workflow procedures'

  # Section 6: Definitions for custom command-line interface protocols.
  custom_command_protocols:
    agent_start:
      protocol_id: /command.agent_start
      intent: 'Initialize agent workspace and begin systematic task execution'
      input:
        workspace_path: '<agent_worktree_directory>'
        context_validation: '<verify_agent_context_exists>'
      process:
        - step: initialize
          action: 'Load agent_context.yaml and validate completeness'
          instruction: 'Parse agent role, deliverables, and validation criteria'
        - step: prepare
          action: 'Set up development environment and context'
          instruction: 'Load relevant codebase context and understand integration points'
        - step: execute
          action: 'Begin systematic execution using explore_plan_test_code_refactor workflow'
          instruction: 'Work through files_to_work_on.txt with real-time checklist updates'
      output:
        agent_session: 'Active agent development session'
        progress_tracking: 'Real-time validation checklist progress'
        development_context: 'Loaded codebase and task context'
    agent_commit:
      protocol_id: /command.agent_commit
      intent: 'Validate completion and safely integrate agent work'
      input:
        workspace_path: '<agent_worktree_directory>'
        custom_message: '<optional_custom_commit_message>'
        validation_override: '<boolean_for_emergency_commits>'
      process:
        - step: validate
          action: 'Verify all validation checklist items are complete'
          instruction: 'Ensure deliverables meet quality standards and pass tests'
        - step: prepare
          action: 'Generate commit message from agent context and work completed'
          instruction: 'Create clear, descriptive commit message with task reference'
        - step: integrate
          action: 'Execute git workflow: add → commit → merge → push'
          instruction: 'Handle merge conflicts and verify integration success'
        - step: cleanup
          action: 'Remove agent worktree after successful merge'
          instruction: 'Clean up temporary files and update project status'
      output:
        integration_result: 'Successful merge confirmation'
        commit_details: 'Commit hash and detailed message'
        workspace_cleanup: 'Confirmation of worktree removal'
    agent_status:
      protocol_id: /command.agent_status
      intent: 'Provide comprehensive view of parallel workflow progress'
      input:
        filter: '<all|active|complete|ready|blocked>'
        workspace_root: '<parallel_development_workspace>'
        detail_level: '<summary|detailed|diagnostic>'
      process:
        - step: discover
          action: 'Scan workspace for all agent directories and contexts'
          instruction: 'Automatically identify agent worktrees and their current state'
        - step: analyze
          action: 'Assess completion status and identify dependencies'
          instruction: 'Calculate progress percentages and identify blockers'
        - step: categorize
          action: 'Group agents by status and readiness for action'
          instruction: 'Classify agents for targeted action recommendations'
        - step: recommend
          action: 'Generate prioritized next steps for workflow advancement'
          instruction: 'Provide specific, actionable recommendations'
      output:
        status_overview: 'Comprehensive agent status report'
        progress_metrics: 'Completion percentages and time estimates'
        action_recommendations: 'Prioritized next steps for workflow progress'

  # Section 7: Protocols for integration and quality assurance.
  integration_and_quality_assurance:
    git_worktree_management:
      protocol_id: /git.worktree_management
      intent: 'Manage git worktrees for isolated parallel development'
      input:
        deployment_plan: '<parallel_deployment_plan>'
        base_branch: '<main_or_development_branch>'
        workspace_root: '<parallel_workspace_directory>'
      process:
        - step: create
          action: 'Spawn isolated worktrees for each agent'
          instruction: 'Create separate directories with independent git state'
        - step: configure
          action: 'Set up agent contexts and working files'
          instruction: 'Initialize agent_context.yaml and validation files'
        - step: monitor
          action: 'Track worktree status and health'
          instruction: 'Monitor for conflicts, space usage, and synchronization'
        - step: cleanup
          action: 'Remove completed worktrees and update references'
          instruction: 'Clean up after successful integration'
      output:
        worktree_environments: 'Isolated development environments'
        configuration_status: 'Agent context setup confirmation'
        management_tracking: 'Worktree health and status monitoring'

  # Section 8: Specific conventions and rules for the project.
  project_specific_conventions:
    bash_commands:
      development_commands:
        code_quality:
          - command: 'npm run lint'
            description: 'ESLint validation (MANDATORY)'
          - command: 'npm run typecheck'
            description: 'TypeScript type checking (MANDATORY)'
          - command: 'npm run test'
            description: 'Jest unit tests (MANDATORY)'
          - command: 'npm run test:e2e'
            description: 'End-to-end tests (MANDATORY)'
          - command: 'npm run prettier:check'
            description: 'Code formatting check (MANDATORY)'
        database:
          - command: 'npm run db:migrate'
            description: 'Run database migrations'
          - command: 'npm run db:seed'
            description: 'Seed development data'
          - command: 'npm run db:reset'
            description: 'Reset database to clean state'
        git_security_check:
          - command: 'npm run security:check'
            description: 'Check for secrets and vulnerabilities'
          - command: 'git secrets --scan'
            description: 'Scan for AWS keys, API tokens, etc.'
    code_style:
      - 'Use consistent indentation (2 spaces)'
      - 'Follow project-specific naming conventions'
      - 'Include JSDoc comments for public functions'
      - 'Write unit tests for new functionality'
      - 'Follow the principle of single responsibility'
      - 'Use descriptive variable and function names'
    git_workflow:
      branch_naming_convention:
        - type: feature
          format: 'feature/[linear-id]-description'
          example: 'feature/PROJ-123-auth-system'
        - type: bugfix
          format: 'bugfix/[linear-id]-description'
          example: 'bugfix/PROJ-456-login-error'
        - type: hotfix
          format: 'hotfix/[linear-id]-description'
          example: 'hotfix/PROJ-789-critical-bug'
        - type: experiment
          format: 'experiment/description'
          example: 'experiment/new-ai-model'
        - type: agent
          format: 'agent/[task-id]-[agent-role]'
          example: 'agent/PROJ-123-backend'
      commit_message_format:
        template: |
          <type>(<scope>): <subject>

          <body>

          <footer>
        rules:
          - 'Types: feat, fix, docs, style, refactor, test, chore'
          - 'Include Linear issue ID: `feat(auth): implement JWT tokens [PROJ-123]`'
          - 'Use emoji prefixes from ai-docs/emoji-commit-ref.md'
      pull_request_process:
        - 'Create PR from feature branch to main'
        - 'Required: All CI checks must pass'
        - 'Required: Code review approval'
        - 'Squash and merge preferred for clean history'
        - 'Delete branch after merge'
      parallel_development_flow:
        - 'Main branch: Always deployable'
        - 'Agent worktrees: Isolated development'
        - 'Integration branch: Optional for complex merges'
        - 'No direct commits to main'
      git_hooks:
        location: '.claude/hooks'
        hooks:
          - event: pre-commit
            action: 'Lint, format, type check'
          - event: commit-msg
            action: 'Validate message format'
          - event: pre-push
            action: 'Run tests, security scan'
    project_structure:
      - path: '/src'
        description: 'Source code'
      - path: '/tests'
        description: 'Test files (E2E)'
      - path: '/docs'
        description: 'Documentation'
      - path: '/scripts'
        description: 'Build and utility scripts'
      - path: '/types'
        description: 'Type definitions'
    critical_rules:
      - 'NO `any` type - Use proper types always'
      - 'NO `.env` in git - Use environment variables'
      - 'NO `git add .` - Add files explicitly'
      - "Delete old code - Don't keep commented code"
      - '500 line limit - Split large files'
      - 'Tests required - For business logic'
    naming_conventions:
      - type: Components
        format: 'PascalCase.tsx'
      - type: Utilities
        format: 'camelCase.ts'
      - type: Routes
        format: 'kebab-case/'
      - type: Database
        format: 'snake_case'
      - type: Test files
        format: 'file.test.ts'
      - type: Docs
        format: 'kebab-case.md'
    required_checks_before_pr:
      - 'All tests pass'
      - 'TypeScript has no errors'
      - 'Biome formatting clean'
      - 'No secrets in code'
      - 'Feature works end-to-end'
  usage_notes:
    title: 'Enhanced CLAUDE.md for Parallel Development'
    description: 'This provides a cognitive operating system for parallel development workflows, enabling:'
    benefits:
      - 'Systematic Thinking: Structured reasoning for complex decomposition decisions'
      - 'Quality Assurance: Built-in validation and improvement mechanisms'
      - 'Scalability: Reusable protocols that adapt to different project types'
      - 'Self-Improvement: Learning mechanisms that optimize workflow over time'
      - 'Integration Safety: Comprehensive conflict resolution and merge protocols'

# Sub-Agent Integration Framework

## Available CDEV Sub-Agents

CDEV integrates with Claude Code's specialized sub-agent system for enhanced functionality:

### Core Sub-Agents
- **`git-flow-manager`**: Git operations, branch management, commit workflows
- **`task-orchestrator`**: Complex task decomposition and workflow coordination  
- **`pr-specialist`**: Pull request creation and review preparation
- **`structure-enforcer`**: Code organization and architectural consistency
- **`quality-guardian`**: Code validation, testing, and quality assurance
- **`doc-curator`**: Documentation creation and maintenance
- **`deep-searcher`**: Advanced codebase analysis and pattern recognition
- **`project-organizer`**: File organization and structural improvements
- **`roadmap-architect`**: Strategic planning and feature roadmaps

### Sub-Agent Activation Requirements

**CRITICAL**: Sub-agents require explicit invocation language to spawn properly:

✅ **Correct Usage:**
- "Use the git-flow-manager sub-agent to handle commit operations"
- "Use the deep-searcher sub-agent to analyze the codebase comprehensively"
- "Use the task-orchestrator sub-agent to break down this complex feature"

❌ **Incorrect (Won't Spawn):**
- "The git-flow-manager will handle commits"
- "Let's use deep searching for analysis"
- "We need task orchestration here"

### Integration Patterns

```yaml
sub_agent_coordination:
  parallel_development:
    - 'Use the task-orchestrator sub-agent to decompose Linear issues'
    - 'Use the git-flow-manager sub-agent to manage agent worktrees'
    - 'Use the quality-guardian sub-agent to validate agent deliverables'
  
  codebase_enhancement:
    - 'Use the structure-enforcer sub-agent to maintain code organization'
    - 'Use the deep-searcher sub-agent for comprehensive pattern analysis'
    - 'Use the project-organizer sub-agent to optimize file structure'
  
  release_management:
    - 'Use the pr-specialist sub-agent to prepare comprehensive pull requests'
    - 'Use the doc-curator sub-agent to update documentation'
    - 'Use the roadmap-architect sub-agent for release planning'
```

# CDEV Quick Start Guide

## Installation & Setup

1. **Install CDEV globally:**
   ```bash
   npm install -g @aojdevstudio/cdev
   ```

2. **Initialize in any project:**
   ```bash
   cdev init
   # Detects project type and installs appropriate Claude Code enhancements
   ```

3. **Verify installation:**
   ```bash
   cdev status
   # Shows installed hooks, commands, and parallel workflow readiness
   ```

## Core Workflows

### Parallel Development
```bash
# Process any task format (Linear, markdown, or plain description)
cdev task "Implement user authentication with JWT and password reset"
# Creates parallel agent deployment plan with isolated worktrees

# Start agent work
cdev agent start backend-auth
# Begins systematic TDD workflow in isolated environment

# Monitor progress
cdev agent status
# Shows completion percentages and next actions

# Integrate completed work
cdev agent commit backend-auth
# Validates, merges, and cleans up automatically
```

### Quality Automation
```bash
# Pre-commit validation (automatic)
git commit -m "feat: add authentication"
# Triggers: lint → typecheck → test → security scan

# Manual quality check
cdev validate
# Runs comprehensive quality gates
```

### Task Processing
```bash
# From Linear ticket
cdev task PROJ-123

# From markdown file  
cdev task @tasks.md

# From plain description
cdev task "Build a REST API for user management"
```

## Development Commands Integration

### Mandatory Quality Checks
- `npm run lint` - ESLint validation
- `npm run typecheck` - TypeScript checking  
- `npm run test` - Jest unit tests
- `npm run test:e2e` - End-to-end tests
- `npm run prettier:check` - Code formatting

### Security Validation
- `npm run security:check` - Vulnerability scanning
- `git secrets --scan` - Secret detection

### Database Operations
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed development data
- `npm run db:reset` - Reset to clean state

## Best Practices

1. **Use explicit sub-agent language** for specialized tasks
2. **Let CDEV detect project type** during initialization
3. **Trust the parallel workflow** for complex features
4. **Leverage quality automation** instead of manual checks
5. **Process tasks in any format** - CDEV handles the conversion

## Troubleshooting

- **Agent won't spawn**: Check for explicit "Use the [agent-name] sub-agent to..." language
- **Hooks not firing**: Verify installation with `cdev status`
- **Quality gates failing**: Run `cdev validate` for detailed feedback
- **Worktree conflicts**: Use `cdev agent status` to identify blockers
```
