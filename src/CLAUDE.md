# src/ Directory Documentation

## Overview

The `src/` directory contains the core implementation of the CDEV (Claude Development) system - an AI-powered development orchestration system designed to enhance Claude Code with sophisticated parallel development workflows, intelligent automation, and universal task understanding. This directory houses all the primary modules, configuration management, validation systems, and installation components that power CDEV's functionality.

## File Structure

```
src/
├── cli-commands.js              # Main CLI command execution engine
├── cli-parser.js               # Command line argument parser
├── config.js                   # Central configuration manager
├── config-defaults.js          # Default configuration values and schemas
├── config-generator.js         # Project-specific configuration generation
├── config-loader.js            # Configuration file loading utilities
├── config-migrator.js          # Configuration migration between versions
├── config-validator.js         # Configuration validation logic
├── hook-categorizer.js         # Hook categorization engine (tier-based)
├── hook-manager.js             # Central hook management coordinator
├── hook-organizer.js           # Hook organization and file operations
├── hook-selector.js            # Hook selection based on project requirements
├── hooks-restructure.js        # Hook directory restructuring utilities
├── hooks2rule.js               # Hook to rule conversion utilities
├── install-steps.js            # Installation step orchestration
├── install-utils.js            # Installation utility functions
├── interactive-installer.js    # Interactive installation interface
├── path-resolver.js            # Path resolution utilities
├── platform-utils.js           # Platform-specific utilities
├── post-install-validator.js   # Post-installation validation
├── pre-install-validator.js    # Pre-installation validation
├── python-detector.js          # Python environment detection
├── template-engine.js          # Template processing with variable substitution
├── validation-errors.js        # Validation error collection and management
├── validation-reporter.js      # Validation result reporting
├── validation-rules.js         # Validation rule definitions
├── validator.js                # Main validation interface
├── commands/
│   └── enforce-structure.js    # Root directory structure enforcement
├── constants/                  # (Directory exists but empty)
├── installation/               # (Directory structure for future modularization)
│   ├── generators/
│   ├── installers/
│   ├── steps/
│   └── validators/
├── templates/                  # (Directory structure for future templates)
│   ├── commands/
│   ├── configs/
│   ├── hooks/
│   └── scripts/
└── utils/                      # (Directory structure for future utilities)
    ├── file-system/
    ├── git/
    ├── helpers/
    ├── project/
    └── system/
```

## Files Documentation

### cli-commands.js

**Purpose**: Main CLI command execution engine that handles all CDEV commands and orchestrates the parallel development workflow.

**Entry Points**:

- `executeCommand(args)`: Main command execution dispatcher that routes commands to appropriate handlers

**Key Functions**:

- `installCommand(args, options)`: Handles project initialization and installation using InteractiveInstaller
- `cacheCommand(args, options)`: Caches Linear issues locally using Python scripts
- `decomposeCommand(args, options)`: Decomposes Linear issues into parallel agent tasks
- `spawnCommand(args, options)`: Spawns parallel agents from deployment plans
- `statusCommand(args, options)`: Monitors agent status across all worktrees
- `commitCommand(args, options)`: Commits and manages agent work with automated merging

**Important Variables/Constants**:

- Command mappings support aliases for backward compatibility (e.g., 'cache'/'get', 'decompose'/'split', 'spawn'/'run')

### cli-parser.js

**Purpose**: Robust command line argument parser that handles commands, options, and positional arguments with comprehensive documentation.

**Entry Points**:

- `parseArgs(args)`: Main argument parsing function that returns structured command data
- `showHelp()`: Displays comprehensive help documentation

**Key Functions**:

- `parseArgs(args)`: Processes command line arguments with support for long/short options and boolean flags
- `showHelp()`: Provides detailed usage information and examples for all CDEV commands

**Important Variables/Constants**:

- Supports multiple argument formats: `--option=value`, `--option value`, `-o value`, boolean flags
- Returns structured object: `{ command, options, positional }`

### config.js

**Purpose**: Central configuration management system providing unified access to configuration data across the CDEV system.

**Entry Points**:

- `ConfigManager`: Main configuration management class
- Module exports: `initialize()`, `get()`, `set()`, `save()`, `reset()`, `validate()`

**Key Functions**:

- `initialize(configPath)`: Initializes configuration system with automatic file discovery
- `findConfigFile()`: Searches for configuration files in standard locations
- `loadConfig()`: Loads and merges user configuration with defaults
- `mergeConfigs(defaults, userConfig)`: Deep merges configuration objects
- `get(key, defaultValue)`: Retrieves configuration values with dot notation support
- `set(key, value)`: Sets configuration values with automatic object creation
- `save()`: Persists configuration to file system
- `validate()`: Validates required configuration keys

**Important Variables/Constants**:

- Search paths for config files: project root, home directory (.claude-code-hooks.json)
- Required configuration categories: linear, git, claude

