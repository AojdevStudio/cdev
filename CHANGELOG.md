# Changelog

All notable changes to @aojdevstudio/cdev will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Comprehensive Claude Code sub-agent system** - Enhanced integration with specialized sub-agents including git-flow-manager, task-orchestrator, pr-specialist, structure-enforcer, quality-guardian, doc-curator, deep-searcher, project-organizer, and roadmap-architect
- **PR creation command** - New `/create-pr` command for automated pull request creation with context gathering
- **PR review and merge command** - New `/review-merge` command for comprehensive PR review and merge workflow
- **Advanced documentation protocols** - Enhanced generate-readme, update-changelog, and build-roadmap command protocols with Feynman Technique integration
- **Deep search capabilities** - New `/deep-search` command for comprehensive codebase analysis and pattern recognition
- **Structure enforcement** - New `/enforce-structure` command for maintaining code organization and architectural consistency
- **Agent start protocols** - Enhanced `/agent-start` command with systematic TDD workflow integration

### Changed

- **Documentation structure** - Reorganized project documentation with improved clarity and comprehensive protocol documentation
- **Hook management** - Enhanced hook management in installers for better reliability
- **CodeRabbit configuration** - Standardized quotes in .coderabbit.yaml to single quotes for consistency and improved readability
- **Command protocol system** - Updated all custom commands to follow enhanced YAML protocol standards with sub-agent integration
- **Project version management** - Updated version references throughout documentation to reflect current 0.0.15 release

### Enhanced

- **README.md** - Updated version references and improved documentation structure
- **ROADMAP.md** - Enhanced with current progress tracking and updated completion status
- **Command documentation** - Comprehensive updates to all Claude Code command protocols with sub-agent integration patterns

## [0.0.15] - 2025-07-26

### Added

- **Comprehensive Claude Code sub-agent system** - Complete integration with 9 specialized sub-agents for enhanced development workflows
- **Advanced documentation protocols** - Enhanced generate-readme, update-changelog, and build-roadmap command protocols with Feynman Technique integration
- **Deep search capabilities** - New `/deep-search` command for comprehensive codebase analysis and pattern recognition
- **Structure enforcement** - New `/enforce-structure` command for maintaining code organization and architectural consistency
- **Enhanced agent start protocols** - Improved `/agent-start` command with systematic TDD workflow integration
- **PR management commands** - New `/create-pr` and `/review-merge` commands for automated pull request workflows

### Changed

- **Documentation structure** - Reorganized project documentation with improved clarity and comprehensive protocol documentation
- **Version consistency** - Updated all version references throughout documentation to reflect current 0.0.15 release
- **Command protocol system** - Enhanced all custom commands to follow YAML protocol standards with sub-agent integration
- **License references** - Consistent CC-BY-NC-SA-4.0 license references across all documentation

### Enhanced

- **README.md** - Updated version references and improved documentation structure
- **ROADMAP.md** - Enhanced with current progress tracking and updated completion status for v0.1.0 critical features
- **docs/parallel-workflow.md** - Updated version, license, and installation command consistency

## [0.0.7] - 2025-07-18

### Changed

- Enhanced hook management in installers

## [0.0.2] - 2024-07-15

### Added

- **Dynamic npm badges** - Added download counters (monthly & weekly) and CI status badges
- **Credits section** - Proper acknowledgment of open-source inspirations:
  - Context-Engineering by David Kimai for `/init-protocol` foundation
  - Claude Code Hooks Mastery by Disler for parallel agent concepts
  - Anthropic documentation for AI assistant best practices
- **Enhanced README with Feynman Technique** - Complete rewrite focusing on simplicity and accessibility
- **Quick Start Guide** - Visual 3-step journey with mermaid diagram
- **Production-grade /init-protocol emphasis** - Clear differentiation from Anthropic's basic `/init`
- **Complete workflow documentation** - Clarified that parallel agents require `/agent-start` in each directory
- **Framework detection showcase** - Visual list of 20+ supported frameworks with icons
- **Real-world examples** - Detailed authentication system and API optimization scenarios

### Changed

- **README structure** - Prioritized `/init-protocol` as essential first step before any workflows
- **Navigation menu** - Updated to reflect new user journey and include credits
- **Command explanations** - Used analogies and simple language throughout
- **Hook system documentation** - Practical examples of how hooks prevent common AI mistakes
- **Installation section** - Simplified Python/UV setup explanation

### Fixed

- **Mermaid diagram syntax** - Fixed arrow notation and special character escaping for proper rendering

## [0.0.6] - 2025-07-15

### Added

- **ESLint plugin for unused imports** - Added `eslint-plugin-unused-imports` for automated import management
- **TypeScript type checking script** - Added `npm run typecheck` command for TypeScript validation
- **Claude-Historian integration** - MCP-based conversation search and indexing system
- **Comprehensive AI documentation** - Converted Anthropic documentation to structured YAML format
- New `/orchestrate` command with universal task format support (markdown, text, JSON, Linear issues)
- Intelligent sub-agent decomposition using LLM for concurrent execution
- Task parser utility for automatic format detection
- Sub-agent decomposer for optimized single-worktree execution
- Comprehensive custom commands reference documentation
- `/init-protocol` command with dynamic project analysis and intelligent protocol selection
- Dry-run mode for previewing sub-agent execution plans
- **Init-protocol improvement guide** - Documentation for preventing CLAUDE.md placement errors
- **README comparison showcase** - Visual comparison table showing dramatic difference between `/init` vs `/init-protocol` (50k+ tokens, deep analysis)

### Changed

