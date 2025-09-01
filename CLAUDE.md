# CDEV Project Context

## What is CDEV?

**CDEV (Claude Development)** is an AI-powered development orchestration system designed to enhance Claude Code with sophisticated parallel development workflows, intelligent automation, and universal task understanding.

### Project Purpose

- **Transform Claude Code workflows** with parallel agent coordination and advanced automation
- **Universal task processing** from Linear tickets, markdown tasks, or plain descriptions
- **Zero-friction setup** with one-command installation for any project type
- **Production-ready distribution** as a global NPM package
  (`@aojdevstudio/cdev`)

## Current Project Structure

**CDEV v0.0.21** - Current implementation overview based on actual codebase analysis:

### Core Architecture

```
bin/
├── cli.js                          # Main CLI entry point

src/
├── cli-commands.js                 # Command execution logic
├── cli-parser.js                   # Argument parsing
├── interactive-installer.js       # Installation orchestrator
├── config-*.js                    # Configuration system (6 modules)
├── hook-*.js                      # Hook management system (5 modules)
├── install-*.js                   # Installation utilities (2 modules)
├── validation-*.js                # Validation system (3 modules)
├── protocol-loader.js             # Protocol loading logic
├── template-engine.js             # Template processing
├── platform-utils.js              # Cross-platform utilities
├── python-detector.js             # Python environment detection
├── path-resolver.js               # Path resolution utilities
├── commands/
│   └── enforce-structure.js       # Structure enforcement command
├── installation/                  # Modular installation system (planned)
│   ├── generators/                # Directory structure generators
│   ├── installers/               # Component installers
│   ├── steps/                    # Installation steps
│   └── validators/               # Installation validators
├── utils/                        # Utility modules (planned expansion)
│   ├── file-system/              # File operations
│   ├── git/                      # Git utilities
│   ├── helpers/                  # Helper functions
│   ├── project/                  # Project detection
│   └── system/                   # System utilities
├── templates/                    # Template system
│   ├── commands/                 # Command templates
│   ├── configs/                  # Configuration templates
│   ├── hooks/                    # Hook templates
│   └── scripts/                  # Script templates
└── constants/                    # Constants and defaults (planned)

scripts/
├── python/                       # Core Python automation scripts
│   ├── agent-commit.py           # Intelligent commit generation
│   ├── cache-linear-issue.py     # Linear issue caching
│   ├── decompose-parallel.py     # Task decomposition
│   ├── spawn-agents.py           # Agent spawning
│   ├── monitor-agents.py         # Agent monitoring
│   ├── integrate-parallel-work.py # Work integration
│   ├── validate-parallel-work.py # Validation
│   ├── resolve-conflicts.py      # Conflict resolution
│   ├── security-check.py         # Security validation
│   ├── deploy.py                 # Deployment automation
│   ├── intelligent-agent-generator.py # Agent generation
│   ├── prepublish.py             # Pre-publish checks
│   └── postpublish.py            # Post-publish actions
├── changelog/                    # Changelog management
│   ├── update-changelog.py       # Automated changelog updates
│   └── utils.py                  # Changelog utilities
├── wrappers/                     # Script wrappers
└── deployment/                   # Deployment scripts
    └── publish.sh                # Publication script

.claude/                          # Claude Code integration
├── hooks/                        # Claude Code hooks (3-tier system)
│   ├── tier1/                    # Critical hooks (always installed)
│   ├── tier2/                    # Important hooks (recommended)
│   ├── tier3/                    # Optional hooks (selective)
│   ├── utils/                    # Hook utilities
│   │   ├── llm/                  # LLM integrations (OpenAI, Anthropic)
│   │   └── tts/                  # Text-to-speech utilities
│   ├── pre_tool_use.py           # Pre-execution validation
│   ├── post_tool_use.py          # Post-execution processing
│   ├── notification.py           # Event notifications
│   ├── stop.py                   # Session cleanup
│   ├── subagent_stop.py          # Sub-agent cleanup
│   ├── code-quality-reporter.py  # Code quality analysis
│   ├── api-standards-checker.py  # API validation
│   ├── universal-linter.py       # Multi-language linting
│   ├── import-organizer.py       # Import management
│   ├── typescript-validator.py   # TypeScript validation
│   ├── task-completion-enforcer.py # Task tracking
│   ├── commit-message-validator.py # Commit validation
│   ├── pnpm-enforcer.py          # Package manager enforcement
│   └── auto-changelog-updater.py # Changelog automation
├── commands/                     # Claude Code custom commands (25+ commands)
│   ├── init-protocol.md          # Project initialization
│   ├── agent-start.md            # Agent workflow initiation
│   ├── orchestrate.md            # Task orchestration
│   ├── commit.md                 # Intelligent commits
│   ├── use-agent.md              # Agent utilization
│   ├── analyze-codebase.md       # Codebase analysis
│   ├── create-pr.md              # Pull request creation
│   ├── generate-readme.md        # Documentation generation
│   └── [20+ additional commands] # Comprehensive command suite
├── agents/                       # Specialized AI agents (20+ agents)
│   ├── task-orchestrator.md      # Task coordination
│   ├── quality-guardian.md       # Quality assurance
│   ├── javascript-craftsman.md   # JavaScript expertise
│   ├── typescript-expert.md      # TypeScript mastery
│   ├── python-pro.md             # Python development
│   ├── test-automator.md         # Automated testing
│   ├── doc-curator.md            # Documentation management
│   ├── auth-systems-expert.md    # Authentication systems
│   ├── prd-writer.md             # Product requirements
│   ├── code-reviewer.md          # Code review automation
│   └── [15+ additional agents]   # Specialized domain experts
├── protocols/                    # Development protocols
│   ├── code-quality.md           # Quality standards
│   ├── testing-standards.md      # Testing guidelines
│   └── logging-discipline.yaml   # Logging requirements
└── status-lines/                 # Status line components
    ├── status_line.py             # Basic status display
    ├── status_line_v2.py          # Enhanced status
    ├── status_line_v3.py          # Advanced status
    └── status_line_v4.py          # Latest status implementation

templates/                        # Project configuration templates
├── api.json                      # API project template
├── default.json                  # Default project template
├── nextjs.json                   # Next.js template
├── pnpm.json                     # PNPM configuration
├── react.json                    # React template
└── typescript.json              # TypeScript template

test/                            # Comprehensive test suite
├── cli.test.js                  # CLI testing
├── config-*.test.js             # Configuration tests
├── hook-*.test.js               # Hook system tests
├── validation-*.test.js         # Validation tests
├── integration/                 # Integration tests
├── fixtures/                    # Test fixtures
└── utils/                       # Test utilities

config/                          # Build and testing configuration
├── jest.config.*.js             # Jest configurations (6 variants)
├── tsconfig.json                # TypeScript configuration
├── babel.config.js              # Babel configuration
├── docker-compose.yml           # Docker setup
├── Dockerfile                   # Container configuration
└── nginx.conf                   # Nginx configuration
```

