# CDEV Project Context

## What is CDEV?

**CDEV (Claude Development)** is an AI-powered development orchestration system designed to enhance Claude Code with sophisticated parallel development workflows, intelligent automation, and universal task understanding.

### Project Purpose

- **Transform Claude Code workflows** with parallel agent coordination and advanced automation
- **Universal task processing** from Linear tickets, markdown tasks, or plain descriptions
- **Zero-friction setup** with one-command installation for any project type
- **Production-ready distribution** as a global NPM package
  (`@aojdevstudio/cdev`)

## Project Structure

```
    src/
    ├── installation/
    │   ├── index.js                    # Main installation exports
    │   ├── InstallationManager.js      # Core installation orchestrator
    │   ├── validators/
    │   │   ├── index.js               # Validation exports
    │   │   ├── EnvironmentValidator.js # Environment & dependency validation
    │   │   ├── DirectoryValidator.js  # Directory & permissions validation
    │   │   ├── ProjectValidator.js    # Project type & structure validation
    │   │   └── LinearValidator.js     # Linear API validation
    │   ├── generators/
    │   │   ├── index.js               # Generator exports
    │   │   ├── DirectoryGenerator.js  # Directory structure creation
    │   │   ├── ConfigGenerator.js     # Configuration file generation
    │   │   ├── ScriptGenerator.js     # Script file generation
    │   │   ├── HookGenerator.js       # Claude hook generation
    │   │   └── TemplateGenerator.js   # Template file generation
    │   ├── installers/
    │   │   ├── index.js               # Installer exports
    │   │   ├── HookInstaller.js       # Hook installation logic
    │   │   ├── CommandInstaller.js    # Command installation logic
    │   │   ├── AgentInstaller.js      # Agent installation logic
    │   │   ├── WorkflowInstaller.js   # Workflow script installation
    │   │   └── LinearInstaller.js     # Linear integration setup
    │   └── steps/
    │       ├── index.js               # Step exports
    │       ├── ValidationStep.js      # Pre-installation validation
    │       ├── StructureStep.js       # Directory structure setup
    │       ├── TemplateStep.js        # Template copying
    │       ├── ConfigurationStep.js   # Configuration generation
    │       ├── PermissionStep.js      # Permission setup
    │       └── FinalizeStep.js        # Final validation & cleanup
    ├── utils/
    │   ├── index.js                   # Utility exports
    │   ├── file-system/
    │   │   ├── index.js              # File system exports
    │   │   ├── FileOperations.js     # Basic file operations
    │   │   ├── DirectoryOperations.js # Directory operations
    │   │   ├── JsonOperations.js     # JSON file handling
    │   │   └── BackupOperations.js   # Backup functionality
    │   ├── project/
    │   │   ├── index.js              # Project exports
    │   │   ├── ProjectDetector.js    # Project type detection
    │   │   ├── PackageManager.js     # Package manager operations
    │   │   └── FrameworkDetector.js  # Framework detection
    │   ├── system/
    │   │   ├── index.js              # System exports
    │   │   ├── SystemInfo.js         # System information
    │   │   ├── ExecutableFinder.js   # Executable path finding
    │   │   └── PlatformUtils.js      # Platform-specific utilities
    │   └── helpers/
    │       ├── index.js              # Helper exports
    │       ├── StringUtils.js        # String manipulation
    │       ├── ProgressTracker.js    # Progress tracking
    │       ├── RetryHandler.js       # Retry logic
    │       └── Logger.js             # Logging utilities
    ├── templates/
    │   ├── configs/                  # Configuration templates
    │   ├── scripts/                  # Script templates
    │   ├── hooks/                    # Hook templates
    │   └── commands/                 # Command templates
    └── constants/
        ├── index.js                  # All constants
        ├── directories.js            # Directory structure constants
        ├── frameworks.js             # Framework indicators
        └── defaults.js               # Default values
```

### Target Users

Developers using Claude Code who want to:

