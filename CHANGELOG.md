# Changelog

All notable changes to @aojdevstudio/cdev will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Agent System Overhaul** - Comprehensive review and enhancement of all specialized agents
  - **Meta-agent optimization**: Enhanced agent evaluation and recommendation workflows
  - **Tool selection refinement**: Removed unnecessary tools from agents to improve performance and focus
  - **Structured workflow implementation**: Added numbered steps and clear procedures to all agents
  - **Language-specific agent improvements**: Added best practices, examples, and focused responsibilities
  - **Output structure standardization**: Defined consistent output formats across all agents
  - **Proactive trigger system**: Added "MUST BE USED" conditions to encourage automatic delegation

- **Context7 Integration** - Enhanced documentation lookup capabilities
  - Added Context7 tools to coding agents for seamless documentation access
  - Improved agent context awareness and knowledge retrieval

- **Linear MCP Integration** - Enhanced task management capabilities
  - Added Linear MCP tools to task-orchestrator for improved issue management
  - Enhanced agent coordination with external task tracking systems

### Enhanced

- **Agent Workflows** - Systematic improvement across all agent types
  - **task-orchestrator.md**: Added Linear MCP tools and structured delegation workflows
  - **test-automator.md**: Enhanced testing workflows with clear procedural steps
  - **meta-agent.md**: Improved agent evaluation and recommendation systems
  - **coding agents**: Added Context7 integration and language-specific best practices
  - **specialized agents**: Refined tool selections and added structured output formats

- **Agent Delegation System** - Improved automatic agent selection and usage
  - Added proactive triggers to encourage automatic delegation based on task context
  - Enhanced agent coordination and communication protocols
  - Standardized agent invocation patterns and handoff procedures



## [0.1.0] - 2025-08-04

### Added

- 📚 docs: add comprehensive hook documentation and linter refactor plan
- 🔧 feat: implement comprehensive logging infrastructure for all hooks
- 📝 docs: update changelog with recent feature additions
- 📚 docs: add comprehensive technical documentation and references
- 📚 docs: add CLAUDE.md documentation across project directories
- ✨ feat(commands): add comprehensive development command suite
- ✨ feat(agents): add codebase-explorer agent for systematic code documentation
- 📚 docs: add installation consolidation documentation and migration guide
- ✨ feat(agents): add specialized development agent configurations

### Changed

- 📝 docs: update project documentation with hook logging standards
- 🏗️ refactor: update integration map and marketing content
- 📚 docs: update technical documentation and references
- 🔧 refactor: enhance safety hooks and Claude settings
- 🤖 agents: enhance agent configurations and formatting
- migrate changelog system from JavaScript to Python
- 🔧 refactor: enhance command configurations and safety hooks
- 🔧 chore: update codebase for simplified installation approach

### Removed

- 🧹 cleanup: remove obsolete test files and deprecated scripts
- 🗑️ cleanup: remove obsolete integration map configuration
- 🗑️ refactor: remove obsolete files and simplify codebase structure

### Fixed

- 🐛 fix: correct pre_tool_use hook input handling to read from stdin

### Security

- enhance safety hooks and update project documentation

## [0.1.0] - 2025-08-02

### Added

- 📚 docs: add installation consolidation documentation and migration guide
- ✨ feat(agents): add specialized development agent configurations

### Changed

- 🔧 chore: update codebase for simplified installation approach

### Removed

- 🗑️ refactor: remove obsolete files and simplify codebase structure

### Security

- enhance safety hooks and update project documentation

### Changed

- **Installation Consolidation** - Removed global installation support entirely
  - Package is now project-local only (no more `npm install -g`)
  - Removed `preferGlobal: true` from package.json
  - Updated all documentation to reflect project-local installation methods
  - Created comprehensive MIGRATION.md guide for users transitioning from global installations
  - Simplified installation to two methods: NPX one-time use or dev dependency

### Removed

- **Obsolete Installation Files** - Cleaned up unused installation infrastructure
  - Removed `src/installer.js` and `src/simple-installer.js` (never used by CLI)
  - Removed all related test files for obsolete installers
  - Removed `test/integration/` directory with unused integration tests
  - Removed `scripts/test-installer.sh` shell script
- **Unused Utils Directory** - Removed entire `utils/` directory containing:
  - `llm-decomposer.js` - Unused LLM task decomposition utility
  - `subagent-decomposer.js` - Unused concurrent task decomposer
  - `task-parser.js` - Unused universal task parser
- **Redundant Documentation** - Removed duplicate README files
  - Deleted `scripts/python/complex-scripts-readme.md` (content already in main README)

### Fixed

