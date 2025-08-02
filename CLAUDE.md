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

## Current Status

- We are in the middle of a major rewrite to modularize the codebase, improve maintenability, and ensure smooth installation.

### Development Memories

- removing obsolete tests is better than maintaining stale mocks.
- After making changes to existing functionality or adding new features, update existing tests, remove old obsolete tests, build new tests
- When writing code, always add clear, descriptive comments explaining each section. Always group related items together. It is important to explain the purpose of each script, dependency, and configuration. Make it easy to understand for someone who might be overwhelmed by complexity. It should not be too verbose, but it should use complete, concise sentences that an educated person can follow.
- For JSON-related files, make sure to create separate documentation to explain those files, because comments are not approved or allowed in JSON.
- IMPORTANT: proactively aim to adhere to the principle "Don't Repeat Yourself" (DRY), which is a fundamental software development practice designed to eliminate code duplication and redundancy. The main idea is that each piece of knowledge or logic should exist only once in a codebase. If a particular functionality needs to be used in multiple places, it should be implemented in a single, reusable module—like a function, class, or method—and referenced wherever needed