- **Hook command execution** - All hooks now use `uv run` instead of `python3` for consistency
- **Settings.json structure** - Removed unnecessary `version` and `description` fields from hook configuration
- **Installer configuration** - Both simple and interactive installers now generate proper settings.json structure with permissions section

### Fixed

- **Hook installation format** - Settings.json now follows Claude's intended structure without extraneous fields
- **Python execution consistency** - All Python hooks now use UV for reliable environment management
- Progress tracking for concurrent sub-agent execution
- Error recovery and retry mechanisms for failed sub-agents
- Python to JavaScript/CJS script migration infrastructure
- YAML documentation format for AI docs with structured metadata
- Comprehensive linting configuration with Ruff for Python scripts
- UV package manager integration for Python dependency management
- Standalone scripts guide and migration documentation
- Script wrapper pattern for seamless Python-to-JS transition

### Changed

- **Installer no longer creates CLAUDE.md files** - Removed automatic CLAUDE.md creation to prevent overwriting existing project instructions and avoid imposing parallel development context on all projects
- **Simplified `/orchestrate` command** - Refactored to use Claude's native parallel tool invocation instead of complex orchestration
- **Enhanced linting configuration** - Updated ESLint rules and added comprehensive linting fixes checklist
- **Project documentation overhaul** - Updated all documentation files with improved structure and clarity
- Restored `/agent-start` command to original 7-phase TDD workflow for agent_context.json files
- Separated flexible task orchestration into new `/orchestrate` command
- Improved command documentation with Feynman Technique for clarity
- Enhanced pre_tool_use hook with better validation and error messages
- Migrated all Python scripts to JavaScript/CJS format for consistency
- Updated project configuration with ESLint ignore patterns
- Enhanced GitHub Actions workflows for testing and publishing
- Improved Prettier configuration for better code formatting
- **Package optimization** - Reduced npm package size from 2.3MB to 330K by excluding test files and development documentation
- **Documentation reorganization** - Moved internal development docs to `dev-docs/` directory, keeping only user-facing docs in `docs/`
- **Package.json files field update** - Added explicit exclusion patterns for test files (`!src/**/*.test.js`, `!src/**/*.spec.js`)

### Removed

- **Development files from npm package** - Excluded 29 test files from `src/` directory in distributed package
- **Docs directory from npm package** - Removed `docs/` from npm distribution while keeping it in GitHub repository

### Fixed

- **Critical ESLint errors** - Fixed 2 valid-typeof errors in `src/config-loader.js` that could cause runtime failures
- **Massive linting cleanup** - Reduced ESLint issues from 322 (2 errors, 320 warnings) to 0 issues
- **Unused imports and variables** - Removed 29+ unused variables and imports across the codebase
- **Import organization** - Fixed import order and spacing issues throughout test files
- Python linting issues across hook scripts
- Script execution permissions and shebang lines
- Test file imports and module references

### Removed

- **Node modules from git tracking** - Cleaned up repository by removing accidentally tracked node_modules
- Obsolete `/update-claude` command
- Legacy Python script implementations (moved to archived/)
- Test files for migrated Python scripts

## [1.0.0] - 2025-07-11

### Added

- Initial public release of @aojdevstudio/cdev
- Comprehensive linting and formatting setup with ESLint and Prettier
- `.editorconfig` file for consistent coding styles across editors
- ESLint configuration with Airbnb base style guide
- Prettier integration for automatic code formatting
- New npm scripts for code quality checks (`quality`, `quality:fix`, `format`, `format:check`)
- Test utility functions and mock factory helpers
- AI documentation templates and cognitive OS guide
- Comprehensive test coverage for core modules
- Temporary file confirmation mechanism to template guard hook
- `hooks2rule.js` command for AOJ-102 enhancement
- Command template guard integration into pre_tool_use hook
- **Date awareness feature** in pre_tool_use hook to prevent AI date hallucinations
- Publishing plan and documentation
- Comprehensive API reference documentation
- Enhanced hooks reference with real-world examples
- Intelligent Hook System: Pre/post tool use validation hooks
- TypeScript Validation: Automatic type checking before file edits
- API Standards Checker: REST/GraphQL API validation
- Code Quality Reporter: Real-time code metrics and feedback
- Interactive Installer: Smart project detection and configuration
- Linear Integration for issue management and task decomposition
- Parallel agent spawning with Git worktrees
- Progress monitoring and coordination
- Cross-platform compatibility (Windows, macOS, Linux)
- Multiple package manager support (npm, pnpm, yarn, bun)

### Changed

- Package name from `cdev` to `@aojdevstudio/cdev` due to npm naming conflict
- Enhanced CLAUDE.md with comprehensive meta-cognitive framework
- Improved user guidance for decompose-parallel.cjs workflow
- Updated package.json dependencies and scripts
- Updated test configuration and validation rules
- Optimized command files for better efficiency
- Updated monitor-agents.sh to look in correct work-trees location
- License from MIT to CC-BY-NC-SA-4.0

### Removed

- Obsolete deployment plan files
- Obsolete TypeScript files and test infrastructure
- Redundant directory structure and files
- Hardcoded secrets from test files

### Fixed

- Syntax error in monitor-agents.sh for macOS watch compatibility
- LLM decomposer configuration and API issues
- Security vulnerabilities in example API keys
- Date inaccuracies in roadmap and documentation

### Security

- Removed hardcoded API keys from source code
- Added comprehensive security check script
- Enhanced .npmignore patterns for sensitive files
- Implemented pre-publish security validation

## Links

- [npm Package](https://www.npmjs.com/package/@aojdevstudio/cdev)
- [GitHub Repository](https://github.com/AOJDevStudio/cdev)
- [Documentation](https://github.com/AOJDevStudio/cdev/tree/main/docs)