### config-defaults.js

**Purpose**: Comprehensive default configuration system providing sensible defaults for all CDEV components and features.

**Entry Points**:

- `getDefaults()`: Returns complete default configuration object
- `getDefaultsForCategory(category)`: Returns defaults for specific configuration category

**Key Functions**:

- `getDefaults()`: Provides deep-cloned default configuration
- `getDefaultsForCategory(category)`: Retrieves category-specific defaults
- `validateDefaults()`: Ensures all required default categories exist
- `mergeWithDefaults(userConfig)`: Merges user configuration with defaults
- `deepMerge(target, source)`: Performs deep object merging
- `getConfigSchema()`: Returns configuration validation schema

**Important Variables/Constants**:

- `defaults`: Comprehensive configuration object covering linear, git, claude, agent, deployment, validation, hooks, logging, security, performance, and paths
- Default values include API timeouts, Git worktree settings, agent concurrency limits, security restrictions

### config-generator.js

**Purpose**: Generates project-specific configuration based on detected project type and user preferences.

**Entry Points**:

- `generateConfig(projectPath, options)`: Main configuration generation function
- `generateAndWriteConfig(projectPath, options)`: Generates and writes configuration to file

**Key Functions**:

- `generateConfig(projectPath, options)`: Creates configuration using project-type templates and variable substitution
- `mergeConfigurations(base, overrides)`: Intelligently merges base configuration with user overrides
- `mergeHooks(baseHooks, overrideHooks)`: Specialized hook configuration merging
- `deepMerge(target, source)`: Deep object merging utility
- `writeConfig(filePath, config)`: Writes configuration to JSON file with directory creation

**Important Variables/Constants**:

- Template search paths: project-specific templates, fallback to default.json
- Configuration output path: `.claude/settings.json`

### hook-manager.js

**Purpose**: Central hook management coordinator that orchestrates categorization, selection, and organization of hooks across the CDEV installation.

**Entry Points**:

- `HookManager`: Main hook management class
- `initialize()`: Complete hook system setup and organization

**Key Functions**:

- `initialize()`: Coordinates hook discovery, categorization, and tier-based organization
- `ensureHookDirectories()`: Creates tier-based directory structure (tier1, tier2, tier3, utils)
- `loadExistingHooks()`: Discovers and loads existing hook files with metadata
- `selectHooks(projectType, preferences)`: Selects appropriate hooks based on requirements
- `installHooks(selectedHooks)`: Installs selected hooks into project
- `getHookStats()`: Provides statistics and organization information
- `restructureHooks()`: Reorganizes hooks according to tier classification

**Important Variables/Constants**:

- `hooksPath`: Standard hooks directory location (.claude/hooks)
- Tier directories: tier1 (critical), tier2 (important), tier3 (optional), utils (shared)
- Hook components: HookCategorizer, HookSelector, HookOrganizer

### hook-categorizer.js

**Purpose**: Sophisticated hook categorization engine that analyzes hooks and assigns them to appropriate tiers based on functionality and importance.

**Entry Points**:

- `HookCategorizer`: Main categorization class
- `categorize(hooks)`: Main categorization process

**Key Functions**:

- `categorize(hooks)`: Analyzes hooks and categorizes them into tier-based buckets
- `determineHookTier(hook)`: Multi-stage analysis to determine appropriate tier
- `getHookCategory(hook)`: Determines functional category (validation, enforcement, etc.)
- `getHookDescription(hook)`: Generates human-readable descriptions
- `getImportanceLevel(tier)`: Maps tiers to importance levels
- `analyzeHookContent(content)`: Analyzes hook content for categorization hints

**Important Variables/Constants**:

- `categoryRules`: Comprehensive tier classification rules with keywords, patterns, and explicit lists
- Tier 1: Critical security and validation hooks
- Tier 2: Important quality and standards hooks
- Tier 3: Optional convenience and notification hooks
- Utils: Shared utilities and helper functions

### interactive-installer.js

**Purpose**: Interactive installation interface that guides users through CDEV setup with comprehensive configuration options.

**Entry Points**:

- `InteractiveInstaller`: Main installer class
- `install(targetDir, options)`: Main installation orchestration

**Key Functions**:

- `install(targetDir, options)`: Orchestrates complete installation process with error isolation
- `getConfiguration()`: Interactive configuration gathering with detailed hook selection
- `installHooks(targetDir, config)`: Installs tier-based hooks with progress tracking
- `installWorkflowScripts(targetDir, config)`: Installs parallel workflow scripts
- `installAIDocs(targetDir, config)`: Installs AI documentation templates
- `setupLinear(targetDir, config)`: Configures Linear integration
- `installCommands(targetDir, config)`: Installs command templates
- `installAgents(targetDir, config)`: Installs agent configurations
- `validatePackageStructure()`: Validates package integrity before installation

**Important Variables/Constants**:

