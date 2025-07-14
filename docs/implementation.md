# Claude Code Hooks - Implementation Plan

## Overview

Transform the parallel Claude development workflow into a globally installable NPM package that works "right out of the box" with proper hook categorization, project detection, and settings.json generation.

## Current State Analysis

### Existing Assets

- **13 Hook Files** in `.claude/hooks/`:
  - **5 Original**: `notification.py`, `post_tool_use.py`, `pre_tool_use.py`, `stop.py`, `subagent_stop.py`
  - **8 New**: `api-standards-checker.py`, `code-quality-reporter.py`, `commit-message-validator.py`, `import-organizer.py`, `pnpm-enforcer.py`, `task-completion-enforcer.py`, `typescript-validator.py`, `universal-linter.py`
- **Utility Libraries**: `utils/llm/` and `utils/tts/`
- **Custom Commands**: 12 slash commands in `.claude/commands/`
- **Workflow Scripts**: Complete parallel development system
- **Current Configuration**: `settings.local.json` with permissions and hooks

### Requirements Analysis

1. Switch from `settings.local.json` to `settings.json` for npm distribution
2. Global installation via `npm install -g parallel-dev-claude` this would map to ~/.claude/settings.json (applies to all projects for that user)
3. Local installation via `npm install parallel-dev-claude` .claude/settings.json (checked into version control)
4. Interactive hook selection based on project type
5. Cross-platform compatibility (Windows/macOS/Linux)
6. Portable configuration (no absolute paths)
7. "Right out of the box" functionality

## Implementation Requirements

### 1. Package Structure Creation

#### 1.1 Root Package Structure

```
claude-code-hooks/
├── package.json                    # NPM package configuration
├── README.md                       # Package documentation
├── CHANGELOG.md                    # Version history
├── LICENSE                         # MIT license
├── .gitignore                      # Git ignore rules
├── .npmignore                      # NPM publish exclusions
├── bin/                            # CLI executables
├── lib/                            # Core JavaScript modules
├── hooks/                          # Python hook files
├── templates/                      # Configuration templates
├── tests/                          # Test suite
└── docs/                           # Documentation
```

#### 1.2 Bin Directory Structure

```
bin/
├── claude-hooks                    # Unix executable (shebang)
└── claude-hooks.js                 # Node.js entry point
```

#### 1.3 Lib Directory Structure

```
lib/
├── cli.js                          # Command line interface
├── installer.js                    # Installation orchestrator
├── project-detector.js             # Project type detection
├── hook-manager.js                 # Hook categorization and selection
├── config-generator.js             # settings.json generation
├── path-resolver.js                # Cross-platform path handling
├── python-detector.js              # Python interpreter detection
├── validator.js                    # Configuration validation
└── migrator.js                     # Migration from existing configs
```

#### 1.4 Hooks Directory Structure

```
hooks/
├── tier1/                          # Standard Claude hooks (always recommended)
│   ├── notification.py
│   ├── pre_tool_use.py
│   ├── post_tool_use.py
│   ├── stop.py
│   └── subagent_stop.py
├── tier2/                          # Project-specific hooks (optional)
│   ├── typescript-validator.py
│   ├── pnpm-enforcer.py
│   └── api-standards-checker.py
├── tier3/                          # Enhanced workflow features
│   ├── code-quality-reporter.py
│   ├── import-organizer.py
│   ├── commit-message-validator.py
│   ├── task-completion-enforcer.py
│   └── universal-linter.py
└── utils/                          # Shared utilities
    ├── llm/
    │   ├── anth.py
    │   └── oai.py
    └── tts/
        ├── elevenlabs_tts.py
        ├── openai_tts.py
        └── pyttsx3_tts.py
```

#### 1.5 Templates Directory Structure

```
templates/
├── base-settings.json              # Base configuration template
├── typescript-settings.json        # TypeScript project additions
├── pnpm-settings.json              # pnpm project additions
├── nextjs-settings.json            # Next.js project additions
├── react-settings.json             # React project additions
├── api-settings.json               # API project additions
└── workflows/                      # Workflow template files
    └── paralell-development-claude/
        ├── scripts/
        ├── CLAUDE.md
        ├── README.md
        └── ai_docs/
```

### 2. Hook Categorization System

#### 2.1 Tier 1 - Standard Claude Hooks (Always Recommended)

**Purpose**: Standard Claude Code hooks that provide core functionality

**Hooks**:

- `notification.py` - User notifications
- `pre_tool_use.py` - Pre-execution hooks
- `post_tool_use.py` - Post-execution hooks
- `stop.py` - Chat session management
- `subagent_stop.py` - Subagent lifecycle management

**Rationale**: These are the standard Claude Code hooks that enhance the core development experience

