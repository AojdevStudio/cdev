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
          "agentId": {"type": "string"},
          "role": {"type": "string"},
          "focusArea": {"type": "string"},
          "dependencies": {"type": "array"},
          "estimatedTime": {"type": "number"},
          "canStartImmediately": {"type": "boolean"}
        }
      }
    },
    "integration": {
      "type": "object",
      "properties": {
        "mergeStrategy": {"type": "string"},
        "testingRequired": {"type": "boolean"},
        "riskAssessment": {"type": "string"}
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
        "agentId": {"type": "string"},
        "taskId": {"type": "string"}, 
        "agentRole": {"type": "string"},
        "focusArea": {"type": "string"},
        "branchName": {"type": "string"}
      }
    },
    "execution": {
      "type": "object",
      "properties": {
        "canStartImmediately": {"type": "boolean"},
        "dependencies": {"type": "array"},
        "estimatedTime": {"type": "number"}
      }
    },
    "deliverables": {
      "type": "object", 
      "properties": {
        "filesToCreate": {"type": "array"},
        "filesToModify": {"type": "array"},
        "validationCriteria": {"type": "array"},
        "testContracts": {"type": "array"}
      }
    }
  }
}
```

## 2. Parallel Development Protocols

### Linear Issue Processing Protocol

```HOCON
/workflow.linear_issue_processing{
  intent="Transform Linear issues into executable parallel development plans",
  input={
    task_id="<linear_task_identifier>",
    requirements="<task_requirements_and_context>"
  },
  process=[
    /cache{
      action="Retrieve and cache Linear issue details",
      instruction="Store complete task context including requirements, acceptance criteria, and dependencies"
    },
    /analyze{
      action="Assess task complexity and parallelizability", 
      instruction="Determine if task can be effectively decomposed into parallel agents"
    },
    /decompose{
      action="Break task into independent agent workstreams",
      instruction="Create agent specifications with clear boundaries and minimal dependencies"
    },
    /validate{
      action="Verify decomposition feasibility and integration strategy",
      instruction="Ensure agents can work independently and merge cleanly"
    }
  ],
  output={
    deployment_plan="Complete parallel development plan",
    agent_contexts="Individual agent context files",
    integration_strategy="Merge and testing approach"
  }
}
```

### Agent Workflow Protocol

```
/workflow.explore_plan_test_code_refactor_commit{
  intent="Implement comprehensive TDD approach with parallel agent coordination",
  input={
    agent_context="<agent_context.json>",
    workspace_path="<agent_worktree_path>",
    validation_checklist="<validation_checklist.txt>"
  },
  process=[
    /explore{
      action="Read agent context and understand assigned role and deliverables",
      instruction="Analyze codebase, existing patterns, and integration points but don't write code yet"
    },
    /plan{
      action="Create detailed implementation plan with test strategy",
      instruction="Use extended thinking to evaluate alternatives and define acceptance criteria from validation checklist"
    },
    /write_tests{
      action="Create comprehensive test cases based on validation criteria",
      instruction="Define expected behavior and test contracts before implementation"
    },
    /implement{
      action="Write code to fulfill agent role and make tests pass",
      instruction="Follow files_to_work_on.txt systematically, verify correctness at each step"
    },
    /refactor{
      action="Improve code quality while maintaining passing tests",
      instruction="Clean up implementation without changing behavior, update validation checklist"
    },
    /commit{
      action="Commit agent work with dependency-aware integration",
      instruction="Generate clear commit messages from agent context, prepare for merge"
    }
  ],
  output={
    tests="Comprehensive test suite for agent deliverables",
    implementation="Working code that fulfills agent role",
    refactored_code="Clean, maintainable implementation", 
    validation_evidence="Completed validation checklist with evidence",
    integration_artifacts="Commit message, PR details, and merge readiness"
  }
}
```

### Agent Orchestration Protocol

```
/workflow.agent_orchestration{
  intent="Coordinate multiple parallel agents and manage integration workflow",
  input={
    deployment_plan="<task-deployment-plan.json>",
    workspace_root="<parallel_development_workspace>"
  },
  process=[
    /spawn{
      action="Create isolated git worktrees for each agent",
      instruction="Generate agent contexts and initialize independent working directories"
    },
    /monitor{
      action="Track agent progress and dependency resolution",
      instruction="Monitor validation checklist completion and identify integration readiness"
    },
    /coordinate{
      action="Manage dependencies and agent handoffs",
      instruction="Ensure agents can proceed without conflicts and handle sequential dependencies"
    },
    /integrate{
      action="Merge completed agent work into main branch",
      instruction="Validate integration, run tests, and ensure clean merge without conflicts"
    }
  ],
  output={
    agent_worktrees="Isolated development environments",
    progress_tracking="Real-time agent status and completion metrics",
    integration_results="Successful merge and validation results"
  }
}
```
## 3. Agent Management Tools

### Agent Context Analysis Protocol

```
/agent.analyze_context{
  intent="Deep analysis of agent context and role validation",
  input={
    agent_context="<agent_context.json>",
    codebase_context="<relevant_project_files>"
  },
  process=[
    /parse{
      identity="Extract agent ID, role, and focus area",
      deliverables="Identify files to create/modify and validation criteria",
      dependencies="Map agent dependencies and execution readiness"
    },
    /validate{
      feasibility="Assess if agent role is clearly defined and achievable",
      scope="Verify agent scope is appropriate and not overlapping",
      integration="Confirm integration points are well-defined"
    },
    /optimize{
      efficiency="Identify opportunities to streamline agent work",
      quality="Ensure validation criteria are comprehensive",
      risks="Assess potential integration challenges"
    }
  ],
  output={
    context_analysis="Comprehensive agent context assessment",
    recommendations="Suggested improvements or adjustments",
    readiness_status="Agent readiness for immediate execution"
  }
}
```

### Agent Status Monitoring Protocol

```
/agent.monitor_status{
  intent="Track progress across all parallel agents and identify next actions",
  input={
    workspace_root="<parallel_workspace_path>",
    filter="<status_filter: all|active|complete|ready|blocked>"
  },
  process=[
    /discover{
      action="Scan for all agent worktrees and contexts",
      instruction="Automatically identify active agent directories and their status"
    },
    /assess{
      action="Evaluate completion percentage and blockers",
      instruction="Check validation checklists and identify dependencies"
    },
    /categorize{
      action="Group agents by status and readiness",
      instruction="Classify as ready-to-start, in-progress, ready-to-commit, or blocked"
    },
    /recommend{
      action="Provide actionable next steps",
      instruction="Suggest specific actions to advance workflow progress"
    }
  ],
  output={
    status_report="Comprehensive agent status overview",
    progress_metrics="Completion percentages and time estimates",
    action_items="Prioritized list of next steps"
  }
}
```

### Agent Integration Protocol

```
/agent.integration_workflow{
  intent="Safely merge agent work while maintaining code quality",
  input={
    agent_workspace="<agent_worktree_path>",
    validation_complete="<boolean>",
    custom_message="<optional_commit_message>"
  },
  process=[
    /validate{
      checklist="Verify all validation criteria are met",
      tests="Ensure all tests pass in agent workspace",
      conflicts="Check for potential merge conflicts"
    },
    /prepare{
      commit="Generate clear commit message from agent context",
      documentation="Update relevant documentation",
      cleanup="Prepare workspace for merge"
    },
    /merge{
      branch="Switch to main branch and merge agent work",
      resolve="Handle any merge conflicts systematically",
      verify="Run integration tests post-merge"
    },
    /finalize{
      push="Push merged changes to remote",
      cleanup="Remove agent worktree after successful merge",
      notify="Update project status and stakeholders"
    }
  ],
  output={
    merge_result="Successful integration confirmation",
    commit_details="Commit hash and message details",
    cleanup_status="Worktree cleanup completion"
  }
}
```

## 4. Reasoning & Decision Making Protocols

### Task Decomposition Reasoning Protocol

```
/reasoning.task_decomposition{
  intent="Systematically analyze tasks for optimal parallel decomposition",
  input={
    task="<linear_task_description>",
    codebase="<project_context>",
    constraints="<technical_and_time_constraints>"
  },
  process=[
    /understand{
      action="Parse task requirements and acceptance criteria",
      instruction="Identify core functionality, dependencies, and success metrics"
    },
    /analyze{
      action="Assess task complexity and decomposition potential",
      instruction="Evaluate technical dependencies, shared resources, and integration points"
    },
    /design{
      action="Create agent boundaries with minimal coupling",
      instruction="Define clear interfaces and responsibilities for each agent"
    },
    /validate{
      action="Verify decomposition maintains task integrity",
      instruction="Ensure all requirements are covered and integration is feasible"
    }
  ],
  output={
    decomposition_plan="Agent breakdown with roles and boundaries",
    dependency_map="Inter-agent dependencies and execution order",
    integration_strategy="Approach for merging agent work"
  }
}
```

### Agent Conflict Resolution Protocol

```
/reasoning.conflict_resolution{
  intent="Resolve conflicts between parallel agents or during integration",
  input={
    conflict_type="<merge|dependency|resource|scope>",
    affected_agents="<list_of_agent_ids>",
    conflict_details="<specific_conflict_description>"
  },
  process=[
    /analyze{
      root_cause="Identify underlying cause of conflict",
      impact="Assess scope and severity of conflict",
      alternatives="Generate potential resolution strategies"
    },
    /evaluate{
      trade_offs="Compare resolution approaches",
      risks="Assess risks of each approach",
      effort="Estimate resolution effort and timeline"
    },
    /resolve{
      strategy="Select and implement resolution approach",
      communication="Coordinate with affected agents",
      validation="Verify resolution maintains quality"
    },
    /prevent{
      lessons="Document lessons learned",
      improvements="Update processes to prevent recurrence",
      monitoring="Enhance conflict detection mechanisms"
    }
  ],
  output={
    resolution="Implemented conflict resolution",
    process_updates="Improved workflow processes",
    prevention_measures="Future conflict prevention strategies"
  }
}
```

## 5. Self-Improvement & Learning Protocols

### Workflow Optimization Protocol

```
/self.optimize_workflow{
  intent="Continuously improve parallel development efficiency and quality",
  input={
    workflow_metrics="<completion_times_and_quality_metrics>",
    feedback="<developer_and_stakeholder_feedback>",
    bottlenecks="<identified_process_bottlenecks>"
  },
  process=[
    /assess{
      efficiency="Measure current workflow performance",
      quality="Evaluate output quality and defect rates",
      satisfaction="Gather developer experience feedback"
    },
    /identify{
      improvements="Spot optimization opportunities",
      automation="Find tasks suitable for automation",
      simplification="Identify unnecessary complexity"
    },
    /experiment{
      pilots="Test improvements in controlled environment",
      measure="Track impact of changes",
      iterate="Refine based on results"
    },
    /integrate{
      adoption="Roll out successful improvements",
      training="Update documentation and guidance",
      monitoring="Establish ongoing performance tracking"
    }
  ],
  output={
    optimizations="Implemented workflow improvements",
    metrics="Updated performance baselines",
    documentation="Enhanced process documentation"
  }
}
```

### Agent Learning Protocol

```
/self.agent_learning{
  intent="Learn from agent execution patterns to improve future decomposition",
  input={
    completed_tasks="<historical_task_data>",
    agent_performance="<agent_execution_metrics>",
    integration_results="<merge_success_and_conflict_data>"
  },
  process=[
    /analyze{
      patterns="Identify successful decomposition patterns",
      failures="Study failed or problematic agent interactions",
      optimization="Find areas for improved efficiency"
    },
    /synthesize{
      best_practices="Extract proven approaches",
      anti_patterns="Document approaches to avoid",
      guidelines="Create actionable guidance"
    },
    /adapt{
      templates="Update agent context templates",
      validation="Improve validation criteria",
      processes="Refine decomposition and integration processes"
    },
    /validate{
      testing="Test improvements with new tasks",
      feedback="Gather developer feedback on changes",
      metrics="Measure impact on workflow performance"
    }
  ],
  output={
    learned_patterns="Documented successful approaches",
    improved_templates="Enhanced agent context templates",
    process_refinements="Updated workflow procedures"
  }
}
```

## 6. Custom Command Protocols

### /agent-start Command Protocol

```
/command.agent_start{
  intent="Initialize agent workspace and begin systematic task execution",
  input={
    workspace_path="<agent_worktree_directory>",
    context_validation="<verify_agent_context_exists>"
  },
  process=[
    /initialize{
      action="Load agent_context.json and validate completeness",
      instruction="Parse agent role, deliverables, and validation criteria"
    },
    /prepare{
      action="Set up development environment and context",
      instruction="Load relevant codebase context and understand integration points"
    },
    /execute{
      action="Begin systematic execution using explore_plan_test_code_refactor workflow",
      instruction="Work through files_to_work_on.txt with real-time checklist updates"
    }
  ],
  output={
    agent_session="Active agent development session",
    progress_tracking="Real-time validation checklist progress",
    development_context="Loaded codebase and task context"
  }
}
```

### /agent-commit Command Protocol

```
/command.agent_commit{
  intent="Validate completion and safely integrate agent work",
  input={
    workspace_path="<agent_worktree_directory>",
    custom_message="<optional_custom_commit_message>",
    validation_override="<boolean_for_emergency_commits>"
  },
  process=[
    /validate{
      action="Verify all validation checklist items are complete",
      instruction="Ensure deliverables meet quality standards and pass tests"
    },
    /prepare{
      action="Generate commit message from agent context and work completed",
      instruction="Create clear, descriptive commit message with task reference"
    },
    /integrate{
      action="Execute git workflow: add → commit → merge → push",
      instruction="Handle merge conflicts and verify integration success"
    },
    /cleanup{
      action="Remove agent worktree after successful merge",
      instruction="Clean up temporary files and update project status"
    }
  ],
  output={
    integration_result="Successful merge confirmation",
    commit_details="Commit hash and detailed message",
    workspace_cleanup="Confirmation of worktree removal"
  }
}
```

### /agent-status Command Protocol

```
/command.agent_status{
  intent="Provide comprehensive view of parallel workflow progress",
  input={
    filter="<all|active|complete|ready|blocked>",
    workspace_root="<parallel_development_workspace>",
    detail_level="<summary|detailed|diagnostic>"
  },
  process=[
    /discover{
      action="Scan workspace for all agent directories and contexts",
      instruction="Automatically identify agent worktrees and their current state"
    },
    /analyze{
      action="Assess completion status and identify dependencies",
      instruction="Calculate progress percentages and identify blockers"
    },
    /categorize{
      action="Group agents by status and readiness for action",
      instruction="Classify agents for targeted action recommendations"
    },
    /recommend{
      action="Generate prioritized next steps for workflow advancement",
      instruction="Provide specific, actionable recommendations"
    }
  ],
  output={
    status_overview="Comprehensive agent status report",
    progress_metrics="Completion percentages and time estimates",
    action_recommendations="Prioritized next steps for workflow progress"
  }
}
```

## 7. Integration & Quality Assurance

### Git Worktree Management Protocol

```
/git.worktree_management{
  intent="Manage git worktrees for isolated parallel development",
  input={
    deployment_plan="<parallel_deployment_plan>",
    base_branch="<main_or_development_branch>",
    workspace_root="<parallel_workspace_directory>"
  },
  process=[
    /create{
      action="Spawn isolated worktrees for each agent",
      instruction="Create separate directories with independent git state"
    },
    /configure{
      action="Set up agent contexts and working files",
      instruction="Initialize agent_context.json and validation files"
    },
    /monitor{
      action="Track worktree status and health",
      instruction="Monitor for conflicts, space usage, and synchronization"
    },
    /cleanup{
      action="Remove completed worktrees and update references",
      instruction="Clean up after successful integration"
    }
  ],
  output={
    worktree_environments="Isolated development environments",
    configuration_status="Agent context setup confirmation",
    management_tracking="Worktree health and status monitoring"
  }
}
```

## 8. Project-Specific Conventions

### Bash Commands

```bash
# Development Commands

