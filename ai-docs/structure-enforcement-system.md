# Structure Enforcement System Documentation

## Overview

The Structure Enforcement System maintains clean root directory organization through a two-pronged approach:

1. **Preventive Hook**: `pre_tool_use.py` blocks violations in real-time
2. **Cleanup Command**: `/enforce-structure` detects and fixes existing violations

## Root Directory Rules

### ✅ Allowed .md Files ONLY

- `README.md` - Main project documentation
- `CHANGELOG.md` - Version history
- `CLAUDE.md` - Project AI instructions
- `ROADMAP.md` - Project roadmap
- `SECURITY.md` - Security policy
- `LICENSE.md` - License information

### 📁 Essential Framework Directories (Must Stay in Root)

- `ai-docs/` - Framework AI documentation and templates
- `src/` - Source code
- `test/` - Test files
- `bin/` - Binary/executable files
- `lib/` - Library files
- `.claude/` - Claude configuration
- `config/` - Configuration files
- `scripts/` - Utility scripts
- `docs/` - Project documentation

### 🚫 Forbidden Files (Auto-relocated)

#### Config Files → `config/`

- `jest.config*.js` - Jest test configurations
- `babel.config.js` - Babel transpilation config
- `webpack.config*.js` - Webpack build configs
- `tsconfig*.json` - TypeScript configurations
- `docker-compose.yml` - Docker Compose files
- `Dockerfile*` - Docker container definitions

#### Scripts → `scripts/`

- `*.sh` - Shell scripts
- `build.js` - Build scripts
- `deploy.js` - Deployment scripts
- `publish.js` → `scripts/deployment/` (deployment-specific)

#### Documentation → `docs/`

- `USAGE.md` - Usage documentation
- `CONTRIBUTING.md` - Contributing guidelines
- `ARCHITECTURE.md` - Architecture documentation
- `API.md` - API documentation
- `*-report.md` - Report documents
- `*-plan.md` - Planning documents

#### Temporary/Debug → `archive/`

- `debug-*.js` - Debug utility scripts
- `test-*.js` - Test utility scripts
- `temp-*` - Temporary files

## System Components

### 1. Pre-Tool Hook (`pre_tool_use.py`)

**Location**: `.claude/hooks/pre_tool_use.py`

**Function**: Real-time prevention of structure violations

**Triggers**: Before any `Write`, `Edit`, or `MultiEdit` operation

**Behavior**:

- Analyzes target file path and name
- Blocks unauthorized files in root directory
- Provides helpful error messages with rules
- Suggests using `/enforce-structure --fix`

**Example Block Message**:

```
🚫 ROOT STRUCTURE VIOLATION BLOCKED
   File: jest.config.test.js
   Reason: Unauthorized file in root directory

📋 Root directory rules:
   • Only these .md files allowed: README.md, CHANGELOG.md, CLAUDE.md, ROADMAP.md, SECURITY.md
   • Config files belong in config/ directory
   • Scripts belong in scripts/ directory
   • Documentation belongs in docs/ directory

💡 Suggestion: Use /enforce-structure --fix to auto-organize files
```

### 2. Enforcement Command (`/enforce-structure`)

**Location**: `src/commands/enforce-structure.js`

**Function**: Detect and fix existing structure violations

**Usage**:

```bash
/enforce-structure                 # Check for violations
/enforce-structure --dry-run       # Preview fixes
/enforce-structure --fix           # Auto-fix violations
/enforce-structure --report        # Generate JSON report
```

**Capabilities**:

- Scans entire root directory
- Identifies all violations with reasons
- Automatically moves files to correct locations
- Preserves file contents and permissions
- Updates references when possible
- Generates detailed reports

### 3. Command Integration

**Claude Command**: Available as `/enforce-structure` in Claude Code

**CLI Access**: Direct Node.js execution supported

**Integration Points**:

- Claude Code slash commands
- Pre-commit hooks (potential)
- CI/CD pipelines (potential)
- Package.json scripts (potential)

## Implementation Details

### Path Detection Logic

The system uses sophisticated path analysis:

```python
# Normalize paths to handle different formats
normalized_path = os.path.normpath(file_path)

# Check for root directory files
if '/' in normalized_path:
    dir_part = os.path.dirname(normalized_path)
    if dir_part and dir_part not in ['.', '']:
        return False  # Not in root

# Handle absolute paths
if file_path.startswith('/Users/') and 'paralell-development-claude' in file_path:
    parts = file_path.split('paralell-development-claude/')
    if len(parts) > 1:
        relative_path = parts[1]
        if '/' in relative_path:
            return False  # Subdirectory file
```

### File Classification

**Pattern Matching**: Uses regex patterns for flexible file detection

**Rule Sets**: Modular rule definitions for easy maintenance

**Exceptions**: Essential root files explicitly allowed

### Error Handling

**Graceful Degradation**: System failures don't break workflows

**Clear Messages**: User-friendly violation explanations

**Recovery Suggestions**: Actionable remediation guidance

## Configuration

### Customization Points

1. **Allowed .md Files**: Modify `allowed_md_files` set
2. **Forbidden Patterns**: Update `forbidden_patterns` array
3. **Target Locations**: Adjust destination directories
4. **Essential Files**: Maintain `essentialRootFiles` list

### Rule Modification

To add new rules, update both:

1. Hook function: `check_root_structure_violations()`
2. Command class: `StructureEnforcer.rules`

## Maintenance

### Regular Tasks

1. **Pattern Updates**: Add new file types as needed
2. **Rule Validation**: Test enforcement with new patterns
3. **Performance Monitoring**: Ensure hook doesn't slow operations
4. **User Feedback**: Incorporate developer suggestions

### Troubleshooting

**Hook Not Triggering**: Check path detection logic
**False Positives**: Review pattern specificity  
**Performance Issues**: Optimize regex patterns
**Configuration Errors**: Validate rule syntax

## Benefits

### Developer Experience

- ✅ **Automatic Organization**: Files go to correct locations
- ✅ **Real-time Prevention**: Blocks violations immediately
- ✅ **Clear Guidance**: Helpful error messages and suggestions
- ✅ **Zero Configuration**: Works out of the box

### Project Quality

- ✅ **Professional Appearance**: Clean, organized root directory
- ✅ **Consistent Structure**: Enforced across all contributors
- ✅ **Maintainable Codebase**: Logical file organization
- ✅ **Onboarding Friendly**: New developers see clean structure

### Long-term Value

- ✅ **Scalable Rules**: Easy to add new file types and patterns
- ✅ **Reversible Changes**: All moves can be undone if needed
- ✅ **Integration Ready**: Hooks into existing workflows
- ✅ **Documentation**: Self-documenting through error messages

This system ensures the root directory stays clean and professional while providing helpful guidance to developers about proper file organization.