#### 2.2 Tier 2 - Project-Specific Hooks

**Purpose**: Hooks that only apply to specific project types

**Hooks**:

- `typescript-validator.py` - TypeScript projects only
- `pnpm-enforcer.py` - pnpm-based projects only
- `api-standards-checker.py` - API-heavy projects

**Detection Logic**:

- **TypeScript**: Check for `tsconfig.json`, `*.ts` files
- **pnpm**: Check for `pnpm-lock.yaml`, `.pnpmrc`
- **API**: Check for `pages/api/`, `app/api/`, `routes/` directories

#### 2.3 Tier 3 - Enhanced Workflow Features

**Purpose**: Advanced workflow features that enhance the parallel development experience

**Hooks**:

- `code-quality-reporter.py` - Detailed quality reporting
- `import-organizer.py` - Code organization improvements
- `commit-message-validator.py` - Validates git commit messages
- `task-completion-enforcer.py` - Manages parallel workflow completion
- `universal-linter.py` - Basic code quality checks

**Selection**: User choice during installation

### 3. Project Detection System

#### 3.1 Detection Methods

**File-based Detection**:

```javascript
const detectionRules = {
  typescript: [
    'tsconfig.json',
    '*.ts files count > 0',
    'package.json dependencies include typescript',
  ],
  pnpm: ['pnpm-lock.yaml', '.pnpmrc', 'package.json packageManager field includes pnpm'],
  nextjs: ['next.config.js', 'next.config.ts', 'package.json dependencies include next'],
  react: [
    'package.json dependencies include react',
    '*.jsx files count > 0',
    '*.tsx files count > 0',
  ],
  api: [
    'pages/api directory exists',
    'app/api directory exists',
    'routes/ directory exists',
    'api/ directory exists',
  ],
};
```

#### 3.2 Detection Algorithm

1. Scan project root for indicator files
2. Parse `package.json` for dependencies
3. Count file types using glob patterns
4. Score each project type based on indicators found
5. Return detected types above confidence threshold

#### 3.3 Confidence Scoring

```javascript
const confidenceWeights = {
  configFile: 10, // tsconfig.json, next.config.js
  lockFile: 8, // pnpm-lock.yaml
  packageJson: 6, // dependencies in package.json
  fileCount: 4, // *.ts, *.jsx file counts
  directory: 3, // api/, routes/ directories
};
```

### 4. Configuration Template System

