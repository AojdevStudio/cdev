Architecture Overview

    I'll break down the code into a modular, DRY-compliant architecture:

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
    │   │   ├── FileOperations.js    # Basic file operations
    │   │   ├── DirectoryOperations.js # Directory operations
    │   │   ├── JsonOperations.js     # JSON file handling
    │   │   └── BackupOperations.js   # Backup functionality
    │   ├── git/
    │   │   ├── index.js              # Git exports
    │   │   ├── GitDetector.js        # Git repository detection
    │   │   ├── GitInfo.js            # Git information extraction
    │   │   └── GitHooks.js           # Git hook management
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


    Detailed Refactoring Steps

    1. Extract Validators (from install-steps.js)

    - EnvironmentValidator.js: Lines 78-135 (validateEnvironment)
    - DirectoryValidator.js: Lines 27-69 (validateTargetDirectory)
    - ProjectValidator.js: Extract project validation logic
    - LinearValidator.js: Linear-specific validation

    2. Extract Generators (from install-steps.js)

    - DirectoryGenerator.js: Lines 145-172 (createDirectoryStructure)
    - ConfigGenerator.js: Lines 342-588 (configuration file creation)
    - ScriptGenerator.js: Lines 244-299 (createEssentialScripts)
    - HookGenerator.js: Lines 682-716 (installClaudeHooks)
    - TemplateGenerator.js: Lines 180-236 (copyWorkflowTemplates)

    3. Refactor Utilities (from install-utils.js)

    - FileOperations.js: Basic file operations (read, write, copy)
    - DirectoryOperations.js: Directory checks and operations
    - JsonOperations.js: JSON file handling (lines 420-548)
    - GitDetector.js: Git-related detection (lines 82-140)
    - ProjectDetector.js: Project type detection (lines 352-401)
    - SystemInfo.js: System information gathering (lines 635-672)

    4. Create Reusable Components

    - ProgressTracker: Extract from utils (lines 759-788)
    - RetryHandler: Extract retry logic (lines 809-830)
    - BackupOperations: Extract backup functionality (lines 256-273)

    5. Implement Step-Based Architecture

    Each installation step becomes a self-contained module:
    // Example: ValidationStep.js
    class ValidationStep {
      constructor(validators) {
        this.validators = validators;
      }

      async execute(context) {
        await this.validators.environment.validate();
        await this.validators.directory.validate(context.targetDir);
        await this.validators.project.validate(context);
        return { validated: true };
      }
    }

    6. Create Shared Constants

    Extract all hardcoded values into constants:
    - Directory names
    - File patterns
    - Framework indicators
    - Default configurations

    7. Implement Installation Manager

    Central orchestrator that uses all components:
    class InstallationManager {
      constructor() {
        this.steps = [
          new ValidationStep(),
          new StructureStep(),
          new TemplateStep(),
          new ConfigurationStep(),
          new PermissionStep(),
          new FinalizeStep()
        ];
      }

      async install(targetDir, options) {
        const context = { targetDir, options, results: {} };
        for (const step of this.steps) {
          context.results = await step.execute(context);
        }
        return context.results;
      }
    }

    Benefits of This Refactoring

    1. Single Responsibility: Each module has one clear purpose
    2. Reusability: Components can be used across different installers
    3. Testability: Small modules are easier to unit test
    4. Maintainability: Changes are localized to specific modules
    5. DRY Compliance: No duplicated code across modules
    6. Extensibility: Easy to add new validators, generators, or steps
    7. Clear Dependencies: Explicit imports show relationships

    Implementation Order

    1. Create directory structure
    2. Extract constants first (no dependencies)
    3. Extract utilities (low-level operations)
    4. Extract validators (use utilities)
    5. Extract generators (use utilities and validators)
    6. Create step modules (use all components)
    7. Create installation manager (orchestrates steps)
    8. Update interactive-installer.js to use new architecture
    9. Add comprehensive tests for each module
    10. Remove old monolithic files

    This modular approach will make the codebase much more maintainable and allow both
    installation files to share common functionality while keeping each component focused on a
    single responsibility.
