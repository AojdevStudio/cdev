# Scripts Directory Documentation

## Overview

The `scripts/` directory contains automation and development tools for the CDEV (Claude Development) project. It supports parallel development workflows, changelog automation, build processes, and Linear issue integration. The directory is organized into specialized subdirectories with both JavaScript/Shell scripts and modern Python scripts using UV for package management.

## File Structure

```
scripts/
├── changelog/                  # Changelog automation tools
│   ├── README.md              # Changelog automation documentation
│   ├── update-changelog.js    # Main changelog update script
│   └── utils.js               # Changelog utility functions
├── deployment/                 # Deployment and publishing tools
│   └── publish.sh             # NPM package publishing script
├── python/                     # Modern Python scripts (UV-based)
│   ├── README.md              # Python scripts documentation
│   ├── agent-commit.py        # Enhanced agent commit validation
│   ├── cache-linear-issue.py  # Linear issue caching utility
│   ├── decompose-parallel.py  # Parallel task decomposition engine
│   ├── deploy.py              # Deployment orchestration script
│   ├── integrate-parallel-work.py  # Parallel work integration
│   ├── intelligent-agent-generator.py  # AI agent generation
│   ├── monitor-agents.py      # Agent monitoring and tracking
│   ├── postpublish.py         # Post-publication verification
│   ├── prepublish.py          # Pre-publication validation
│   ├── resolve-conflicts.py   # Conflict resolution automation
│   ├── security-check.py      # Security validation script
│   ├── spawn-agents.py        # Agent spawning system
│   └── validate-parallel-work.py  # Parallel work validation
├── wrappers/                   # Backward compatibility wrappers
│   └── README.md              # Wrapper documentation and migration guide
├── fix-imports-ast-grep.sh     # AST-grep import path fixer
├── fix-imports-simple.js       # Simple import path fixer
├── fix-imports.js              # JSCodeshift import transformer
├── init-db.sql                 # Database initialization schema
└── simple-test.js              # Simple transform test utility
```

## Files Documentation

### /changelog/update-changelog.js

**Purpose**: Production-ready changelog automation script that follows Keep a Changelog conventions with automatic git commit analysis and manual entry modes.

**Entry Points**:
- `updateChangelog(options)`: Main changelog update function that coordinates the entire process
- CLI via Commander.js with various options and commands

**Key Functions**:
- `getChangesFromGit()`: Analyzes git commits since last release using conventional commit patterns
- `getChangesManually()`: Interactive prompts for manual changelog entry
- `generateCommitMessage()`: Creates comprehensive commit messages with validation summaries

**Important Variables/Constants**:
- `CHANGELOG_PATH`: Path to CHANGELOG.md file in project root
- `PACKAGE_JSON_PATH`: Path to package.json for version information
- `PATH_MAPPINGS`: Object containing file path remapping rules for import fixes

**Command Line Options**:
- `--auto`: Automatically analyze git commits since last release
- `--manual`: Interactive manual entry mode
- `--dry-run`: Preview changes without modifying files
- `--force`: Skip confirmation prompts for autonomous execution
- `--verbose`: Show detailed error information

### /changelog/utils.js

**Purpose**: Helper functions for changelog automation providing git analysis, version management, and file manipulation utilities.

**Entry Points**:
- Module exports providing utility functions for changelog operations

**Key Functions**:
- `validateVersion(version)`: Validates semantic version format using semver library
- `getNextVersion(currentVersion, autoMode, forceMode)`: Determines next version based on commit analysis
- `parseCommits()`: Extracts and parses git commits since last tag with conventional commit support
- `parseCommitMessage(commit)`: Parses individual commit messages into structured format
- `inferCommitType(subject)`: Infers commit type from subject line for non-conventional commits
- `formatChangelog(changes, version)`: Formats changelog entry according to Keep a Changelog conventions
- `updateChangelogFile(changelogEntry, version)`: Updates CHANGELOG.md with new version entry
- `updateVersionLinks(content, version)`: Updates version comparison links in changelog footer

**Important Variables/Constants**:
- Semantic version validation patterns
- Conventional commit type mappings
- Keep a Changelog category ordering

### /deployment/publish.sh

**Purpose**: Comprehensive NPM package publishing script with validation, testing, and post-publish verification for cross-platform distribution.

**Entry Points**:
- `main()`: Primary execution function that orchestrates the publishing process
- Command line script with validation and confirmation prompts

**Key Functions**:
- `validate_package()`: Validates package structure and required files
- `run_tests()`: Executes test suite if available
- `check_npm_auth()`: Verifies npm authentication status
- `check_version_exists()`: Prevents duplicate version publishing
- `build_package()`: Builds package and runs prepublish scripts
- `publish_package()`: Publishes to npm registry with error handling
- `create_git_tag()`: Creates and optionally pushes git tags
- `show_post_publish_instructions()`: Displays usage instructions and next steps

**Important Variables/Constants**:
- `PACKAGE_NAME`: Target package name for npm registry
- `NPM_REGISTRY`: Registry URL for package publication
- Required files and directories arrays for validation