- Hook tier system with detailed descriptions and recommendations
- Configuration prompts for Linear integration, engineer preferences, branch naming styles
- Essential hooks: pre_tool_use.py, post_tool_use.py, notification.py, stop.py, subagent_stop.py

### template-engine.js

**Purpose**: Powerful template processing system with variable substitution supporting multiple placeholder formats.

**Entry Points**:

- `processTemplate(template, variables)`: Main template processing function
- `createProcessor(defaultVariables)`: Creates template processor with default variables

**Key Functions**:

- `processTemplate(template, variables)`: Recursively processes templates with variable substitution
- `substituteVariables(str, variables)`: Handles multiple variable formats ({{var}}, ${var}, %var%)
- `extractVariables(template)`: Analyzes templates to find required variables
- `validateVariables(template, variables)`: Validates that all required variables are provided
- `loadAndProcessTemplate(filePath, variables)`: Loads and processes template files
- `getDefaultVariables(options)`: Generates system and project default variables

**Important Variables/Constants**:

- Supported variable formats: `{{variable}}`, `${variable}`, `%variable%`
- Default variables include system info, timestamps, project details, user information

### validator.js

**Purpose**: Main validation interface providing schema validation, rule-based validation, and error collection.

**Entry Points**:

- `Validator`: Main validation class
- `validator`: Default validator instance

**Key Functions**:

- `defineSchema(schemaName, schema)`: Defines reusable validation schemas
- `validate(data, schema)`: Validates objects against schemas with comprehensive error reporting
- `validateField(value, fieldPath, fieldSchema)`: Validates individual fields with nested support
- `validateValue(value, field, ruleSpecs)`: Validates single values against rules
- `getNestedValue(obj, path)`: Retrieves values using dot notation
- `setNestedValue(obj, path, value)`: Sets values using dot notation
- `validateRequired(data, requiredFields)`: Validates presence of required fields

**Important Variables/Constants**:

- Integration with ValidationRules and ValidationErrorCollection
- Support for nested object validation and dot notation paths
- Comprehensive error reporting with field-level detail

### commands/enforce-structure.js

**Purpose**: Root directory structure enforcement tool that validates and maintains clean project organization.

**Entry Points**:

- `StructureEnforcer`: Main enforcement class
- CLI interface: `main()` function with command-line options

**Key Functions**:

- `enforce(projectPath)`: Main enforcement process with violation detection and fixing
- `analyzeViolations(projectPath)`: Scans root directory for structure violations
- `fixViolations(projectPath, violations)`: Automatically moves misplaced files
- `generateReport(projectPath)`: Creates detailed compliance reports

**Important Variables/Constants**:

- `allowedMdFiles`: Set of documentation files permitted in root
- `forbiddenPatterns`: Comprehensive patterns for files that should be relocated
- `essentialRootFiles`: Critical files that must remain in root
- `essentialRootDirectories`: Framework directories that must stay in root
- Target locations: config/, scripts/, docs/, archive/ for different file types

## Architecture Notes

### Modular Design

The src/ directory follows a modular architecture with clear separation of concerns:

- **CLI Layer**: Command parsing and execution (cli-\*.js)
- **Configuration Layer**: Config management and generation (config-\*.js)
- **Hook Management**: Comprehensive hook system (hook-\*.js)
- **Validation Layer**: Schema and rule-based validation (validation-\*.js, validator.js)
- **Installation Layer**: Interactive setup and validation (install-\*.js, interactive-installer.js)
- **Utility Layer**: Templates, paths, and platform utilities

### Tier-Based Hook System

The hook management system uses a sophisticated tier-based approach:

- **Tier 1**: Critical security and validation hooks (mandatory)
- **Tier 2**: Important quality and standards hooks (recommended)
- **Tier 3**: Optional convenience hooks (user choice)
- **Utils**: Shared utilities and helper functions

### Configuration Management

Comprehensive configuration system supporting:

- Multiple configuration file formats and locations
- Deep merging of user overrides with defaults
- Project-type specific templates
- Variable substitution and templating
- Validation and schema enforcement

### Future Modularization

The directory structure includes placeholder directories (installation/, templates/, utils/) for future modularization efforts to improve maintainability and organization as the codebase grows.

### Error Handling and Validation

Robust error handling throughout with:

- Comprehensive validation at multiple layers
- Detailed error reporting and collection
- Graceful degradation and recovery mechanisms
- User-friendly error messages and suggestions

## Development Guidelines

1. **Consistency**: All modules follow consistent patterns for exports, error handling, and documentation
2. **Modularity**: Clear separation of concerns with well-defined interfaces
3. **Validation**: Comprehensive validation at all input boundaries
4. **Error Handling**: Graceful error handling with detailed reporting
5. **Documentation**: Extensive inline documentation explaining purpose and usage
6. **Testing**: All modules designed for testability with clear dependencies
