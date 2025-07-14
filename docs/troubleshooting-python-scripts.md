# Troubleshooting Python Scripts

This guide helps resolve common issues when using the Python scripts in the parallel development system.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Execution Problems](#execution-problems)
3. [Dependency Errors](#dependency-errors)
4. [Script-Specific Issues](#script-specific-issues)
5. [Platform-Specific Problems](#platform-specific-problems)
6. [YAML Output Issues](#yaml-output-issues)
7. [Performance Problems](#performance-problems)
8. [Integration Issues](#integration-issues)

---

## Installation Issues

### UV Not Found

**Error:**

```bash
env: 'uv': No such file or directory
```

**Solutions:**

1. **Install UV:**

   ```bash
   # macOS
   brew install uv

   # Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Windows
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

2. **Update PATH:**

   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export PATH="$HOME/.cargo/bin:$PATH"

   # Reload shell
   source ~/.bashrc
   ```

3. **Verify installation:**
   ```bash
   which uv
   uv --version
   ```

### Python Version Error

**Error:**

```
Python 3.11+ is required (found 3.9.7)
```

**Solutions:**

1. **Install Python 3.11+:**

   ```bash
   # macOS
   brew install python@3.11

   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3.11

   # Windows
   # Download from python.org
   ```

2. **Use pyenv for version management:**

   ```bash
   pyenv install 3.11.7
   pyenv local 3.11.7
   ```

3. **Update UV's Python selection:**
   ```bash
   uv python pin 3.11
   ```

---

## Execution Problems

### Permission Denied

**Error:**

```bash
bash: ./scripts/python/script.py: Permission denied
```

**Solution:**

```bash
# Make all Python scripts executable
chmod +x scripts/python/*.py

# Verify permissions
ls -la scripts/python/
```

### Script Not Found

**Error:**

```bash
bash: ./scripts/python/monitor-agents.py: No such file or directory
```

**Solutions:**

1. **Check current directory:**

   ```bash
   pwd  # Should be in project root
   ls scripts/python/  # Verify scripts exist
   ```

2. **Use absolute paths:**

   ```bash
   /full/path/to/project/scripts/python/monitor-agents.py
   ```

3. **Fix line endings (Windows → Unix):**
   ```bash
   dos2unix scripts/python/*.py
   ```

### Shebang Issues

**Error:**

```
bad interpreter: /usr/bin/env -S: no such file or directory
```

**Solutions:**

1. **Update shebang for older systems:**

   ```python
   #!/usr/bin/env python3
   # Then run with: uv run script.py
   ```

2. **Use UV directly:**
   ```bash
   uv run scripts/python/script.py
   ```

---

## Dependency Errors

### Package Installation Failures

**Error:**

```
Failed to install pyyaml>=6.0
```

**Solutions:**

1. **Clear UV cache:**

   ```bash
   uv cache clean
   uv cache prune
   ```

2. **Install system dependencies:**

   ```bash
   # For PyYAML on Ubuntu/Debian
   sudo apt-get install python3-dev libyaml-dev

   # On macOS
   brew install libyaml
   ```

3. **Use pre-built wheels:**
   ```bash
   UV_PREBUILT_WHEELS=1 ./scripts/python/script.py
   ```

### Import Errors

**Error:**

```python
ModuleNotFoundError: No module named 'click'
```

**Solutions:**

1. **Verify metadata block:**

   ```python
   # /// script
   # requires-python = ">=3.11"
   # dependencies = [
   #   "click>=8.1",  # Ensure this is listed
   # ]
   # ///
   ```

2. **Force dependency reinstall:**
   ```bash
   rm -rf ~/.cache/uv
   ./scripts/python/script.py
   ```

### Version Conflicts

**Error:**

```
Conflict: pyyaml 6.0 required, but pyyaml 5.4.1 is installed
```

**Solution:**

```bash
# Update UV
uv self update

# Clear environment and retry
uv cache clean
```

---

## Script-Specific Issues

### cache-linear-issue.py

**Issue: API Authentication Failed**

```
Error: Linear API returned 401: Unauthorized
```

**Solutions:**

1. **Set API key:**

   ```bash
   export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
   ```

2. **Verify API key:**

   ```bash
   curl -H "Authorization: $LINEAR_API_KEY" \
     https://api.linear.app/graphql
   ```

3. **Check key permissions:**
   - Ensure key has read access to issues
   - Regenerate key if needed

**Issue: Network Timeouts**

```
httpx.ConnectTimeout: timed out
```

**Solutions:**

1. **Increase timeout:**

   ```bash
   LINEAR_TIMEOUT=30 ./scripts/python/cache-linear-issue.py LINEAR-123
   ```

2. **Use proxy:**
   ```bash
   export HTTP_PROXY=http://proxy:8080
   export HTTPS_PROXY=http://proxy:8080
   ```

### spawn-agents.py

**Issue: Git Worktree Errors**

```
Error: fatal: invalid reference: main
```

**Solutions:**

1. **Ensure main branch exists:**

   ```bash
   git branch -a | grep main
   # If missing:
   git checkout -b main
   ```

2. **Update remote:**
   ```bash
   git fetch origin
   git branch --set-upstream-to=origin/main main
   ```

**Issue: Workspace Already Exists**

```
Error: Worktree './workspaces/agent' already exists
```

**Solutions:**

1. **Remove existing worktree:**

   ```bash
   git worktree remove ./workspaces/agent
   ```

2. **Force recreation:**
   ```bash
   ./scripts/python/spawn-agents.py deployment-plan.yaml --force
   ```

### monitor-agents.py

**Issue: No Agents Found**

```
No agent workspaces found in ./workspaces
```

**Solutions:**

1. **Check workspace directory:**

   ```bash
   ls -la ./workspaces/
   ```

2. **Specify correct path:**

   ```bash
   ./scripts/python/monitor-agents.py --workspace-dir /path/to/workspaces
   ```

3. **Run spawn-agents first:**
   ```bash
   ./scripts/python/spawn-agents.py deployment-plan.yaml
   ```

### agent-commit.py

**Issue: Validation Failures**

```
Error: Validation checklist incomplete (3/5 items)
```

**Solutions:**

1. **Check incomplete items:**

   ```bash
   cat workspaces/agent/validation_checklist.txt
   ```

2. **Force commit (not recommended):**
   ```bash
   ./scripts/python/agent-commit.py workspace --skip-validation
   ```

**Issue: Merge Conflicts**

```
Error: Merge conflict in src/config.ts
```

**Solutions:**

1. **Use resolve-conflicts script:**

   ```bash
   ./scripts/python/resolve-conflicts.py --agent agent_name
   ```

2. **Manual resolution:**
   ```bash
   cd workspaces/agent
   git merge main
   # Fix conflicts
   git add .
   git commit
   ```

### Publishing Scripts Issues

**prepublish.py - Dirty Working Directory**

```
Error: Working directory not clean
```

**Solutions:**

1. **Commit changes:**

   ```bash
   git add .
   git commit -m "chore: prepare for release"
   ```

2. **Allow dirty (development only):**
   ```bash
   ALLOW_DIRTY=1 ./scripts/python/prepublish.py
   ```

**postpublish.py - NPM Verification Failed**

```
Error: Package not found on NPM registry
```

**Solutions:**

1. **Wait for propagation:**

   ```bash
   sleep 30
   ./scripts/python/postpublish.py
   ```

2. **Skip verification:**
   ```bash
   ./scripts/python/postpublish.py --skip-verification
   ```

---

## Platform-Specific Problems

### Windows (Native)

**Issue: Script Execution Fails**

**Solutions:**

1. **Use WSL (recommended):**

   ```bash
   wsl
   ./scripts/python/script.py
   ```

2. **Run with Python directly:**

   ```powershell
   python scripts/python/script.py
   ```

3. **Fix path separators:**
   ```python
   # Scripts handle this automatically
   # But ensure forward slashes in configs
   ```

### macOS

**Issue: SSL Certificate Errors**

```
ssl.SSLCertVerificationError
```

**Solutions:**

1. **Update certificates:**

   ```bash
   brew install ca-certificates
   ```

2. **Python certificates:**
   ```bash
   pip install --upgrade certifi
   ```

### Linux

**Issue: Missing System Libraries**

**Solutions:**

1. **Install build dependencies:**

   ```bash
   # Ubuntu/Debian
   sudo apt-get install build-essential python3-dev

   # RHEL/CentOS
   sudo yum groupinstall "Development Tools"
   ```

---

## YAML Output Issues

### Malformed YAML

**Error:**

```
yaml.scanner.ScannerError: mapping values are not allowed here
```

**Solutions:**

1. **Use console output for debugging:**

   ```bash
   ./scripts/python/script.py  # Without --output-format yaml
   ```

2. **Validate YAML:**
   ```bash
   ./scripts/python/script.py --output-format yaml | yq validate
   ```

### Encoding Issues

**Error:**

```
UnicodeDecodeError: 'utf-8' codec can't decode
```

**Solutions:**

1. **Set UTF-8 locale:**

   ```bash
   export LANG=en_US.UTF-8
   export LC_ALL=en_US.UTF-8
   ```

2. **Use explicit encoding:**
   ```bash
   ./scripts/python/script.py | iconv -f utf-8 -t utf-8 -c
   ```

---

## Performance Problems

### Slow First Run

**Issue:** First execution takes several minutes

**Solutions:**

1. **Pre-download dependencies:**

   ```bash
   uv pip install pyyaml click rich httpx gitpython
   ```

2. **Use local package index:**
   ```bash
   uv config set index-url http://local-pypi:8080/simple/
   ```

### High Memory Usage

**Solutions:**

1. **Limit concurrent operations:**

   ```bash
   ./scripts/python/integrate-parallel-work.py --max-parallel 2
   ```

2. **Clear caches:**
   ```bash
   uv cache clean
   git gc --aggressive
   ```

---

## Integration Issues

### CDEV CLI Not Using Python Scripts

**Issue:** `cdev` commands still use old scripts

**Solutions:**

1. **Update cdev:**

   ```bash
   npm update -g @aojdevstudio/cdev
   ```

2. **Verify CLI configuration:**

   ```bash
   cdev config show
   ```

3. **Reinstall:**
   ```bash
   npm uninstall -g @aojdevstudio/cdev
   npm install -g @aojdevstudio/cdev
   ```

### CI/CD Pipeline Failures

**Solutions:**

1. **Install UV in CI:**

   ```yaml
   # GitHub Actions
   - name: Install UV
     run: |
       curl -LsSf https://astral.sh/uv/install.sh | sh
       echo "$HOME/.cargo/bin" >> $GITHUB_PATH
   ```

2. **Cache dependencies:**
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.cache/uv
       key: ${{ runner.os }}-uv-${{ hashFiles('**/script') }}
   ```

---

## Debug Mode

Enable verbose output for troubleshooting:

```bash
# Set debug environment variable
DEBUG=1 ./scripts/python/script.py

# UV verbose mode
UV_LOG=debug ./scripts/python/script.py

# Python debugging
PYTHONDEBUG=1 ./scripts/python/script.py
```

## Getting Help

### Check Script Help

All scripts have built-in help:

```bash
./scripts/python/script-name.py --help
```

### Version Information

```bash
# Check UV version
uv --version

# Check Python version
python --version

# Check script dependencies
grep dependencies scripts/python/script-name.py
```

### Community Support

1. Check existing issues on GitHub
2. Search documentation
3. Ask in discussions

### Diagnostic Information

When reporting issues, include:

```bash
# System info
uname -a
python --version
uv --version

# Script metadata
head -20 scripts/python/problematic-script.py

# Error output
./scripts/python/script.py 2>&1 | tee error.log
```

## Common Fixes Summary

| Problem             | Quick Fix                                          |
| ------------------- | -------------------------------------------------- |
| UV not found        | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Permission denied   | `chmod +x scripts/python/*.py`                     |
| Import error        | `uv cache clean`                                   |
| YAML error          | Remove `--output-format yaml` to debug             |
| Git worktree exists | `git worktree remove <path>`                       |
| API auth failed     | `export LINEAR_API_KEY="your-key"`                 |
| Merge conflicts     | Use `resolve-conflicts.py`                         |
| Slow performance    | Pre-install dependencies with UV                   |

## Next Steps

- Review [Migration Guide](migration-guide.md) if coming from old scripts
- See [Script Usage Examples](script-usage-examples.md) for correct usage
- Check [UV Installation Guide](uv-installation-guide.md) for setup help
