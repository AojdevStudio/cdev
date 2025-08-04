# Test Directory Documentation

## Overview

The test directory contains comprehensive test suites for the CDEV (Claude Development) project, providing coverage for all major components of the AI-powered development orchestration system. The tests are organized to validate functionality across configuration management, hook systems, validation, utilities, and installation processes.

## File Structure

```
test/
├── CLAUDE.md                           # This documentation file
├── cli.test.js                         # CLI command interface tests
├── config-generator.test.js            # Configuration generation tests
├── config-migrator.test.js             # Configuration migration tests
├── config-validator.test.js            # Configuration validation tests
├── hook-categorizer.test.js            # Hook categorization system tests
├── hook-manager.test.js                # Hook management functionality tests
├── hook-organizer.test.js              # Hook organization system tests
├── hook-selector.test.js               # Hook selection logic tests
├── hooks-restructure.test.js           # Hook restructuring process tests
├── hooks2rule.test.js                  # Hook-to-rule analysis tests
├── jest-setup.js                       # Jest testing framework setup
├── path-resolver.test.js               # Path resolution utility tests
├── platform-utils.test.js             # Platform-specific utility tests
├── python-detector.test.js             # Python installation detection tests
├── setup.js                           # Additional test environment setup
├── template-engine.test.js             # Template processing system tests
├── validation-rules.test.js            # Validation rule framework tests
├── validator.test.js                   # Main validation system tests
├── fixtures/
│   └── sample-projects.js              # Sample project configurations for testing
└── utils/
    ├── mock-factory.js                 # Mock object factory utilities
    └── test-helpers.js                 # Common test helper functions
```

## Files Documentation

### jest-setup.js

**Purpose**: Global Jest configuration file that sets up the testing environment for all test suites.

**Key Functions**:

- **Global timeout setup**: Sets 60-second timeout for all tests to prevent timeout issues
- **Console mocking**: Silences log/info/debug output during tests while preserving error/warn
- **Custom matchers**: Provides specialized Jest matchers for better test assertions
- **Global mocks**: Sets up mocks for inquirer to prevent interactive prompts

**Important Variables/Constants**:

- `global.console`: Mocked console object with selective method mocking
- `global.testUtils`: Collection of test utility functions
- Custom matchers: `toBeValidPath`, `toEqualIgnoringWhitespace`, `toContainIgnoringWhitespace`, `toContainLineIgnoringIndent`

### setup.js

**Purpose**: Additional test environment setup with comprehensive mocking for DOM and browser APIs.

**Key Functions**:

- **DOM API mocking**: Sets up mocks for localStorage, sessionStorage, matchMedia
- **Browser API mocking**: Provides mocks for ResizeObserver, IntersectionObserver, File APIs
- **Lifecycle management**: Sets up beforeEach/afterEach hooks for test cleanup

**Important Variables/Constants**:

- `global.localStorage`: Mock implementation of browser localStorage
- `global.sessionStorage`: Mock implementation of browser sessionStorage
- `global.fetch`: Mock fetch API for testing HTTP requests
- Mock implementations for File, FileList, URL APIs

### fixtures/sample-projects.js

**Purpose**: Provides sample project configurations representing different project types for comprehensive testing.

**Key Functions**:

- `createSampleProject(projectType, tempDir)`: Creates temporary project directory with specified type
- `getProjectTypes()`: Returns array of available project type names
- `getProjectConfig(projectType)`: Returns configuration for specific project type

**Important Variables/Constants**:

- `sampleProjects`: Object containing configurations for nextjs, react, nodejs, python, minimal, and monorepo projects
- Each project includes package.json, configuration files, and type-specific files

### utils/mock-factory.js

**Purpose**: Factory for creating consistent mock objects across test suites to reduce duplication and ensure reliability.

**Key Functions**:

