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
# Install globally (recommended)
npm install -g cdev

# Or use directly with npx
npx cdev get PROJ-123
```

## Setting Up Your Project

After installing CDEV globally, you need to set up the hooks and scripts in your project:

1. **Clone the hooks and scripts**
   ```bash
   # Navigate to your project
   cd your-project
   
   # Get the necessary files from the CDEV repository
   git clone https://github.com/AOJDevStudio/cdev.git temp-cdev
   cp -r temp-cdev/.claude .
   cp -r temp-cdev/scripts .
   rm -rf temp-cdev
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file
   echo "LINEAR_API_KEY=lin_api_xxxxx" >> .env
   echo "LLM_MODEL=mistralai/mistral-large-2411" >> .env
   ```

3. **Make scripts executable**
   ```bash
   chmod +x scripts/*.sh
   ```

## Manual Setup

For complete control over the setup process:

### Basic Setup

```bash
# Clone the repository
git clone https://github.com/AOJDevStudio/cdev.git
cd cdev

# Install as global package
npm install -g .

# Copy necessary files to your project
cp -r .claude /path/to/your-project/
cp -r scripts /path/to/your-project/
```

### Selective Hook Installation

To use only specific hooks, copy them individually:

```bash
# Copy only the hooks you need
cp .claude/hooks/pre_tool_use.py /path/to/your-project/.claude/hooks/
cp .claude/hooks/typescript-validator.py /path/to/your-project/.claude/hooks/
```

### Custom Configuration

Edit `.claude/settings.json` to customize behavior:

```json
{
  "hooks": {
    "pre_tool_use": "python3 .claude/hooks/pre_tool_use.py",
    "post_tool_use": "python3 .claude/hooks/post_tool_use.py"
  },
  "validation": {
    "typescript": true,
    "eslint": true
  }
}
```

## Framework-Specific Configurations

### Next.js Projects

For Next.js projects, ensure your `.claude/settings.json` includes:

```json
{
  "projectType": "nextjs",
  "validation": {
    "typescript": true,
    "appRouter": true,
    "serverComponents": true
  }
}
```

### React Projects

For React applications:

```json
{
  "projectType": "react",
  "validation": {
    "typescript": true,
    "hooks": true,
    "jsx": true
  }
}
```

### Node.js Backend

For Node.js services:

```json
{
  "projectType": "node",
  "validation": {
    "typescript": true,
    "apiPatterns": true
  }
}
```

### Python Projects

For Python applications:

```json
{
  "projectType": "python",
  "pythonCommand": "python3",
  "validation": {
    "typeHints": true,
    "pep8": true
  }
}
```

## Post-Installation Steps

### 1. Verify Installation

```bash
# Check that cdev is installed
cdev --version

# Check installed files in your project
ls -la .claude/
ls -la scripts/

# Test a simple command
cdev help
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
npm update -g cdev

# Update project files manually
cd your-project
git clone https://github.com/AOJDevStudio/cdev.git temp-cdev
cp -r temp-cdev/.claude .
cp -r temp-cdev/scripts .
rm -rf temp-cdev
```

## Uninstalling

### Complete Removal

```bash
# Remove global installation
npm uninstall -g cdev

# Remove from project
rm -rf .claude/
rm -rf scripts/
rm -rf .linear-cache/
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
# Better: use a Node version manager
nvm use 18
npm install -g cdev

# Or use npx directly without installing
npx cdev get PROJ-123
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

**Lock File Conflicts**
```bash
# When using the scripts, ensure you use the right package manager
# Check which lockfile exists
ls *.lock* *-lock.*

# Use the appropriate command
npm install    # if package-lock.json exists
pnpm install   # if pnpm-lock.yaml exists
yarn install   # if yarn.lock exists
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
- name: Install CDEV
  run: |
    npm install -g cdev
    # Copy hooks and scripts from your repository
    # (assumes they're already committed to your repo)
```

## Next Steps

After installation:

1. Read the [Usage Guide](usage.md) to learn about available features
2. Check [API Reference](api-reference.md) for programmatic usage
3. See [Troubleshooting](troubleshooting.md) for common issues
4. Join our Discord Community (Coming Soon) for support