#### 4.1 Base Template Structure

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "MultiEdit",
      "Grep",
      "Glob",
      "LS",
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(node *)",
      "mcp__*"
    ],
    "deny": []
  },
  "hooks": {
    "PreToolUse": [],
    "PostToolUse": [],
    "Notification": [],
    "Stop": [],
    "SubagentStop": []
  }
}
```

#### 4.2 Template Merging Strategy

1. Start with base template
2. Merge project-specific additions based on detection
3. Add selected hooks to appropriate events
4. Resolve path placeholders to actual paths
5. Validate final configuration

#### 4.3 Path Resolution System

**Placeholders**:

- `{{PYTHON_INTERPRETER}}` - Detected Python executable
- `{{HOOKS_PATH}}` - Installed hooks directory path
- `{{PROJECT_ROOT}}` - Project root directory
- `{{PACKAGE_ROOT}}` - NPM package installation directory

**Resolution Logic**:

```javascript
function resolvePaths(template, context) {
  const replacements = {
    '{{PYTHON_INTERPRETER}}': context.pythonPath,
    '{{HOOKS_PATH}}': context.hooksPath,
    '{{PROJECT_ROOT}}': context.projectRoot,
    '{{PACKAGE_ROOT}}': context.packageRoot,
  };

  return JSON.stringify(template).replace(
    /\{\{(\w+)\}\}/g,
    (match, key) => replacements[`{{${key}}}`] || match,
  );
}
```

### 5. Cross-Platform Compatibility

#### 5.1 Python Interpreter Detection

**Detection Order**:

1. `python3` (preferred on Unix systems)
2. `python` (fallback)
3. `py` (Windows Python launcher)

**Validation Requirements**:

- Verify executable exists in PATH
- Check Python version compatibility (>= 3.7)
- Test basic script execution

#### 5.2 Path Handling

**Requirements**:

- Use Node.js path module for all path operations
- Convert backslashes to forward slashes in JSON
- Handle spaces in paths with proper quoting
- Support both absolute and relative paths

#### 5.3 Shell Command Execution

**Platform-specific considerations**:

- **Windows**: Use cmd shell with proper escaping
- **Unix**: Use `/bin/bash` with POSIX compatibility
- Handle permission issues gracefully
- Provide fallback execution methods

### 6. Interactive Installation Flow

#### 6.1 Installation Phases

1. **Environment Validation**
   - Check Python availability
   - Verify Node.js version
   - Check git installation
   - Validate project directory

2. **Project Analysis**
   - Detect project type
   - Scan existing configuration
   - Identify compatible hooks
   - Generate recommendations

3. **Hook Selection**
   - Present categorized hooks
   - Show recommendations based on project type
   - Allow custom selection
   - Validate hook compatibility

4. **Configuration Generation**
   - Merge selected hooks into template
   - Resolve all path placeholders
   - Validate final configuration
   - Create backup of existing config

5. **Installation Execution**
   - Detect existing `.claude` directory (if present, backup and merge)
   - Copy hook files to project (preserve existing custom hooks)
   - Create/update `.claude` directory structure
   - Write `settings.json` file (merge with existing settings if found)
   - Set executable permissions on hook files
   - Verify installation success and hook compatibility

#### 6.2 User Interface Requirements

**Question Types**:

- Confirmation prompts for recommendations
- Multi-select for optional hooks
- Text input for custom paths
- Yes/no for feature toggles

**Progress Indicators**:

- Phase completion status
- File copying progress
- Validation checkpoints
- Error handling with retry options

### 7. Migration System

#### 7.1 Existing Configuration Detection

**Supported Formats**:

- `settings.local.json` (current format)
- `settings.json` (Claude Code standard)
- Legacy configuration files
- Existing `.claude` directory with custom hooks and commands

#### 7.2 Migration Process

1. **Backup Creation**
   - Create timestamped backup of existing `.claude` directory
   - Backup existing `settings.json` or `settings.local.json`
   - Preserve user customizations and custom hooks
   - Document migration changes in backup log

2. **Configuration Parsing**
   - Extract existing permissions from settings files
   - Identify current hooks in hooks directory
   - Preserve custom commands in commands directory
   - Catalog existing utilities and dependencies

3. **Merging Strategy**
   - Combine existing with new configuration (user settings take precedence)
   - Resolve hook conflicts (rename duplicates with .existing suffix)
   - Add new hooks as optional additions
   - Preserve existing custom commands and utilities

4. **Validation**
   - Verify merged configuration validity
   - Test hook execution compatibility
   - Confirm no conflicts between existing and new hooks
   - Validate custom commands still function

### 8. Validation and Error Handling

#### 8.1 Pre-installation Validation

- Python interpreter availability
- Sufficient disk space
- Write permissions to target directory
- Existing Claude Code installation

#### 8.2 Configuration Validation

- JSON syntax validation
- Hook file existence verification
- Path resolution testing
- Permission structure validation

#### 8.3 Post-installation Verification

- Hook execution testing
- Settings.json loading verification
- Command availability checking
- Integration test execution

#### 8.4 Error Recovery

- Automatic rollback on failure
- Configuration repair utilities
- Manual intervention guidance
- Support information provision

### 9. Package Distribution

#### 9.1 NPM Package Configuration

```json
{
  "name": "claude-code-hooks",
  "version": "1.0.0",
  "description": "Parallel Claude development workflow with intelligent hooks",
  "main": "lib/cli.js",
  "bin": {
    "claude-hooks": "bin/claude-hooks.js"
  },
  "files": ["bin/", "lib/", "hooks/", "templates/", "README.md", "CHANGELOG.md"],
  "engines": {
    "node": ">=14.0.0"
  },
  "dependencies": {
    "commander": "^9.0.0",
    "inquirer": "^9.0.0",
    "chalk": "^5.0.0",
    "fs-extra": "^11.0.0",
    "glob": "^8.0.0"
  }
}
```

#### 9.2 Global Installation Support

- Proper bin mapping for CLI access
- PATH integration verification
- Cross-platform executable handling
- Update mechanism implementation

### 10. Testing Requirements

#### 10.1 Unit Tests

- Project detection accuracy
- Template merging correctness
- Path resolution functionality
- Configuration validation logic

#### 10.2 Integration Tests

- Full installation workflow
- Hook execution verification
- Cross-platform compatibility
- Migration process validation

#### 10.3 End-to-End Tests

- Real project integration
- Claude Code compatibility
- Performance benchmarking
- User experience validation

### 11. Documentation Requirements

#### 11.1 User Documentation

- Installation guide
- Configuration options
- Troubleshooting guide
- Migration instructions

#### 11.2 Developer Documentation

- API reference
- Extension guidelines
- Contributing instructions
- Architecture overview

#### 11.3 Examples and Tutorials

- Quick start guide
- Project-specific setups
- Custom hook development
- Advanced configuration

---

This comprehensive documentation covers every aspect needed to transform the parallel Claude development workflow into a professional, distributable NPM package that meets all requirements for global installation and "right out of the box" functionality.