- `createMockFileSystem(structure)`: Creates comprehensive mock fs module with file system simulation
- `createMockChildProcess(responses)`: Creates mock child_process module with command response mapping
- `createMockInquirer(answers)`: Creates mock inquirer module with predefined prompt answers
- `createMockPlatform(platform)`: Creates mock platform utilities for cross-platform testing
- `createMockLogger()`: Creates mock logger with jest spies
- `createMockEnv(vars)`: Creates mock environment variable handler
- `createMockHttpClient(responses)`: Creates mock HTTP client with URL response mapping
- `createMockTimers()`: Creates mock timer controller for time-based testing

**Important Variables/Constants**:

- Mock implementations maintain state and provide realistic behavior simulation
- All mocks use Jest functions for assertion capabilities

### utils/test-helpers.js

**Purpose**: Common testing utilities and assertion helpers used across multiple test suites.

**Key Functions**:

- `createTempDir(prefix)`: Creates temporary test directory with cleanup function
- `waitFor(condition, timeout, interval)`: Waits for asynchronous conditions with timeout
- `testData.packageJson(overrides)`: Generates valid package.json structures
- `testData.tsConfig(overrides)`: Generates valid TypeScript configuration
- `testData.envFile(vars)`: Generates .env file content
- `testData.linearIssue(overrides)`: Generates Linear issue objects
- `testData.hookConfig(type, config)`: Generates hook configuration objects

**Important Variables/Constants**:

- `customMatchers`: Extended Jest matchers for file system and content assertions
- `assert`: Helper functions for common assertion patterns
- `lifecycle`: Test setup/cleanup utilities
- `spyHelpers`: Utilities for enhanced spy tracking

### cli.test.js

**Purpose**: Tests for the CLI command interface, ensuring proper command handling and help output.

**Entry Points**:

- CLI executable at `bin/cli.js`

**Key Functions**:

- Tests help command output and version display
- Validates error handling for unknown commands
- Ensures proper exit codes and output formatting

### config-generator.test.js

**Purpose**: Tests for the configuration generation system that creates project-specific Claude settings.

**Entry Points**:

- `generateConfig(projectPath, options)`: Main configuration generation function
- `mergeConfigurations(base, overrides)`: Configuration merging logic
- `generateAndWriteConfig(projectPath, options)`: Combined generation and file writing

**Key Functions**:

- `mergeHooks(baseHooks, overrideHooks)`: Merges hook arrays without duplicates
- `deepMerge(target, source)`: Deep merges nested configuration objects
- `writeConfig(filePath, config)`: Writes configuration to file with proper formatting

**Important Variables/Constants**:

- Template system integration for project-type-specific configurations
- Hook merging strategies for configuration inheritance

### config-migrator.test.js

**Purpose**: Tests for the configuration migration system that upgrades legacy settings to current format.

**Entry Points**:

- `migrateConfig(projectPath, options)`: Main migration function from settings.local.json to settings.json
- `checkMigrationStatus(projectPath)`: Checks if migration is needed

**Key Functions**:

- `performMigration(source, target, result)`: Executes the migration process
- `applyMigrationTransformations(config, result)`: Transforms legacy formats to current structure
- `isValidConfiguration(config)`: Validates migrated configuration

**Important Variables/Constants**:

- Migration tracks new/merged keys and transformation changes
- Backup creation and source file handling options

### config-validator.test.js

**Purpose**: Tests for the configuration validation system ensuring settings files meet required schemas.

**Entry Points**:

- `validateConfig(config, options)`: Main configuration validation function
- `validateConfigFile(filePath)`: Validates configuration from file

**Key Functions**:

- `validateRequiredFields(config, errors)`: Checks for required configuration fields
- `validateFieldTypes(config, errors)`: Validates field type constraints
- `validateHooks(hooks, errors, warnings)`: Validates hook structure and events
- `validateEnvironment(environment, errors, warnings)`: Validates environment variables
- `validateTools(tools, errors, warnings)`: Validates tool configurations
- `formatValidationResult(result)`: Formats validation results for display

**Important Variables/Constants**:

- Comprehensive validation rules for all configuration sections
- Support for both string and object hook formats
- Deprecation warnings for legacy configuration fields

### hook-categorizer.test.js