### System Capabilities

**Installation System**: Modular, interactive installer with project detection and customizable hook selection
**Hook System**: 3-tier architecture (Critical/Important/Optional) with 15+ production-ready hooks
**Command System**: 25+ custom Claude Code commands for enhanced development workflows
**Agent System**: 20+ specialized AI agents for domain-specific tasks
**Python Automation**: 15+ Python scripts for parallel development, Linear integration, and deployment
**Template System**: Framework-specific project templates with intelligent detection
**Testing Infrastructure**: Comprehensive test suite with multiple Jest configurations

### Target Users

Developers using Claude Code who want to:

- Work on multiple parts of features simultaneously through parallel agents
- Automate quality gates and validation with intelligent hooks
- Process any task format (Linear, markdown, plain text) seamlessly
- Enhance their development workflows with AI-powered orchestration

## Hooks

# Tier 1 - Critical Hooks

This tier contains critical security and validation hooks that are essential for project integrity.

## Hooks in this tier:

- **notification.py**: Sends notifications for various events
- **stop.py**: Handles stop events
- **subagent_stop.py**: Handles subagent stop events
- **pre_tool_use.py**: Runs before tool usage
- **post_tool_use.py**: Runs after tool usage

## Characteristics:

- Security-focused
- Validation and enforcement
- Required for all projects
- Cannot be disabled without explicit override

## Usage:

These hooks are automatically included in all project setups unless explicitly excluded.

# Tier 2 - Important Hooks

This tier contains important quality and standards hooks that improve code quality and maintainability.

## Hooks in this tier:

