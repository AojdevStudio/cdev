# Changelog

All notable changes to @aojdevstudio/cdev will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New `/orchestrate` command with universal task format support (markdown, text, JSON, Linear issues)
- Intelligent sub-agent decomposition using LLM for concurrent execution
- Task parser utility for automatic format detection
- Sub-agent decomposer for optimized single-worktree execution
- Comprehensive custom commands reference documentation
- `/init-protocol` command with dynamic project analysis and intelligent protocol selection
- Dry-run mode for previewing sub-agent execution plans
- Progress tracking for concurrent sub-agent execution
- Error recovery and retry mechanisms for failed sub-agents

### Changed
- Restored `/agent-start` command to original 7-phase TDD workflow for agent_context.json files
- Separated flexible task orchestration into new `/orchestrate` command
- Improved command documentation with Feynman Technique for clarity
- Enhanced pre_tool_use hook with better validation and error messages

### Removed
- Obsolete `/update-claude` command

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