- Work on multiple parts of features simultaneously through parallel agents
- Automate quality gates and validation with intelligent hooks
- Process any task format (Linear, markdown, plain text) seamlessly
- Enhance their development workflows with AI-powered orchestration

## Hooks

# Tier 1 - Critical Hooks

This tier contains critical security and validation hooks that are essential for project integrity.

## Hooks in this tier:

- **notification.py**: Sends notifications for various events
- **stop.py**: Handles stop events
- **subagent_stop.py**: Handles subagent stop events
- **pre_tool_use.py**: Runs before tool usage
- **post_tool_use.py**: Runs after tool usage

## Characteristics:

- Security-focused
- Validation and enforcement
- Required for all projects
- Cannot be disabled without explicit override

## Usage:

These hooks are automatically included in all project setups unless explicitly excluded.

# Tier 2 - Important Hooks

This tier contains important quality and standards hooks that improve code quality and maintainability.

## Hooks in this tier:

- **api-standards-checker.py**: Checks API code against standards
- **code-quality-reporter.py**: Reports on code quality metrics
- **universal-linter.py**: Runs linting across multiple file types
- **import-organizer.py**: Organizes and sorts import statements

## Characteristics:

- Quality-focused
- Standards enforcement
- Recommended for most projects
- Can be selectively disabled

## Usage:

These hooks are recommended for all projects but can be excluded based on project needs.

# Tier 3 - Optional Hooks

This tier contains optional convenience and notification hooks that provide additional functionality.

## Hooks in this tier:

- **commit-message-validator.py**: Validates commit message format and content
- **typescript-validator.py**: Validates TypeScript code and type safety
- **task-completion-enforcer.py**: Ensures tasks are completed before proceeding
- **pnpm-enforcer.py**: Enforces use of pnpm package manager
- **auto-changelog-updater.py**: Updates the changelog with the latest changes.

## Characteristics:

- Convenience features
- Optional enhancements
- Project-specific utilities
- Can be freely enabled/disabled

## Usage:

These hooks are optional and can be selectively enabled based on project requirements and developer preferences.

**Configuring Logging**

All hooks must implement logging. Every hook in the CDEV system must record every event with timestamp and session ID. All hooks must:

1. Import datetime: `from datetime import datetime`
2. Ensure logs directory exists: `log_dir = Path.cwd() / 'logs'` and `log_dir.mkdir(parents=True, exist_ok=True)`
3. Define log file path: `log_path = log_dir / '<hook_name>.json'`

```python
        # Ensure log directory exists
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'post_tool_use.json'

        # Read existing log data or initialize empty list
        if log_path.exists():
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []

        # Add timestamp to the log entry
        timestamp = datetime.now().strftime("%b %d, %I:%M%p").lower()
        input_data['timestamp'] = timestamp

        # Append new data
        log_data.append(input_data)

        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
```

## Current Status

- We are in the middle of a major rewrite to modularize the codebase, improve maintenability, and ensure smooth installation.

### Development Memories

- removing obsolete tests is better than maintaining stale mocks.
- After making changes to existing functionality or adding new features, update existing tests, remove old obsolete tests, build new tests
- When writing code, always add clear, descriptive comments explaining each section. Always group related items together. It is important to explain the purpose of each script, dependency, and configuration. Make it easy to understand for someone who might be overwhelmed by complexity. It should not be too verbose, but it should use complete, concise sentences that an educated person can follow.
- For JSON-related files, make sure to create separate documentation to explain those files, because comments are not approved or allowed in JSON.
- IMPORTANT: proactively aim to adhere to the principle "Don't Repeat Yourself" (DRY), which is a fundamental software development practice designed to eliminate code duplication and redundancy. The main idea is that each piece of knowledge or logic should exist only once in a codebase. If a particular functionality needs to be used in multiple places, it should be implemented in a single, reusable module—like a function, class, or method—and referenced wherever needed

- respect the @ai-docs/naming-conventions.md
