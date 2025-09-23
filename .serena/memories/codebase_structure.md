# CDEV Codebase Structure

## Core Architecture
```
bin/cli.js                 # Main CLI entry point
src/                       # Core JavaScript modules
├── cli-commands.js        # Command execution logic
├── cli-parser.js          # Argument parsing
├── interactive-installer.js # Installation orchestrator
├── config-*.js           # Configuration system (6 modules)
├── hook-*.js             # Hook management (5 modules)
├── validation-*.js       # Validation system (3 modules)
└── commands/             # Commands implementation

scripts/python/           # Python automation scripts
├── agent-commit.py       # Intelligent commits
├── spawn-agents.py       # Agent spawning
├── monitor-agents.py     # Agent monitoring
└── [15+ other scripts]   # Parallel workflows

.claude/                  # Claude Code integration
├── commands/            # 25+ custom commands
├── agents/              # 20+ AI agents
├── hooks/               # 3-tier hook system
└── protocols/           # Development protocols

templates/               # Project templates
test/                   # Comprehensive test suite
config/                 # Build configurations
```

## Key Components
- **Installation System**: Modular interactive installer
- **Hook System**: 3-tier architecture (Critical/Important/Optional)
- **Agent System**: Specialized domain experts
- **Template System**: Framework-specific project templates
- **Python Automation**: Parallel development workflows