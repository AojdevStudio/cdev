# Custom Commands Reference

This document provides a comprehensive reference for all custom commands available in the parallel development environment. These commands extend Claude's capabilities with specialized workflows for efficient software development.

## Table of Contents

- [Agent Management Commands](#agent-management-commands)
  - [/agent-start](#agent-start)
  - [/orchestrate](#orchestrate)
  - [/agent-commit](#agent-commit)
  - [/agent-status](#agent-status)
- [Project Initialization](#project-initialization)
  - [/init-protocol](#init-protocol)
- [Documentation Generation](#documentation-generation)
  - [/generate-readme](#generate-readme)
- [Development Workflows](#development-workflows)
  - [/explore-plan-test-code](#explore-plan-test-code)
  - [/commit](#commit)
- [Analysis Tools](#analysis-tools)
  - [/file-tree](#file-tree)
- [Testing & Validation](#testing--validation)
  - [/test](#test)

---

## Agent Management Commands

### /agent-start

**Description**: Execute structured 7-phase Test-Driven Development workflow with agent_context.json files.

**Key Features**:
- Systematic 7-phase TDD approach
- Quality-focused development process
- Progressive validation and testing
- Comprehensive documentation

**Usage**:
```bash
/agent-start                     # Load agent_context.json from current directory
/agent-start ./agent-workspace   # Specific workspace path
```

**7-Phase Workflow**:
1. 🔍 **Explore** - Understand requirements and codebase
2. 📋 **Plan** - Create implementation strategy
3. 🧪 **Write Tests** - TDD red phase (tests first)
4. 💻 **Code** - Make tests pass with minimal code
5. ♻️ **Refactor** - Improve quality while keeping tests green
6. ✅ **Validate** - Ensure all requirements met
7. 📝 **Write-Up** - Document completed work

**Best For**: Structured development following TDD best practices, ensuring high-quality, well-tested code that integrates smoothly with parallel agents.

---

### /orchestrate

**Description**: Intelligently transform any task format into concurrent sub-agents for orchestrated execution within a single Claude instance.

**Key Features**:
- Universal format support (markdown, text, JSON, Linear issues)
- Intelligent LLM-based task decomposition
- Concurrent sub-agent orchestration
- Progress tracking and error recovery

**Usage**:
```bash
/orchestrate                                    # Auto-detect agent_context.json
/orchestrate PUBLISHING-PLAN.md                 # Parse markdown checklist
/orchestrate tasks.txt                          # Convert text list
/orchestrate LINEAR-123                         # Decompose Linear issue
/orchestrate "Fix linting, add tests, update docs"  # Direct text input
/orchestrate checklist.json --dry-run           # Preview without execution
```

**How it works**:
1. Parses input using TaskParser (auto-detects format)
2. Uses SubagentDecomposer with LLM for intelligent grouping
3. Creates concurrent sub-agents for parallel execution
4. Orchestrates execution using Task tool
5. Aggregates results and provides unified report

**Best For**: Flexible task decomposition when you have varied input formats and need intelligent concurrent execution.

---

### /agent-commit

**Description**: Validate completion and safely integrate agent work with automated git workflow.

**Usage**:
```bash
/agent-commit                    # Commit current agent work
/agent-commit --message "Custom" # Use custom commit message
/agent-commit --skip-validation  # Emergency commit (use carefully)
```

**Features**:
- Validates all checklist items complete
- Generates contextual commit messages
- Handles merge conflicts
- Cleans up worktrees after merge

---

### /agent-status

**Description**: Comprehensive view of parallel workflow progress across all agents.

**Usage**:
```bash
/agent-status                    # Show all agents
/agent-status --filter active    # Show only active agents
/agent-status --filter ready     # Show agents ready to commit
/agent-status --detail           # Detailed view with metrics
```

**Output includes**:
- Agent completion percentages
- Dependency status
- Recommended next actions
- Time estimates

---

## Project Initialization

### /init-protocol

**Description**: Intelligently generates protocol-based CLAUDE.md files with dynamic project analysis and context-aware protocol selection.

**Key Innovations**:

1. **Dynamic Project Analysis**
   - Automatically scans for languages, frameworks, and team indicators
   - Calculates complexity score to determine appropriate protocol depth
   - Detects special project types (parallel development, microservices, AI/ML)

2. **Intelligent Protocol Selection**
   - Uses scoring algorithm:
     ```
     Project Complexity = 
       (File Count × 0.2) +
       (Language Diversity × 0.3) +
       (Framework Count × 0.2) +
       (Team Indicators × 0.3)
     ```
   - Adapts protocols to your specific tech stack
   - Includes relevant custom commands for your workflow

3. **Context-Aware Generation**
   - Generates project-specific examples and guides
   - Customizes for detected frameworks (React, Vue, etc.)
   - Includes appropriate workflow protocols

**Usage**:
```bash
/init-protocol                                    # Auto-analyze and generate
/init-protocol --force                           # Overwrite existing CLAUDE.md
/init-protocol --level advanced                  # Force specific complexity
/init-protocol --focus "parallel-development"    # Emphasize specific domains
```

**How It Works**:
1. Analyzes project using shell commands in Context section
2. Determines complexity based on codebase characteristics
3. Selects appropriate protocols from framework template
4. Customizes for your stack (e.g., React protocols for React projects)
5. Generates complete CLAUDE.md with all relevant frameworks

**Benefits**:
- Simple as `/init` to use
- Powerful as the protocol framework in output
- Intelligent adaptation to your specific project needs
- Far more sophisticated than standard `/init` output

---

## Documentation Generation

### /generate-readme

**Description**: Analyzes project structure and generates comprehensive README following established templates with Feynman Technique for clarity.

**Usage**:
```bash
/generate-readme                          # Generate to README.md
/generate-readme --output docs/README.md  # Custom output location
```

**Features**:
- Template-based generation with variable substitution
- Project structure analysis using EZA CLI
- Feynman Technique for clear explanations
- Git history and changelog integration
- Badge and license detection

---

## Development Workflows

### /explore-plan-test-code

**Description**: Comprehensive TDD workflow with systematic exploration, planning, testing, and implementation phases.

**Workflow Phases**:
1. **Explore**: Understand codebase and requirements
2. **Plan**: Create detailed implementation strategy
3. **Test**: Write comprehensive tests first (TDD)
4. **Code**: Implement to make tests pass
5. **Refactor**: Improve code quality
6. **Commit**: Finalize with proper git workflow

**Usage**:
```bash
/explore-plan-test-code           # Full workflow
/explore-plan-test-code --phase plan  # Start at specific phase
```

---

### /commit

**Description**: Intelligent git commit workflow with automated message generation and validation.

**Usage**:
```bash
/commit                          # Auto-generate commit message
/commit --message "feat: add feature"  # Custom message
```

**Features**:
- Analyzes staged changes
- Generates semantic commit messages
- Validates commit conventions
- Includes co-author attribution

---

## Analysis Tools

### /file-tree

**Description**: Generate visual file tree representations with filtering and formatting options.

**Usage**:
```bash
/file-tree                       # Current directory tree
/file-tree src/                  # Specific directory
/file-tree --ignore node_modules # Exclude patterns
/file-tree --max-depth 3         # Limit depth
```

---

## Testing & Validation

### /test

**Description**: Run project tests with coverage analysis and reporting.

**Usage**:
```bash
/test                           # Run all tests
/test --coverage                # Include coverage report
/test --watch                   # Run in watch mode
/test specific.test.js          # Run specific test file
```

---

## Command Development Guidelines

When creating new custom commands:

1. **Clear Purpose**: Each command should solve a specific workflow problem
2. **Intelligent Defaults**: Work out-of-the-box with smart defaults
3. **Progressive Options**: Simple usage with advanced options available
4. **Context Awareness**: Adapt to project type and structure
5. **Error Recovery**: Graceful handling of edge cases
6. **Documentation**: Include usage examples and explanations

## Best Practices

1. **Command Naming**:
   - Use descriptive verb-noun format
   - Keep names concise but clear
   - Use hyphens for multi-word commands

2. **Output Format**:
   - Use emojis for visual clarity
   - Provide progress indicators
   - Summarize results clearly
   - Include next steps

3. **Error Handling**:
   - Validate inputs early
   - Provide helpful error messages
   - Suggest corrections
   - Allow recovery options

4. **Integration**:
   - Commands should compose well
   - Share common utilities
   - Use consistent patterns
   - Respect project conventions

## Contributing New Commands

To add a new custom command:

1. Create command file in `.claude/commands/`
2. Follow the established format or use the command `.claude/commands/create-command.md` to create a new command:
   ```markdown
   ---
   allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Task
   description: Brief description of command purpose
   ---
   
   # Command Name
   
   Detailed description...
   ```

3. Include:
   - Clear usage examples
   - Variable definitions
   - Step-by-step instructions
   - Error handling
   - Return status format

4. Test thoroughly with various inputs
5. Document in this reference guide
6. Submit PR with examples

## Version History

- **v2.1**: Separated `/agent-start` (7-phase TDD) and `/orchestrate` (flexible formats)
- **v2.0**: Enhanced `/agent-start` with universal format support
- **v1.5**: Introduced `/init-protocol` with intelligent analysis
- **v1.0**: Initial command set with parallel development focus

---

For more information or to report issues, please visit the [project repository](https://github.com/AojdevStudio/cdev).