**Command Line Options**:
- `--help`: Show usage information
- `--dry-run`: Validate package without publishing
- `--force`: Skip confirmation prompts

### /python/agent-commit.py

**Purpose**: Enhanced agent commit validation and integration system that validates completion status and safely integrates agent work with coordination infrastructure.

**Entry Points**:
- `agent_commit()`: Main CLI command function
- Click-based command line interface with workspace path argument

**Key Functions**:
- `load_agent_context(workspace_path)`: Loads and parses agent context from YAML/JSON files
- `parse_agent_context(context)`: Extracts key information from agent context
- `validate_agent_completion(workspace_path)`: Validates all checklist items are completed
- `verify_files(workspace_path)`: Verifies that all required files exist
- `create_coordination_files()`: Creates all coordination files for integration
- `generate_completion_report()`: Generates comprehensive agent completion report
- `preserve_agent_workspace()`: Preserves agent workspace for integration scripts
- `execute_git_workflow()`: Executes git workflow to commit and merge changes

**Important Variables/Constants**:
- Agent validation criteria and completion tracking
- Integration status and deployment plan structures
- Git workflow coordination patterns

### /python/cache-linear-issue.py

**Purpose**: Caches Linear issue data locally for offline decomposition using Linear GraphQL API with comprehensive error handling.

**Entry Points**:
- `main()`: CLI command function with issue ID argument
- Click-based interface with format options

**Key Functions**:
- `fetch_linear_issue(issue_id, api_key)`: Fetches issue details from Linear API using GraphQL
- `save_yaml(data, filepath)`: Saves data to YAML file with proper formatting
- `process_for_yaml(data)`: Recursively processes data to use literal strings for multiline content

**Important Variables/Constants**:
- Linear GraphQL query structure for issue data
- API endpoints and authentication headers
- Cache directory structure (.linear-cache)

**Dependencies**:
- `ruamel.yaml`: Advanced YAML processing with preservation
- `httpx`: Async HTTP client for API requests
- `click`: Command line interface framework
- `rich`: Terminal formatting and colors

### /python/decompose-parallel.py

**Purpose**: Exclusive ownership decomposition engine that ensures no file conflicts by analyzing operations, grouping by dependencies, and creating exclusive agent domains.

**Entry Points**:
- CLI command for parallel task decomposition
- Exclusive ownership analysis and validation

**Key Functions**:
- File conflict analysis and prevention
- Dependency cluster grouping
- Agent domain creation with validation
- Overlap detection and resolution

**Important Variables/Constants**:
- File operation analysis patterns
- Dependency mapping structures
- Agent exclusivity validation rules

### /python/spawn-agents.py

**Purpose**: Enhanced parallel agent spawning system that creates multiple isolated Git worktrees with proper environment for parallel Claude development.

**Entry Points**:
- CLI command for agent spawning from deployment plans
- Git worktree management and environment setup

**Key Functions**:
- `load_deployment_plan(file_path)`: Loads and parses deployment plan from JSON
- `get_unique_agents(plan)`: Extracts unique agent IDs from deployment plan
- Git worktree creation and isolation
- Environment preparation for parallel development

**Important Variables/Constants**:
- Deployment plan structure and validation
- Git worktree configuration
- Agent environment setup patterns

### /python/security-check.py

**Purpose**: Security validation script for package publication that ensures no sensitive data is included in published packages.

**Entry Points**:
- `SecurityChecker`: Main class for security validation
- CLI interface with output format options

**Key Functions**:
- Environment file validation (without deletion)
- Sensitive file publication prevention
- Hardcoded secret scanning in source code
- Package.json security settings verification
- .npmignore and .gitignore pattern validation

**Important Variables/Constants**:
- Security pattern definitions
- Sensitive file detection rules
- Package publication validation criteria

### /python/deploy.py

**Purpose**: Parallel Claude development workflow deployment script with comprehensive orchestration and environment management.

**Entry Points**:
- CLI deployment command with environment options
- Deployment orchestration and validation

**Key Functions**:
- `run_command(args, cwd, check)`: Command execution with error handling
- Environment setup and validation
- Deployment process orchestration
- Post-deployment verification

**Important Variables/Constants**:
- Deployment environment configurations
- Command execution patterns
- Validation and verification criteria

### /fix-imports-ast-grep.sh

**Purpose**: AST-grep based import fixer for file moves during repository cleanup with validation.

**Entry Points**:
- Shell script for automated import path fixing
- AST-grep pattern matching and replacement

**Key Functions**:
- Configuration file import path updates (jest.config.js, babel.config.js, tsconfig.json)
- Documentation file path corrections
- Python import statement fixes
- Post-fix validation with linting

**Important Variables/Constants**:
- AST-grep pattern definitions for different file types
- Path mapping configurations for common moves
- Validation command patterns

### /fix-imports-simple.js

**Purpose**: Simple import path fixer for file moves during repository cleanup with cross-platform compatibility.

