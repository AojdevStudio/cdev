# CDEV Changelog Automation Scripts

Production-ready changelog automation system following the conventions defined in `ai-docs/changelog-conventions.md`.

## 📁 Files

- **`update-changelog.js`** - Main changelog automation script
- **`utils.js`** - Helper functions for git analysis and file manipulation
- **`README.md`** - This documentation file

## 🚀 Quick Start

```bash
# Auto-analyze git commits and update changelog
npm run changelog:auto

# Manual entry mode for custom changelog entries
npm run changelog:manual

# Preview changes without modifying files
npm run changelog:preview

# Update with specific version
npm run changelog:update 1.5.0 --auto
```

## 📖 Available Commands

### `npm run changelog:update [version] [options]`

Main command with full control over version and mode.

**Arguments:**

- `version` - Semantic version number (e.g., `1.5.0`)

**Options:**

- `--auto` - Automatically analyze git commits since last release
- `--manual` - Interactive mode for manual entry
- `--dry-run` - Preview changes without modifying files
- `--verbose` - Show detailed error information

### `npm run changelog:auto`

Shortcut for automatic changelog generation using git commit analysis.

### `npm run changelog:manual`

Shortcut for interactive manual changelog entry.

### `npm run changelog:preview`

Shortcut for previewing auto-generated changelog without making changes.

## 🔧 Features

### Automatic Git Analysis

- **Commit Parsing**: Analyzes git commits since last tag/release
- **Conventional Commits**: Supports conventional commit format (`feat:`, `fix:`, etc.)
- **Smart Inference**: Automatically categorizes non-conventional commits
- **PR Detection**: Extracts PR numbers from commit messages
- **Version Bump**: Auto-determines semantic version bump based on commit types

### Manual Entry Mode

- **Interactive Prompts**: Guided entry for each changelog category
- **Category Support**: All Keep a Changelog categories (Added, Changed, Deprecated, Removed, Fixed, Security)
- **Validation**: Input validation and confirmation prompts

### File Management

- **Safe Updates**: Creates backups before modifying CHANGELOG.md
- **Structure Validation**: Ensures proper changelog format
- **Version Links**: Auto-updates comparison links at file bottom
- **Error Handling**: Comprehensive error handling with rollback capability

## 📋 Workflow Integration

### Simple Release Workflow

```bash
# 1. Preview upcoming changelog
npm run changelog:preview

# 2. Generate changelog for new version
npm run changelog:auto

# 3. Review and commit changes
git add CHANGELOG.md
git commit -m "docs: update changelog for v1.5.0"

# 4. Create release tag
git tag v1.5.0
git push --tags
```

### Complex Release Workflow

```bash
# 1. Manual changelog with custom entries
npm run changelog:manual

# 2. Update package.json version
npm version minor

# 3. Update changelog with exact version
npm run changelog:update 1.5.0 --manual

# 4. Commit and tag
git add CHANGELOG.md package.json
git commit -m "chore: release v1.5.0"
git tag v1.5.0
```

## 🎯 Interface Contract for Agent 2

### Script Location and Entry Point

```
scripts/changelog/update-changelog.js
```

### Command Line Interface

```bash
node scripts/changelog/update-changelog.js [version] [options]
```

### Available Options

| Option      | Description              | Default                       |
| ----------- | ------------------------ | ----------------------------- |
| `--auto`    | Auto-analyze git commits | `true` (if no mode specified) |
| `--manual`  | Interactive manual mode  | `false`                       |
| `--dry-run` | Preview without changes  | `false`                       |
| `--verbose` | Detailed error output    | `false`                       |

### Expected Behavior

1. **Version Detection**: If no version provided, auto-determines next semantic version
2. **Commit Analysis**: Parses git commits since last tag using conventional commit patterns
3. **Categorization**: Groups changes into Keep a Changelog categories
4. **File Updates**: Safely updates CHANGELOG.md with new version entry
5. **Link Management**: Updates version comparison links at file bottom
6. **Validation**: Ensures changelog structure and format compliance

### Output Format

- **Success**: Updates CHANGELOG.md and provides next steps guidance
- **Dry Run**: Shows preview without file modifications
- **Error**: Detailed error messages with suggested fixes
- **Interactive**: Progress indicators and confirmation prompts

### Integration Points

- **NPM Scripts**: Available as `npm run changelog:*` commands
- **Git Integration**: Automatic tag detection and commit parsing
- **Package.json**: Reads repository URL and current version
- **Convention Compliance**: Follows `ai-docs/changelog-conventions.md` exactly

### Error Handling

- **File Not Found**: Clear error if CHANGELOG.md missing
- **Git Errors**: Graceful fallback when git commands fail
- **Version Validation**: Semantic version format validation
- **Structure Validation**: Ensures proper changelog format before updates

### Dependencies

All dependencies are already included in the main project:

- `commander` - CLI argument parsing
- `inquirer` - Interactive prompts
- `chalk` - Colored terminal output
- `semver` - Semantic version handling
- `fs` / `path` - File system operations
- `child_process` - Git command execution

## 🔒 NPM Package Compatibility

### Cross-Platform Support

- **Windows**: Full PowerShell and CMD support
- **macOS**: Native Unix command support
- **Linux**: Complete compatibility across distributions

### File Inclusion

Scripts are included in NPM package via `package.json` files configuration:

```json
{
  "files": ["scripts/changelog/"]
}
```

### Executable Permissions

Handled automatically in build process:

```json
{
  "scripts": {
    "build": "npm run quality && chmod +x scripts/changelog/*.js"
  }
}
```

## 🧪 Testing

### Manual Testing

```bash
# Test help output
npm run changelog:update -- --help

# Test dry run
npm run changelog:preview

# Test with specific version
npm run changelog:update 1.0.0 --dry-run --verbose
```

### Error Scenarios

- Missing CHANGELOG.md file
- Invalid version format
- Git repository issues
- Empty commit history
- Malformed changelog structure

## 🔗 Related Documentation

- [Changelog Conventions](../../ai-docs/changelog-conventions.md) - Complete style guide
- [Keep a Changelog](https://keepachangelog.com/) - Format specification
- [Semantic Versioning](https://semver.org/) - Version numbering rules
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message format

---

**Created by**: Agent 1 (Script Creator)  
**For**: Agent 2 (Hook Integration)  
**Last Updated**: July 28, 2025