- **api-standards-checker.py**: Checks API code against standards
- **code-quality-reporter.py**: Reports on code quality metrics
- **universal-linter.py**: Runs linting across multiple file types
- **import-organizer.py**: Organizes and sorts import statements

## Characteristics:

- Quality-focused
- Standards enforcement
- Recommended for most projects
- Can be selectively disabled

## Usage:

These hooks are recommended for all projects but can be excluded based on project needs.

# Tier 3 - Optional Hooks

This tier contains optional convenience and notification hooks that provide additional functionality.

## Hooks in this tier:

- **commit-message-validator.py**: Validates commit message format and content
- **typescript-validator.py**: Validates TypeScript code and type safety
- **task-completion-enforcer.py**: Ensures tasks are completed before proceeding
- **pnpm-enforcer.py**: Enforces use of pnpm package manager
- **auto-changelog-updater.py**: Updates the changelog with the latest changes.

## Characteristics:

- Convenience features
- Optional enhancements
- Project-specific utilities
- Can be freely enabled/disabled

## Usage:

These hooks are optional and can be selectively enabled based on project requirements and developer preferences.

**Configuring Logging**

All hooks must implement logging. Every hook in the CDEV system must record every event with timestamp and session ID. All hooks must:

1. Import datetime: `from datetime import datetime`
2. Ensure logs directory exists: `log_dir = Path.cwd() / 'logs'` and `log_dir.mkdir(parents=True, exist_ok=True)`
3. Define log file path: `log_path = log_dir / '<hook_name>.json'`

```python
        # Ensure log directory exists
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'post_tool_use.json'

        # Read existing log data or initialize empty list
        if log_path.exists():
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []

        # Add timestamp to the log entry
        timestamp = datetime.now().strftime("%b %d, %I:%M%p").lower()
        input_data['timestamp'] = timestamp

        # Append new data
        log_data.append(input_data)

        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
```

## Current Development Status

**v0.0.21** - Production-ready NPM package with active development

### Recently Completed

- ✅ **Interactive Installation System**: Fully functional with project detection and hook customization
- ✅ **3-Tier Hook Architecture**: Critical, Important, and Optional hooks with intelligent categorization
- ✅ **Python Script Migration**: 15+ Python automation scripts for parallel development workflows
- ✅ **Agent System Optimization**: 20+ specialized AI agents with streamlined tool selection
- ✅ **Command Ecosystem**: 25+ custom Claude Code commands for enhanced workflows
- ✅ **Testing Infrastructure**: Comprehensive Jest configuration with multiple test environments
- ✅ **NPM Package Distribution**: Published to `@aojdevstudio/cdev` with automated CI/CD

### In Progress

- 🔄 **Modular Installation System**: Refactoring installation components for improved maintainability
- 🔄 **Enhanced Documentation**: Comprehensive updates to reflect current implementation
- 🔄 **Template System Expansion**: Additional framework-specific templates
- 🔄 **Performance Optimization**: Hook execution and agent response time improvements

### Planned Features

- 📋 **Enhanced Linear Integration**: Advanced ticket decomposition and tracking
- 📋 **Web Dashboard**: Real-time agent monitoring and progress visualization
- 📋 **Plugin Architecture**: Extensible system for custom hooks and agents
- 📋 **Team Collaboration**: Multi-developer parallel workflow coordination

### Development Memories

- removing obsolete tests is better than maintaining stale mocks.
- After making changes to existing functionality or adding new features, update existing tests, remove old obsolete tests, build new tests
- When writing code, always add clear, descriptive comments explaining each section. Always group related items together. It is important to explain the purpose of each script, dependency, and configuration. Make it easy to understand for someone who might be overwhelmed by complexity. It should not be too verbose, but it should use complete, concise sentences that an educated person can follow.
- For JSON-related files, make sure to create separate documentation to explain those files, because comments are not approved or allowed in JSON.
- IMPORTANT: proactively aim to adhere to the principle "Don't Repeat Yourself" (DRY), which is a fundamental software development practice designed to eliminate code duplication and redundancy. The main idea is that each piece of knowledge or logic should exist only once in a codebase. If a particular functionality needs to be used in multiple places, it should be implemented in a single, reusable module—like a function, class, or method—and referenced wherever needed

- respect the @ai-docs/naming-conventions.md
