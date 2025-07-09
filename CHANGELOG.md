# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New Claude slash commands for workflow automation
- Parallel task decomposition with smart LLM analysis
- dotenv dependency for environment configuration
- Agent commit workflow with validation and safety checks
- Create-coordination-files command for generating integration coordination files
- Conflict resolution script for managing parallel agent conflicts
- LLM decomposition cache files for improved performance

### Changed
- Enhanced commit command with better file filtering and parallel processing
- Improved environment configuration templates
- Enhanced Claude hooks and LLM utilities
- Updated scripts to ensure executable permissions

### Fixed
- Clean up deployment plans and add new mistral configuration
- Remove DS_Store from tracking and improve gitignore

### Removed
- Excluded logs directory from version control

## [1.0.0] - 2025-07-09

### Added
- Initial release of Parallel Claude Development Workflow
- Git worktree-based parallel agent system
- Linear issue caching and decomposition
- Intelligent task breakdown using semantic analysis
- Agent coordination and merge workflows
- Claude Code integration with custom slash commands
- NPX package distribution plan
- Directory validation system

### Features
- Transform Linear issues into parallel working agents
- Semantic analysis for intelligent task decomposition
- Isolated Git worktrees for conflict-free parallel development
- Dependency-aware merge coordination
- Automated Cursor integration for agent workspaces
- Comprehensive validation and testing workflows