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

3. **Python v3.7 or higher with UV package manager**

   ```bash
   python3 --version  # Should output Python 3.7 or higher

   # Install UV package manager
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

4. **Claude Code installed**
   ```bash
   claude --version  # Should show Claude Code version
   ```

## Quick Install

The fastest way to get started:

```bash
# Use directly with npx (no installation needed)
npx @aojdevstudio/cdev@latest install

# Or install as a project dependency
npm install --save-dev @aojdevstudio/cdev
```

## Setting Up Your Project

After installing CDEV, run the interactive installer:

```bash
# Initialize CDEV in your project
npx cdev install

# This will:
# - Copy necessary hooks and scripts to your project
# - Configure your project settings
# - Set up the required directory structure
# - Create .env file from template
```

### Verify the Installation

After running the installer, you should have these files in your project:

```bash
# Test that Python scripts were copied successfully
./scripts/python/test-locally.py --help

# Run security check (if available)
./scripts/python/security-check.py
```

### Environment Configuration

If you need to manually configure environment variables:

```bash
# Edit the generated .env file
# Linear API (optional, for issue tracking)
LINEAR_API_KEY=lin_api_xxxxx

# LLM Configuration (required for decompose-parallel features)
LLM_PROVIDER=openrouter  # or "openai" or "anthropic"
LLM_MODEL=mistralai/mistral-large-2411
OPENROUTER_API_KEY=sk-or-v1-xxxxx  # or OPENAI_API_KEY or ANTHROPIC_API_KEY
```

## Manual Setup

For complete control over the setup process:

### Option 1: Run the Installer Non-Interactively

```bash
# Install with default settings
npx cdev install --yes

# This skips all prompts and uses default configurations
```

### Option 2: Copy Files from Node Modules

If the installer doesn't work, you can manually copy files:

```bash
# After installing CDEV as a dependency
cd your-project

# Copy files from node_modules
cp -r node_modules/@aojdevstudio/cdev/.claude .
cp -r node_modules/@aojdevstudio/cdev/scripts .
cp node_modules/@aojdevstudio/cdev/.env.example .env

# Make scripts executable
chmod +x scripts/*.sh
chmod +x scripts/python/*.py
```

### Option 3: Clone Repository for Development

```bash
# Clone the repository for development/contribution
git clone https://github.com/AOJDevStudio/cdev.git
cd cdev

# Install dependencies
npm install

# Copy necessary files to your project
cp -r .claude /path/to/your-project/
cp -r scripts /path/to/your-project/
cp .env.example /path/to/your-project/.env
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
# Check that cdev is available
npx cdev --version

# Check installed files in your project
ls -la .claude/
ls -la scripts/

# Test a simple command
npx cdev help
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
# Update project dependency
npm update @aojdevstudio/cdev

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
# Remove project dependency
npm uninstall @aojdevstudio/cdev

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
npm install --save-dev @aojdevstudio/cdev

# Or use npx directly without installing
npx @aojdevstudio/cdev get PROJ-123
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
    npm install --save-dev @aojdevstudio/cdev
    # Copy hooks and scripts from your repository
    # (assumes they're already committed to your repo)

- name: Setup Python and UV
  run: |
    # Install UV package manager
    curl -LsSf https://astral.sh/uv/install.sh | sh
    echo "$HOME/.cargo/bin" >> $GITHUB_PATH

    # Make Python scripts executable
    chmod +x scripts/python/*.py
```

## Next Steps

After installation:

1. Read the [Usage Guide](usage.md) to learn about available features
2. Check [API Reference](api-reference.md) for programmatic usage
3. See [Troubleshooting](troubleshooting.md) for common issues
4. Join our Discord Community (Coming Soon) for support
