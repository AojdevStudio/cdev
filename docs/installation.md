# Installation Guide

This guide covers all installation methods for Claude Code Hooks, from quick setup to advanced configurations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Install](#quick-install)
- [Interactive Installation](#interactive-installation)
- [Manual Installation](#manual-installation)
- [Project-Specific Setup](#project-specific-setup)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before installing Claude Code Hooks, ensure you have:

1. **Node.js v16.0.0 or higher**
   ```bash
   node --version  # Should output v16.0.0 or higher
   ```

2. **Git v2.0.0 or higher**
   ```bash
   git --version  # Should output 2.0.0 or higher
   ```

3. **Python v3.7 or higher**
   ```bash
   python3 --version  # Should output Python 3.7 or higher
   ```

4. **Claude Code installed**
   ```bash
   claude --version  # Should show Claude Code version
   ```

## Quick Install

The fastest way to get started:

```bash
# Install in current directory
npx claude-code-hooks install

# Install globally
npm install -g claude-code-hooks

# Install with all defaults (no prompts)
npx claude-code-hooks install --yes
```

## Interactive Installation

The interactive installer guides you through setup:

```bash
npx claude-code-hooks install --interactive
```

You'll be prompted for:

1. **Project Detection**
   - Automatically detects Next.js, React, Node.js, Python projects
   - Suggests appropriate hooks and configurations

2. **Package Manager Selection**
   ```
   ? Which package manager do you use?
   ❯ npm
     pnpm
     yarn
     bun
   ```

3. **Hook Selection**
   ```
   ? Which hooks would you like to install? (Press <space> to select)
   ❯◉ TypeScript Validator
    ◉ API Standards Checker
    ◉ Code Quality Reporter
    ◯ Import Organizer
    ◯ Commit Message Validator
   ```

4. **Linear Integration**
   ```
   ? Would you like to set up Linear integration? (Y/n)
   ? Enter your Linear API key: lin_api_xxxxx
   ```

5. **Framework-Specific Features**
   ```
   ? Install Next.js specific commands? (Y/n)
   ? Configure for App Router? (Y/n)
   ```

## Manual Installation

For fine-grained control over the installation:

### Basic Setup

```bash
# Clone the repository
git clone https://github.com/anthropics/claude-code-hooks.git
cd claude-code-hooks

# Install dependencies
npm install

# Copy files to your project
cp -r .claude /path/to/your-project/
cp -r scripts /path/to/your-project/
```

### Custom Hook Selection

Install only specific hooks:

```bash
# Install TypeScript and API validation only
npx claude-code-hooks install --hooks typescript-validator,api-standards-checker

# Install all hooks except commit validation
npx claude-code-hooks install --skip-hooks commit-message-validator
```

### Configuration Options

```bash
# Preserve existing .claude directory
npx claude-code-hooks install --preserve

# Force overwrite existing files
npx claude-code-hooks install --force

# Specify package manager
npx claude-code-hooks install --pm pnpm

# Custom Python path
npx claude-code-hooks install --python /usr/local/bin/python3.11
```

## Project-Specific Setup

### Next.js Projects

```bash
npx claude-code-hooks install --preset nextjs
```

This installs:
- TypeScript validation with Next.js types
- App Router specific commands
- API route validation
- Server Component checks

### React Projects

```bash
npx claude-code-hooks install --preset react
```

Includes:
- Component validation
- Hook rules enforcement
- JSX formatting
- Testing utilities

### Node.js Backend

```bash
npx claude-code-hooks install --preset node
```

Features:
- API endpoint validation
- Express/Fastify detection
- Environment variable checks
- Database migration hooks

### Python Projects

```bash
npx claude-code-hooks install --preset python
```

Provides:
- Type hint validation
- PEP 8 enforcement
- Virtual environment detection
- Flask/Django specific hooks

### Monorepo Setup

```bash
npx claude-code-hooks install --preset monorepo
```

Configures:
- Workspace detection
- pnpm/yarn workspace support
- Cross-package validation
- Turbo integration

## Post-Installation Steps

### 1. Verify Installation

```bash
# Check installed files
ls -la .claude/
ls -la scripts/

# Test hook execution
claude-code-hooks test-hooks

# Run diagnostics
claude-code-hooks doctor
```

### 2. Configure Environment

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# Linear API key (if using Linear integration)
export LINEAR_API_KEY="lin_api_xxxxx"

# Custom Python path (if needed)
export CLAUDE_PYTHON_PATH="/usr/local/bin/python3"

# Enable debug mode (optional)
export CLAUDE_DEBUG=true
```

### 3. Update Git Configuration

The installer automatically updates `.gitignore`:

```gitignore
# Claude Code Hooks
.linear-cache/
logs/
*.log
.claude/settings.local.json
```

### 4. Configure IDE Integration

For VS Code:
```json
{
  "claude.hooksPath": ".claude/hooks",
  "claude.enableValidation": true
}
```

## Updating

### Update to Latest Version

```bash
# Update global installation
npm update -g claude-code-hooks

# Update in project
npx claude-code-hooks update
```

### Update Specific Components

```bash
# Update hooks only
npx claude-code-hooks update --hooks

# Update scripts only
npx claude-code-hooks update --scripts
```

### Check for Updates

```bash
# Check if updates are available
npx claude-code-hooks check-updates
```

## Uninstalling

### Complete Removal

```bash
# Uninstall from project
npx claude-code-hooks uninstall

# Remove global installation
npm uninstall -g claude-code-hooks
```

### Selective Removal

```bash
# Remove hooks but keep scripts
npx claude-code-hooks uninstall --keep-scripts

# Remove Linear integration only
npx claude-code-hooks uninstall --linear-only
```

### Manual Cleanup

```bash
# Remove directories
rm -rf .claude/
rm -rf scripts/
rm -rf .linear-cache/

# Clean up package.json scripts
npm pkg delete scripts.claude:cache
npm pkg delete scripts.claude:decompose
npm pkg delete scripts.claude:spawn
```

## Troubleshooting

### Installation Fails

**Permission Denied**
```bash
# Use sudo for global install (not recommended)
sudo npm install -g claude-code-hooks

# Better: use a Node version manager
nvm use 18
npm install -g claude-code-hooks
```

**Python Not Found**
```bash
# Install Python 3
# macOS
brew install python@3.11

# Ubuntu/Debian
sudo apt-get install python3 python3-pip

# Windows
# Download from python.org
```

**Git Worktree Issues**
```bash
# Ensure Git is updated
git --version  # Should be 2.0.0+

# Enable worktree feature
git config --global extensions.worktreeConfig true
```

### Hooks Not Working

**Check Claude Settings**
```bash
# Verify hooks are configured
cat .claude/settings.json

# Test individual hook
python3 .claude/hooks/pre_tool_use.py test
```

**Debug Mode**
```bash
# Enable verbose logging
export CLAUDE_DEBUG=true

# Check hook logs
tail -f logs/claude-hooks.log
```

### Package Manager Conflicts

**Wrong Package Manager Detected**
```bash
# Force specific package manager
npx claude-code-hooks install --pm npm --force
```

**Lock File Conflicts**
```bash
# Remove conflicting lock files
rm package-lock.json yarn.lock pnpm-lock.yaml
# Then reinstall
npx claude-code-hooks install
```

## Advanced Configuration

### Custom Hook Directory

```json
// .claude/settings.json
{
  "hooksDir": "./custom-hooks",
  "hooks": {
    "pre_tool_use": "python3 ./custom-hooks/pre_validate.py"
  }
}
```

### Environment-Specific Settings

```bash
# Development
cp .claude/settings.json .claude/settings.development.json

# Production
cp .claude/settings.json .claude/settings.production.json

# Use environment variable
export CLAUDE_ENV=development
```

### CI/CD Integration

```yaml
# GitHub Actions
- name: Install Claude Code Hooks
  run: |
    npx claude-code-hooks install --yes --ci
    npx claude-code-hooks test-hooks
```

## Next Steps

After installation:

1. Read the [Usage Guide](usage.md) to learn about available features
2. Check [API Reference](api-reference.md) for programmatic usage
3. See [Troubleshooting](troubleshooting.md) for common issues
4. Join our Discord Community (Coming Soon) for support