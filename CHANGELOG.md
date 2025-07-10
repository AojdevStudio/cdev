# Changelog

All notable changes to Claude Code Hooks will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive integration test suite with 90%+ coverage
- Cross-platform compatibility tests
- Project type detection for multiple frameworks
- Sample project fixtures for testing
- Complete API documentation
- Troubleshooting guide with common solutions
- Installation and usage documentation

### Changed
- Renamed package from claude-parallel-dev to claude-code-hooks
- Updated package.json with correct dependencies
- Improved test configuration with proper setup files
- Enhanced documentation structure

### Fixed
- Test setup file location
- Package naming consistency
- Dependency versions for better compatibility

## [1.0.0] - 2025-07-10

### Added

#### Core Features
- **Intelligent Hook System**: Pre/post tool use validation hooks
- **TypeScript Validation**: Automatic type checking before file edits
- **API Standards Checker**: REST/GraphQL API validation
- **Code Quality Reporter**: Real-time code metrics and feedback
- **Interactive Installer**: Smart project detection and configuration

#### Linear Integration
- Cache Linear issues locally for offline work
- Intelligent task decomposition using semantic analysis
- Parallel agent spawning with Git worktrees
- Progress monitoring and coordination

#### Framework Support
- Next.js App Router detection and commands
- React component and hook validation
- Node.js backend API patterns
- Python Flask/Django integration
- Monorepo workspace support

#### Developer Experience
- Cross-platform compatibility (Windows, macOS, Linux)
- Multiple package manager support (npm, pnpm, yarn, bun)
- Comprehensive error messages and debugging
- Extensive documentation and examples

### Security
- Commit message validation
- Import statement organization
- Environment variable protection
- Safe file operation checks

## [0.9.0-beta] - 2025-07-01

### Added
- Initial beta release
- Basic hook system implementation
- Linear API integration
- Git worktree management
- TypeScript validation hook
- Basic installer functionality

### Known Issues
- Limited Windows support
- Python path detection issues on some systems
- Hook timeout handling needs improvement

## [0.1.0-alpha] - 2025-06-15

### Added
- Initial proof of concept
- Basic pre_tool_use hook
- Simple Linear issue caching
- Manual installation process

---

For a detailed migration guide from older versions, see [MIGRATION.md](MIGRATION.md).