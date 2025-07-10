# Troubleshooting Guide

This guide helps you resolve common issues with Claude Code Hooks.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Hook Problems](#hook-problems)
- [Linear Integration](#linear-integration)
- [Performance Issues](#performance-issues)
- [Platform-Specific Issues](#platform-specific-issues)
- [Error Messages](#error-messages)
- [Getting Help](#getting-help)

## Installation Issues

### NPX Command Not Found

**Problem:**
```bash
$ npx cdev get PROJ-123
command not found: npx
```

**Solution:**
```bash
# Ensure Node.js is installed with npm 5.2+
node --version  # Should be v16+
npm --version   # Should be 5.2+

# If npx is missing, install it
npm install -g npx

# Or install cdev globally
npm install -g cdev
cdev get PROJ-123
```

### Permission Denied During Installation

**Problem:**
```bash
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solution:**
```bash
# Option 1: Use npx (recommended)
npx cdev get PROJ-123

# Option 2: Change npm prefix
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 3: Use a Node version manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Python Not Found

**Problem:**
```bash
Error: Python executable not found
```

**Solution:**
```bash
# Check Python installation
python3 --version

# Install Python if missing
# macOS
brew install python@3.11

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3 python3-pip

# Windows
# Download from https://www.python.org/downloads/

# Set custom Python path
export CLAUDE_PYTHON_PATH=$(which python3)
```

## Hook Problems

### Hooks Not Triggering

**Problem:** Hooks are installed but not executing when using Claude.

**Diagnosis:**
```bash
# Check hook configuration
cat .claude/settings.json | jq .hooks

# Test hooks manually
python3 .claude/hooks/pre_tool_use.py < test-input.json

# Check Claude settings
claude --version
claude --show-settings
```

**Solutions:**

1. **Verify hook paths:**
   ```json
   {
     "hooks": {
       "pre_tool_use": "python3 .claude/hooks/pre_tool_use.py",
       "post_tool_use": "python3 .claude/hooks/post_tool_use.py"
     }
   }
   ```

2. **Check file permissions:**
   ```bash
   chmod +x .claude/hooks/*.py
   ls -la .claude/hooks/
   ```

3. **Enable debug mode:**
   ```bash
   export CLAUDE_DEBUG=true
   claude
   ```

### Hook Timeout Errors

**Problem:**
```
Hook execution timed out after 5000ms
```

**Solution:**
```json
// .claude/settings.json
{
  "hookTimeout": 10000,  // Increase timeout to 10 seconds
  "asyncHooks": true     // Enable async execution
}
```

### TypeScript Validation Failing

**Problem:**
```
TypeScript validation failed: Cannot find module 'typescript'
```

**Solutions:**

1. **Install TypeScript locally:**
   ```bash
   npm install --save-dev typescript
   ```

2. **Configure TypeScript path:**
   ```json
   {
     "typescript": {
       "compilerPath": "./node_modules/.bin/tsc"
     }
   }
   ```

3. **Skip TypeScript for specific files:**
   ```json
   {
     "validation": {
       "typescript": {
         "exclude": ["*.js", "*.config.js"]
       }
     }
   }
   ```

## Linear Integration

### Linear API Key Issues

**Problem:**
```
Error: Linear API key not found or invalid
```

**Solutions:**

1. **Set environment variable:**
   ```bash
   export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
   
   # Add to shell profile
   echo 'export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"' >> ~/.bashrc
   ```

2. **Use .env file:**
   ```bash
   echo "LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx" >> .env
   ```

3. **Verify API key:**
   ```bash
   curl -H "Authorization: $LINEAR_API_KEY" \
     https://api.linear.app/graphql \
     -X POST \
     -d '{"query":"{ viewer { id email }}"}'
   ```

### Issue Not Found

**Problem:**
```
Error: Linear issue PROJ-123 not found
```

**Solutions:**

1. **Check issue ID format:**
   ```bash
   # Correct formats:
   PROJ-123
   ABC-1234
   
   # Incorrect:
   proj-123 (lowercase)
   123 (missing prefix)
   ```

2. **Verify permissions:**
   - Ensure API key has access to the project
   - Check if issue is archived
   - Verify team membership

### Git Worktree Errors

**Problem:**
```
fatal: could not create work tree dir: Permission denied
```

**Solutions:**

1. **Check Git version:**
   ```bash
   git --version  # Should be 2.0+
   ```

2. **Verify repository state:**
   ```bash
   git status
   git worktree list
   ```

3. **Clean up invalid worktrees:**
   ```bash
   git worktree prune
   git worktree list
   ```

## Performance Issues

### Slow Hook Execution

**Problem:** Hooks take too long to execute, slowing down Claude.

**Solutions:**

1. **Profile hook performance:**
   ```bash
   time python3 .claude/hooks/pre_tool_use.py < sample-input.json
   ```

2. **Disable expensive validations:**
   ```json
   {
     "validation": {
       "deepCodeAnalysis": false,
       "fullProjectScan": false
     }
   }
   ```

3. **Use async hooks:**
   ```json
   {
     "asyncHooks": true,
     "parallelHooks": true
   }
   ```

### High Memory Usage

**Problem:** Hooks consuming excessive memory.

**Solutions:**

1. **Limit file scanning:**
   ```json
   {
     "scanning": {
       "maxFileSize": "1MB",
       "excludeDirs": ["node_modules", "dist", ".next"]
     }
   }
   ```

2. **Disable unused features:**
   ```json
   {
     "features": {
       "codeMetrics": false,
       "dependencyAnalysis": false
     }
   }
   ```

## Platform-Specific Issues

### Windows

**Path Separator Issues:**
```bash
# Error: Cannot find module at path\to\file

# Fix: Use forward slashes in config
{
  "hooks": {
    "pre_tool_use": "python .claude/hooks/pre_tool_use.py"
  }
}
```

**Python Command:**
```bash
# Windows often uses 'python' instead of 'python3'
where python
python --version

# Update config if needed
{
  "pythonCommand": "python"
}
```

### macOS

**Shell Integration:**
```bash
# If using zsh (default on macOS Catalina+)
echo 'export LINEAR_API_KEY="xxx"' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export LINEAR_API_KEY="xxx"' >> ~/.bash_profile
source ~/.bash_profile
```

**Python SSL Certificates:**
```bash
# If SSL errors occur
pip3 install --upgrade certifi
```

### Linux

**Python Package Dependencies:**
```bash
# Ubuntu/Debian
sudo apt-get install python3-dev python3-pip

# Fedora/RHEL
sudo dnf install python3-devel python3-pip

# Arch
sudo pacman -S python python-pip
```

## Error Messages

### Common Errors and Solutions

**"Module not found: fs"**
```bash
# Ensure you're not trying to use Node.js modules in browser
# Check if running in correct environment
```

**"ENOENT: no such file or directory"**
```bash
# Verify file paths
ls -la .claude/
ls -la scripts/

# Reinstall if files are missing
git clone https://github.com/AOJDevStudio/cdev.git temp-cdev && cp -r temp-cdev/.claude . && cp -r temp-cdev/scripts . && rm -rf temp-cdev
```

**"Invalid hook response"**
```bash
# Ensure hooks return valid JSON
python3 .claude/hooks/pre_tool_use.py test

# Check hook output format
{
  "status": "success",
  "message": "Validation passed"
}
```

**"Git worktree already exists"**
```bash
# Remove existing worktree
git worktree remove ../project-work-trees/branch-name

# Or force removal
git worktree remove --force ../project-work-trees/branch-name
```

## Diagnostic Commands

### System Check

```bash
# Check cdev is working
cdev help

# Check version
cdev --version

# Test with a simple command
cdev status
```

### Debug Information

```bash
# Check environment and collect info
echo "CDEV Version: $(cdev --version)" > debug.log
echo "Node Version: $(node --version)" >> debug.log
echo "NPM Version: $(npm --version)" >> debug.log
echo "Linear API Key Set: ${LINEAR_API_KEY:+Yes}" >> debug.log

# What's included:
# - System information
# - Package versions
# - Configuration
# - Recent error logs
```

### Test Individual Components

```bash
# Test Linear integration
cdev get PROJ-123  # Replace with a real issue ID

# Test decomposition
cdev split PROJ-123

# Check worktree status
cdev status
```

## Getting Help

### Before Asking for Help

1. **Update to latest version:**
   ```bash
   npm update -g cdev
   ```

2. **Check existing issues:**
   - [GitHub Issues](https://github.com/AOJDevStudio/cdev/issues)
   - Discord FAQ (Coming Soon)

3. **Collect diagnostic info:**
   ```bash
   cdev debug-info > debug.log
   ```

### Where to Get Help

1. **Discord Community:** (Coming Soon)
   - Real-time support from maintainers and community
   - Share experiences and best practices

2. **GitHub Issues:**
   - Bug reports
   - Feature requests
   - [Create Issue](https://github.com/AOJDevStudio/cdev/issues/new)

3. **Documentation:**
   - [Installation Guide](installation.md)
   - [Usage Guide](usage.md)
   - [API Reference](api-reference.md)

### Reporting Bugs

When reporting issues, include:

1. **Environment info:**
   ```bash
   node --version
   npm --version
   python3 --version
   git --version
   claude --version
   ```

2. **Error messages:**
   ```bash
   # Copy full error output
   # Include stack traces
   ```

3. **Steps to reproduce:**
   ```markdown
   1. Run command X
   2. See error Y
   3. Expected behavior Z
   ```

4. **Configuration:**
   ```bash
   # Sanitized .claude/settings.json
   # Remove any sensitive data
   ```