- **Installation Validation** - Updated post-install validator to check for NPX commands
  - Removed `validateGlobalPackage()` method entirely
  - Updated CLI command validation for project-local usage
  - Fixed hook paths to use tier-based structure
- **Documentation References** - Removed all global installation references
  - Updated docs/guides/installation.md to remove `npm install -g` commands
  - Changed postpublish script from "global NPX installation" to "NPX execution" testing
  - Updated pnpm-enforcer.py hook to block global installation patterns
- **Installation Guide** - Corrected and clarified installation instructions
  - Restored script verification commands after confirming installer copies scripts to project
  - Clarified that `npx cdev install` copies all necessary files including Python scripts
  - Added proper manual setup options with three clear paths
  - Fixed verification commands to use `npx cdev` instead of `cdev`


## [0.1.0] - 2025-07-28

### Added

- Meta-agent sub-agent for creating new specialized sub-agents from user descriptions
- Enhanced git-flow-manager with iterative commit protocol ensuring clean working directory
- Social media marketing agent for platform-specific content creation  
- Changelog writer agent for automated changelog generation from git commits
- File counter agent for statistical project analysis
- Frontend verifier agent for comprehensive E2E testing with Playwright
- Five new specialized sub-agents expanding the Claude Code ecosystem
- Command ecosystem standardization achieving 100% Anthropic compliance
- Comprehensive Claude Code sub-agent system with 11 specialized agents
- Global NPX package configuration via dist-manifest.yaml

### Changed

- Reorganized configuration files into dedicated config/ directory structure
- Enhanced Claude Code framework with protocol-driven command system  
- Simplified build-roadmap command to focus on concrete commitments
- Updated project documentation for improved clarity and completeness
- Refined .prettierignore to include dist-manifest.yaml and markdown exclusions

### Removed  

- Deprecated command documentation files (.command-index.md, .future-proofing.md)
- Obsolete settings backup files for cleaner repository
- Removed dist-manifest.yaml from git tracking to prevent conflicts

### Fixed

- Markdown formatting issues in custom command template
- Hook installation system overhaul with package improvements (v0.0.17)

## [0.0.17] - 2025-07-26

### Fixed

- **Hook installation system** - Completely overhauled hook selection and installation logic
  - Removed non-existent "Pre-bash validator" hook reference
  - Fixed issue where all hooks were installing regardless of user selection
  - Corrected hook name mapping for `command-template-guard` → `pre_tool_use_command_template_guard.py`
  - Standard hooks now install automatically without user prompts
  - Only user-selected optional hooks are installed
- **Package distribution** - Enhanced `.claude/agents` folder inclusion in NPM package
  - Added explicit inclusion patterns for all subdirectories
  - Fixed missing agent files in distributed package installations

### Changed

- **Hook installer UI** - Improved user experience with clear separation of standard vs optional hooks
  - Added informational display showing 5 standard hooks that install automatically
  - Simplified selection interface to only show optional hooks
  - Enhanced installation feedback with detailed progress logging
- **Hook categorization** - Restructured hook system into clear categories
  - **Standard hooks (always installed)**: `pre_tool_use.py`, `post_tool_use.py`, `notification.py`, `stop.py`, `subagent_stop.py`
  - **Optional hooks (user choice)**: TypeScript validator, import organizer, code quality reporter, task completion enforcer, commit message validator, command template guard, pnpm enforcer, API standards checker, universal linter

### Added

- **Comprehensive test suite** - Added automated testing for hook installation system
  - Unit tests for selective hook installation
  - Integration tests for hook name mapping validation
  - End-to-end tests for complete installation workflow
- **Installation validation** - Enhanced package.json files configuration
  - Explicit patterns for `.claude/agents/**/*.md` inclusion
  - Redundant inclusion patterns for maximum NPM compatibility

### Enhanced

- **Hook installation reliability** - Improved error handling and user feedback
  - Clear success/failure indicators for each installed component
  - Warning messages for missing hook files
  - Detailed logging of installation progress

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

[Unreleased]: https://github.com/AOJDevStudio/cdev/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/AOJDevStudio/cdev/releases/tag/v0.1.0
[0.1.0]: https://github.com/AOJDevStudio/cdev/releases/tag/v0.1.0
[0.1.0]: https://github.com/AOJDevStudio/cdev/releases/tag/v0.1.0
[0.0.17]: https://github.com/AOJDevStudio/cdev/compare/v0.0.15...v0.0.17
[0.0.15]: https://github.com/AOJDevStudio/cdev/compare/v0.0.7...v0.0.15
[0.0.7]: https://github.com/AOJDevStudio/cdev/releases/tag/v0.0.7