**Entry Points**:
- `fixAllImports()`: Main function that processes all files
- Node.js script for automated import fixes

**Key Functions**:
- `fixImportsInFile(filePath)`: Processes individual files for import fixes
- `escapeRegExp(string)`: Safely escapes regular expression special characters
- Pattern matching for require(), import, and dynamic import statements

**Important Variables/Constants**:
- `PATH_MAPPINGS`: Object containing old to new path mappings
- File pattern arrays for JavaScript/TypeScript files
- Regular expression patterns for different import types

### /fix-imports.js

**Purpose**: JSCodeshift transform to fix import paths after file moves with comprehensive AST manipulation.

**Entry Points**:
- JSCodeshift transformer function for automated refactoring
- AST-based import path modifications

**Key Functions**:
- AST traversal and modification for require() calls
- Import statement path updates
- Dynamic import expression handling

**Important Variables/Constants**:
- `PATH_MAPPINGS`: File move mapping configuration
- AST node type definitions for different import patterns
- JSCodeshift API usage patterns

### /init-db.sql

**Purpose**: Database initialization schema for Claude Workflow with agent tracking, task management, and deployment coordination.

**Entry Points**:
- SQL schema definition for PostgreSQL database
- Extension and table creation scripts

**Key Database Objects**:
- `agents` table: Agent tracking with status and metadata
- `tasks` table: Task management with Linear integration
- `deployments` table: Deployment plan tracking and coordination
- Indexes for performance optimization
- Triggers for automatic timestamp updates

**Important Variables/Constants**:
- UUID generation for primary keys
- Status enumeration patterns
- JSONB metadata structure
- Foreign key relationships

### /simple-test.js

**Purpose**: Simple test transform for JSCodeshift development and testing.

**Entry Points**:
- JSCodeshift transformer for testing purposes
- Basic file processing without modifications

**Key Functions**:
- File path logging for transform verification
- No-op transformer for testing infrastructure

## Integration Patterns

### Changelog Automation
The changelog system integrates with:
- Git commit analysis for automatic entry generation
- Package.json for version information
- Keep a Changelog format conventions
- NPM publishing workflows

### Python Script Ecosystem
The Python scripts form a cohesive system for:
- Linear issue processing and caching
- Parallel agent coordination and spawning
- Work validation and integration
- Security and deployment automation

### Import Fixing Tools
Multiple import fixing approaches provide:
- AST-grep for pattern-based replacements
- Simple regex-based fixing for basic cases
- JSCodeshift for comprehensive AST transformations
- Cross-platform compatibility

### Database Integration
The SQL schema supports:
- Agent lifecycle tracking
- Task coordination with Linear
- Deployment plan management
- Metadata storage with JSONB

## Development Dependencies

### JavaScript/Node.js Dependencies
- `commander`: CLI argument parsing and command structure
- `inquirer`: Interactive prompts and user input
- `chalk`: Colored terminal output
- `semver`: Semantic version handling and validation
- `glob`: File pattern matching and selection

### Python Dependencies (UV-based)
- `pyyaml`/`ruamel.yaml`: YAML parsing and generation with preservation
- `click`: Command-line interface framework
- `rich`: Terminal formatting, colors, and progress indicators
- `httpx`: Async HTTP client for API requests
- `pathlib`: Enhanced path operations

### Development Tools
- AST-grep: Pattern-based code transformation
- JSCodeshift: JavaScript AST manipulation
- PostgreSQL: Database backend for coordination
- Linear API: Issue management integration

## Usage Patterns

### Changelog Workflow
```bash
# Auto-analyze git commits and update changelog
npm run changelog:auto

# Manual entry mode for custom entries
npm run changelog:manual

# Preview changes without modifying files
npm run changelog:preview
```

### Python Script Execution
```bash
# Direct execution with UV
./scripts/python/script-name.py

# With explicit UV command
uv run scripts/python/script-name.py

# With environment variables
LINEAR_API_KEY="key" ./scripts/python/cache-linear-issue.py AOJ-63
```

### Import Fixing
```bash
# AST-grep based fixing
./scripts/fix-imports-ast-grep.sh

# Simple regex-based fixing
node scripts/fix-imports-simple.js

# JSCodeshift transformation
jscodeshift -t scripts/fix-imports.js src/ test/
```

## Quality Assurance

### Error Handling
- Comprehensive error catching and reporting
- Graceful fallbacks for API failures
- User-friendly error messages with suggested fixes
- Exit code consistency across scripts

### Cross-Platform Support
- Shell script compatibility across Unix-like systems
- Python UV scripts work on Windows, macOS, and Linux
- Path handling abstraction for different OS types
- Environment variable handling consistency

### Testing and Validation
- Dry-run modes for safe testing
- Validation steps before destructive operations
- Rollback capabilities where applicable
- Integration with existing test suites

This documentation provides a comprehensive guide to the scripts directory structure, functionality, and integration patterns within the CDEV project ecosystem.