# Code Quality (MANDATORY - All must pass)
npm run lint           # ESLint validation
npm run typecheck      # TypeScript type checking
npm run test           # Jest unit tests
npm run test:e2e       # End-to-end tests
npm run prettier:check # Code formatting check

# Database
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed development data
npm run db:reset       # Reset database to clean state

# Git Security Check
npm run security:check # Check for secrets and vulnerabilities
git secrets --scan     # Scan for AWS keys, API tokens, etc.
```
### Code Style
- Use consistent indentation (2 spaces)
- Follow project-specific naming conventions
- Include JSDoc comments for public functions
- Write unit tests for new functionality
- Follow the principle of single responsibility
- Use descriptive variable and function names 

### Git Workflow

1. **Branch Naming Convention**
   - Features: `feature/[linear-id]-description` (e.g., `feature/PROJ-123-auth-system`)
   - Bugfixes: `bugfix/[linear-id]-description` (e.g., `bugfix/PROJ-456-login-error`)
   - Hotfixes: `hotfix/[linear-id]-description` (e.g., `hotfix/PROJ-789-critical-bug`)
   - Experiments: `experiment/description` (e.g., `experiment/new-ai-model`)
   - Agent branches: `agent/[task-id]-[agent-role]` (e.g., `agent/PROJ-123-backend`)

2. **Commit Message Format**
   ```
   <type>(<scope>): <subject>
   
   <body>
   
   <footer>
   ```
   - Types: feat, fix, docs, style, refactor, test, chore
   - Include Linear issue ID: `feat(auth): implement JWT tokens [PROJ-123]`
   - Use emoji prefixes from ai-docs/emoji-commit-ref.md

3. **Pull Request Process**
   - Create PR from feature branch to main
   - Required: All CI checks must pass
   - Required: Code review approval
   - Squash and merge preferred for clean history
   - Delete branch after merge

4. **Parallel Development Flow**
   - Main branch: Always deployable
   - Agent worktrees: Isolated development
   - Integration branch: Optional for complex merges
   - No direct commits to main

5. **Git Hooks (via .claude/hooks)**
   - Pre-commit: Lint, format, type check
   - Commit-msg: Validate message format
   - Pre-push: Run tests, security scan

### Project Structure
- `/src`: Source code
- `/tests`: Test files (E2E)
- `/docs`: Documentation
- `/scripts`: Build and utility scripts
- `/types`: Type definitions

### Critical Rules
- **NO `any` type** - Use proper types always
- **NO `.env` in git** - Use environment variables
- **NO `git add .`** - Add files explicitly
- **Delete old code** - Don't keep commented code
- **500 line limit** - Split large files
- **Tests required** - For business logic

### Naming Conventions
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Routes: `kebab-case/`
- Database: `snake_case`
- Test files: `file.test.ts`
- Docs: `kebab-case.md`

### Required Checks Before PR
- All tests pass  
- TypeScript has no errors  
- Biome formatting clean  
- No secrets in code  
- Feature works end-to-end

## Usage Notes

This enhanced CLAUDE.md provides a cognitive operating system for parallel development workflows. The protocol-based structure enables:

- **Systematic Thinking**: Structured reasoning for complex decomposition decisions
- **Quality Assurance**: Built-in validation and improvement mechanisms  
- **Scalability**: Reusable protocols that adapt to different project types
- **Self-Improvement**: Learning mechanisms that optimize workflow over time
- **Integration Safety**: Comprehensive conflict resolution and merge protocols