**Purpose**: Tests for the hook categorization system that organizes hooks into tiers based on importance and functionality.

**Entry Points**:

- `HookCategorizer.categorize(hooks)`: Main categorization function

**Key Functions**:

- `determineHookTier(hook)`: Determines tier placement (tier1, tier2, tier3, utils)
- `getHookCategory(hook)`: Categorizes hooks by function (validation, enforcement, etc.)
- `getHookDescription(hook)`: Generates or retrieves hook descriptions
- `analyzeHookContent(content)`: Analyzes hook content for feature detection

**Important Variables/Constants**:

- Tier1: Critical security and validation hooks
- Tier2: Important quality and standards hooks
- Tier3: Optional convenience and notification hooks
- Utils: Shared utilities and helper functions

### hook-manager.test.js

**Purpose**: Tests for the hook management system that coordinates hook installation, categorization, and organization.

**Entry Points**:

- `HookManager.initialize()`: Initializes hook management system
- `HookManager.selectHooks(projectType, preferences)`: Selects appropriate hooks for project

**Key Functions**:

- `loadExistingHooks()`: Loads all Python hooks from the hooks directory
- `installHooks(selectedHooks)`: Copies selected hooks to project
- `getHookStats()`: Returns statistics about available hooks
- `restructureHooks()`: Moves hooks to tier directories

**Important Variables/Constants**:

- Integration with HookCategorizer and HookOrganizer
- Project-type-specific hook selection logic

### hook-organizer.test.js

**Purpose**: Tests for the hook organization system that manages directory structure and hook registry.

**Entry Points**:

- `HookOrganizer.organize(categorizedHooks)`: Main organization function

**Key Functions**:

- `getTargetPath(hook, tier)`: Determines target path for hook placement
- `getCategorizedHooks()`: Loads categorized hooks from registry or directories
- `scanDirectory(dirPath, tier)`: Recursively scans directories for hooks
- `moveHookToTier(hookName, fromTier, toTier)`: Moves hooks between tiers
- `generateManifest()`: Creates hook manifest with metadata

**Important Variables/Constants**:

- `hook-registry.json`: Central registry tracking all hooks and their metadata
- Tier directory structure with README files for documentation

### hook-selector.test.js

**Purpose**: Tests for the hook selection logic that chooses appropriate hooks based on project type and user preferences.

**Entry Points**:

- `HookSelector.selectHooks(categorizedHooks, projectType, preferences)`: Main selection function
- `HookSelector.detectProjectType(projectPath)`: Automatic project type detection

**Key Functions**:

- `getProjectConfig(projectType)`: Returns project-specific hook configuration
- `findHookByName(categorizedHooks, hookName)`: Locates specific hooks across tiers
- `getRecommendations(projectType, existingHooks)`: Suggests missing or beneficial hooks

**Important Variables/Constants**:

- Project configurations for typescript, react, node, python, monorepo, api, and default
- Selection criteria based on importance levels and categories
- Filtering options for includes, excludes, and minimum importance

### hooks-restructure.test.js

**Purpose**: Tests for the hook restructuring process that migrates existing hooks to the new tier-based organization.

**Entry Points**:

- `HooksRestructure.restructure(options)`: Main restructuring process

**Key Functions**:

- `createBackup()`: Creates backup of current hooks before restructuring
- `generateRestructuringPlan(categorizedHooks)`: Creates execution plan for hook moves
- `executePlan(plan)`: Executes the restructuring plan with error handling
- `verify()`: Validates the restructured hook organization
- `restoreFromBackup()`: Restores hooks from backup if needed

**Important Variables/Constants**:

- Plan tracking for moves, creates, preserves, and errors
- Backup management with timestamp-based naming
- Verification of tier directories and hook registry integrity

### hooks2rule.test.js

**Purpose**: Tests for the hook analysis system that converts hook implementations into human-readable rules and documentation.

**Entry Points**:

- `Hooks2Rule.analyze()`: Main analysis process for discovering and converting hooks

**Key Functions**:

