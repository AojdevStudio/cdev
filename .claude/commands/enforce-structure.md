---
allowed-tools: Read, Write, Edit, Bash, LS, Glob
description: Validates and enforcts clean root directory structure with automatic file organization
---

# Enforce Structure

This command validates and enforces clean root directory structure by scanning for misplaced files and automatically moving them to appropriate locations according to project conventions.

**variables:**
Options: $ARGUMENTS

**Usage Examples:**

- `/enforce-structure` - **Automatically fix all structure violations (DEFAULT)**
- `/enforce-structure --dry-run` - Preview what would be moved without making changes
- `/enforce-structure --report` - Generate detailed report after fixes

```yaml
# Protocol for enforcing and maintaining clean project directory structure
enforce_structure_protocol:
  # The sequence of actions the command should perform upon execution
  execution_flow:
    - step: 1
      action: "Parse command arguments and determine operation mode"
      details: "Default is FIX mode - only --dry-run and --report flags available"
    - step: 2
      action: "Deploy root_scanner and deep_scanner agents IN PARALLEL using Task tool"
      details: "Both agents scan simultaneously - root for misplaced files, deep for nested violations"
    - step: 3
      action: "Execute file movements immediately upon violation discovery"
      details: "Move files to correct locations: config/, scripts/, docs/, archive/ as violations are found"
    - step: 4
      action: "Clean up temporary files and gitignored cache"
      details: "Remove __pycache__, temp files, and other cleanup items"
    - step: 5
      action: "Validate all moves completed successfully and report final state"
      details: "Confirm root directory now complies with structure rules"

  # Defines the context, references, and validation rules
  operational_context:
    current_state:
      - name: "Root directory contents"
        command: "ls -la"
        description: "Current state of root directory to identify violations"
      - name: "Existing directory structure" 
        command: "find . -maxdepth 2 -type d | head -20"
        description: "Current directory structure for target validation"
    
    parallel_strategy:
      division_method: "by_directory"
      max_subagents: 4
      coordination: "merge_results_before_execution"
      subagent_assignments:
        - agent_id: "root_scanner"
          scope: "Root level files and immediate subdirectories"
          focus: "Identify misplaced config, script, and documentation files"
        - agent_id: "deep_scanner"
          scope: "Nested directories and subdirectory contents"
          focus: "Find temporary files and incorrectly nested content"
        - agent_id: "validation_agent"
          scope: "Target directories and file movement validation"
          focus: "Ensure target directories exist and validate move operations"
        - agent_id: "integration_agent"
          scope: "Post-move validation and summary reporting"
          focus: "Confirm successful moves and generate final report"
      coordination_protocol:
        - "Root scanner identifies violations in root directory"
        - "Deep scanner finds issues in subdirectories"
        - "Validation agent prepares target directories"
        - "All agents coordinate through shared violation tracking"
        - "Integration agent merges results and executes final actions"
    
    structure_rules:
      essential_directories:
        - name: "ai-docs/"
          description: "Framework AI documentation and templates"
          must_stay_root: true
        - name: "src/"
          description: "Source code"
          must_stay_root: true
        - name: "test/"
          description: "Test files"
          must_stay_root: true
        - name: ".claude/"
          description: "Claude configuration"
          must_stay_root: true
        - name: "config/"
          description: "Configuration files"
          must_stay_root: true
        - name: "scripts/"
          description: "Utility scripts"
          must_stay_root: true
        - name: "docs/"
          description: "Project documentation"
          must_stay_root: true
      
      allowed_root_files:
        - "README.md"
        - "CHANGELOG.md"
        - "CLAUDE.md"
        - "ROADMAP.md"
        - "SECURITY.md"
        - "LICENSE.md"
        - "package.json"
        - "package-lock.json"
        - ".gitignore"
        - ".gitattributes"
      
      relocation_rules:
        config_files:
          target_directory: "config/"
          patterns:
            - "jest.config*.js"
            - "babel.config.js"
            - "webpack.config*.js"
            - "tsconfig*.json"
            - "docker-compose.yml"
            - "Dockerfile"
        script_files:
          target_directory: "scripts/"
          patterns:
            - "*.sh"
            - "build.js"
            - "deploy.js"
          special_cases:
            - pattern: "publish.js"
              target: "scripts/deployment/"
        documentation_files:
          target_directory: "docs/"
          patterns:
            - "USAGE.md"
            - "CONTRIBUTING.md"
            - "ARCHITECTURE.md"
            - "API.md"
            - "*-report.md"
            - "*-plan.md"
        temporary_files:
          target_directory: "archive/"
          patterns:
            - "debug-*.js"
            - "test-*.js"
            - "temp-*"
    
    operation_modes:
      default:
        description: "DEFAULT: Automatically fix all structure violations"
        actions: ["scan", "move", "validate", "report"]
      dry_run:
        description: "Preview mode that shows what would be moved"
        flag: "--dry-run" 
        actions: ["scan", "preview", "report"]
      report:
        description: "Generate detailed report after fixing violations"
        flag: "--report"
        actions: ["scan", "move", "validate", "detailed_report"]
        output_format: "detailed_json"

  # Validation conditions and error handling
  validation:
    pre_conditions:
      - "Working directory is project root (contains .claude/ or package.json)"
      - "User has write permissions if using --fix mode"
      - "Target directories exist or can be created"
    
    post_conditions:
      - "All misplaced files moved to appropriate locations"
      - "Root directory contains only allowed files and directories"
      - "No broken symlinks or invalid references created"
    
    safety_checks:
      - "Never move files that are actively being used by running processes"
      - "Create backup references for moved files in critical directories"
      - "Validate file permissions are preserved during moves"

  # Error handling strategies
  error_handling:
    - error: "PermissionDenied"
      action: "Report files that couldn't be moved and suggest manual intervention"
    - error: "FileInUse"
      action: "Skip file and report it requires manual attention"
    - error: "TargetDirectoryNotFound"
      action: "Create target directory with appropriate permissions"
    - error: "DuplicateFileName"
      action: "Add timestamp suffix to prevent overwrites"

  # Integration with project hooks and automation
  integration:
    hook_prevention:
      description: "Works with pre_tool_use.py hook to prevent violations"
      benefits:
        - "Automatic prevention of unauthorized file creation"
        - "Clear error messages explaining structure rules"
        - "Suggestions for using /enforce-structure --fix"
    
    automation_support:
      - "JSON report format enables CI/CD integration"
      - "Exit codes indicate success/failure for scripting"
      - "Dry-run mode supports safe automated checks"
```