- `discoverHooks()`: Discovers both file-based and settings-based hooks
- `discoverFileHooks()`: Scans for Python, shell, and JavaScript hook files
- `discoverSettingsHooks()`: Extracts hooks from settings.json configurations
- `generateRules(hooks)`: Converts hook implementations to rule descriptions
- `analyzeFileHook(hook)`: Analyzes file-based hooks for purpose and behavior
- `analyzeSettingsHook(hook)`: Analyzes settings-based hooks for function

**Important Variables/Constants**:

- Support for multiple hook formats (file and settings-based)
- Content analysis for purpose extraction, event type detection, and behavior analysis
- Output formats: markdown, JSON, and Claude-specific formats

### path-resolver.test.js

**Purpose**: Tests for the path resolution utility that handles cross-platform path operations and directory management.

**Entry Points**:

- `PathResolver.normalizePath(path)`: Cross-platform path normalization
- `PathResolver.resolveHome(path)`: Home directory path resolution

**Key Functions**:

- `getConfigDir(appName)`: Returns platform-specific configuration directory
- `getDataDir(appName)`: Returns platform-specific data directory
- `ensureDir(dirPath)`: Creates directory if it doesn't exist
- `findInPath(executable)`: Searches for executables in system PATH
- `getPlatformInfo()`: Returns comprehensive platform information

**Important Variables/Constants**:

- Platform-specific path handling for Windows, macOS, and Linux
- Support for environment variables (APPDATA, XDG_CONFIG_HOME, etc.)
- Cross-platform path conversion utilities

### platform-utils.test.js

**Purpose**: Tests for platform-specific utilities that handle system operations, permissions, and process management.

**Entry Points**:

- `PlatformUtils.getUserInfo()`: Returns user information including admin privileges
- `PlatformUtils.getSystemInfo()`: Returns comprehensive system information

**Key Functions**:

- `executeCommand(command, options)`: Executes shell commands with proper shell selection
- `openBrowser(url)`: Opens URLs in default browser across platforms
- `getFilePermissions(filePath)`: Gets file permissions in cross-platform format
- `setFilePermissions(filePath, permissions)`: Sets file permissions appropriately
- `createScript(scriptPath, content)`: Creates platform-specific executable scripts
- `killProcess(pid, signal)`: Terminates processes using platform-appropriate methods
- `findProcess(name)`: Finds running processes by name

**Important Variables/Constants**:

- Platform detection for Windows, macOS, and Linux
- Container detection (Docker, containerd)
- WSL (Windows Subsystem for Linux) detection
- Network interface information retrieval

### python-detector.test.js

**Purpose**: Tests for the Python installation detection system that finds and validates Python environments.

**Entry Points**:

- `PythonDetector.detectPythonInstallations()`: Discovers all Python installations
- `PythonDetector.getBestPython()`: Returns the best available Python installation

**Key Functions**:

- `getPythonInfo(pythonPath)`: Extracts detailed information about Python installation
- `compareVersions(version1, version2)`: Compares Python version numbers
- `meetsMinimumVersion(version)`: Checks if version meets minimum requirements
- `createVirtualEnvironment(venvPath)`: Creates virtual environments
- `getPipCommand(pythonInfo)`: Gets pip command for specific Python installation
- `ensurePip(pythonInfo)`: Ensures pip is available for Python installation

**Important Variables/Constants**:

- Platform-specific Python search paths
- Minimum Python version requirements
- Python command variations (python, python3, py)
- Virtual environment and pip management

### template-engine.test.js

**Purpose**: Tests for the template processing system that handles variable substitution and template generation.

**Entry Points**:

- `processTemplate(template, variables)`: Main template processing function
- `loadAndProcessTemplate(filePath, variables)`: Loads and processes templates from files

**Key Functions**:

- `substituteVariables(str, variables)`: Substitutes variables in strings using multiple formats
- `extractVariables(template)`: Extracts variable names from templates
- `validateVariables(template, variables)`: Validates that all required variables are provided
- `createProcessor(defaultVariables)`: Creates reusable template processor
- `getDefaultVariables(options)`: Generates system and project default variables

**Important Variables/Constants**:

- Variable formats: `{{variable}}`, `${variable}`, `%variable%`
- Support for nested object templates and arrays
- Default variables include system info, timestamps, and project metadata

### validation-rules.test.js

**Purpose**: Tests for the validation rule framework that provides extensible validation for configuration and data.

**Entry Points**:

- `ValidationRules.validateValue(value, field, rule, options)`: Main validation function
- `ValidationRules.validateWithRules(value, field, ruleSpecs)`: Validates against multiple rules

**Key Functions**:

- Built-in rules: `required`, `string`, `number`, `boolean`, `array`, `object`
- Format rules: `email`, `url`, `uuid`, `pattern`
- Range rules: `min`, `max`, `range`
- `addRule(name, validator, defaultOptions)`: Adds custom validation rules
- `getAvailableRules()`: Returns list of available validation rules

**Important Variables/Constants**:

- Extensible rule system with custom validator support
- Error collection system for multiple validation failures
- Type-safe validation with comprehensive error messaging

### validator.test.js

**Purpose**: Tests for the main validation system including pre-install, post-install, and general validation functionality.

**Entry Points**:

- `validator.validate(data, schemaName)`: Schema-based validation
- `preInstallValidator.validate()`: Pre-installation environment validation
- `postInstallValidator.validate()`: Post-installation verification

**Key Functions**:

- `validator.defineSchema(name, schema)`: Defines validation schemas
- `validator.isValid(value, rule)`: Quick validation checks
- `validator.validateRequired(data, fields)`: Required field validation
- `preInstallValidator.getReport(result)`: Generates pre-install validation report
- `postInstallValidator.quickCheck()`: Performs quick post-install validation
- `validationReporter.preInstallReport(result)`: Formats pre-install validation results
- `validationReporter.postInstallReport(result)`: Formats post-install validation results

**Important Variables/Constants**:

- Pre-install validation covers Node.js, Python, Git, permissions, disk space
- Post-install validation verifies CLI commands, global packages, project structure, hooks
- Comprehensive reporting with success rates and recommendations

## Test Categories

### Configuration Management Tests

- **config-generator.test.js**: Template-based configuration generation
- **config-migrator.test.js**: Legacy configuration migration
- **config-validator.test.js**: Configuration schema validation

### Hook System Tests

- **hook-categorizer.test.js**: Hook tier and category assignment
- **hook-manager.test.js**: Hook lifecycle management
- **hook-organizer.test.js**: Directory structure and registry management
- **hook-selector.test.js**: Project-specific hook selection
- **hooks-restructure.test.js**: Hook organization migration
- **hooks2rule.test.js**: Hook analysis and documentation

### Utility Tests

- **path-resolver.test.js**: Cross-platform path operations
- **platform-utils.test.js**: System and platform-specific utilities
- **python-detector.test.js**: Python environment detection
- **template-engine.test.js**: Variable substitution and templating
- **validation-rules.test.js**: Extensible validation framework

### Integration Tests

- **cli.test.js**: Command-line interface functionality
- **validator.test.js**: End-to-end validation workflows

### Test Infrastructure

- **jest-setup.js**: Global test environment configuration
- **setup.js**: Additional DOM and browser API mocking
- **fixtures/sample-projects.js**: Sample project configurations
- **utils/mock-factory.js**: Mock object factory
- **utils/test-helpers.js**: Common test utilities

## Testing Patterns

The test suite follows consistent patterns:

- **Mocking**: Comprehensive mocking of file system, child processes, and external dependencies
- **Fixtures**: Reusable sample data for different project types and scenarios
- **Error Handling**: Thorough testing of error conditions and edge cases
- **Cross-Platform**: Platform-specific testing for Windows, macOS, and Linux
- **Async Operations**: Proper handling of asynchronous operations with timeouts
- **Cleanup**: Automatic cleanup of temporary files and directories
- **Isolation**: Tests are isolated and don't depend on external state

This comprehensive test suite ensures the reliability and robustness of the CDEV system across all supported platforms and use cases.
