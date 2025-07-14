# Migration Guide: Shell/JavaScript to Python Scripts

This guide provides step-by-step instructions for migrating from the old Shell and JavaScript scripts to the new Python scripts with UV package management.

## Overview

The parallel development system has migrated all scripts to Python for:
- **Better cross-platform compatibility** (Windows, macOS, Linux)
- **Improved dependency management** with UV
- **Consistent YAML output format**
- **Enhanced error handling and user experience**
- **Type safety and better maintainability**

## Migration Status

All 14 scripts have been successfully converted:

| Old Script | New Script | Type |
|------------|------------|------|
| `cache-linear-issue.sh` | `cache-linear-issue.py` | Shell → Python |
| `test-locally.sh` | `test-locally.py` | Shell → Python |
| `deploy.sh` | `deploy.py` | Shell → Python |
| `spawn-agents.sh` | `spawn-agents.py` | Shell → Python |
| `agent-commit-enhanced.sh` | `agent-commit.py` | Shell → Python |
| `monitor-agents.sh` | `monitor-agents.py` | Shell → Python |
| `validate-parallel-work.sh` | `validate-parallel-work.py` | Shell → Python |
| `integrate-parallel-work.sh` | `integrate-parallel-work.py` | Shell → Python |
| `resolve-conflicts.sh` | `resolve-conflicts.py` | Shell → Python |
| `intelligent-agent-generator.js` | `intelligent-agent-generator.py` | JS → Python |
| `decompose-parallel.cjs` | `decompose-parallel.py` | JS → Python |
| `prepublish.js` | `prepublish.py` | JS → Python |
| `postpublish.js` | `postpublish.py` | JS → Python |
| `security-check.js` | `security-check.py` | JS → Python |

## Prerequisites

### 1. Install UV

Follow the [UV Installation Guide](uv-installation-guide.md) for your platform.

Quick install:
```bash
# macOS
brew install uv

# Linux/WSL
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Verify Python Version

Ensure Python 3.11+ is installed:
```bash
python --version  # Should show 3.11 or higher
```

## Migration Steps

### Step 1: Update Package.json Scripts

If you're using npm scripts, update them to use Python versions:

```json
{
  "scripts": {
    "security:check": "./scripts/python/security-check.py",
    "prepublishOnly": "chmod +x scripts/python/*.py && npm run security:check",
    "postpublish": "./scripts/python/postpublish.py",
    "prepare": "./scripts/python/prepublish.py"
  }
}
```

### Step 2: Update CLI Commands

The CDEV CLI has been updated to use Python scripts automatically:

```bash
# These commands now use Python scripts internally
cdev get LINEAR-123      # Uses cache-linear-issue.py
cdev split task.yaml     # Uses decompose-parallel.py  
cdev run                 # Uses spawn-agents.py
cdev status             # Uses monitor-agents.py
cdev commit             # Uses agent-commit.py
```

### Step 3: Update Direct Script Calls

Replace direct script calls in your workflows:

```bash
# Old way
./scripts/monitor-agents.sh

# New way
./scripts/python/monitor-agents.py
```

### Step 4: Update CI/CD Pipelines

Update GitHub Actions or other CI/CD configurations:

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      
      # Install UV
      - name: Install UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
        
      # Make scripts executable
      - name: Setup Python scripts
        run: chmod +x scripts/python/*.py
        
      # Run security check
      - name: Security Check
        run: ./scripts/python/security-check.py
```

### Step 5: Environment Variables

The Python scripts use the same environment variables:

```bash
# Publishing scripts
export FORCE_PUBLISH=1
export ALLOW_DIRTY=1

# Linear integration
export LINEAR_API_KEY="your-api-key"
```

## Key Differences

### 1. Output Format

All scripts now output YAML by default (instead of JSON):

```bash
# Get YAML output
./scripts/python/monitor-agents.py --output-format yaml

# Old JSON output
./scripts/monitor-agents.sh  # Produced JSON
```

### 2. Command-Line Arguments

Python scripts use Click for consistent CLI:

```bash
# Old shell script
./scripts/agent-commit-enhanced.sh /path/to/workspace "commit message"

# New Python script  
./scripts/python/agent-commit.py /path/to/workspace --message "commit message"

# All scripts support --help
./scripts/python/agent-commit.py --help
```

### 3. Error Handling

Python scripts provide better error messages:

```bash
# Old: Cryptic shell errors
./scripts/spawn-agents.sh
# Error: line 42: deployment_plan.json: No such file

# New: Clear Python errors with hints
./scripts/python/spawn-agents.py
# Error: Deployment plan not found: deployment_plan.json
# Hint: Run 'cdev split' first to create a deployment plan
```

### 4. Rich Terminal Output

Python scripts use Rich for better formatting:
- Colored output
- Progress bars
- Formatted tables
- Interactive prompts

## Common Migration Issues

### Issue 1: Permission Denied

```bash
# Error: Permission denied
./scripts/python/script.py

# Solution: Make executable
chmod +x scripts/python/*.py
```

### Issue 2: UV Not Found

```bash
# Error: env: 'uv': No such file or directory

# Solution: Install UV and update PATH
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.cargo/bin:$PATH"
```

### Issue 3: Python Version

```bash
# Error: Python 3.11+ required

# Solution: Install Python 3.11+
# macOS
brew install python@3.11

# Ubuntu/Debian  
sudo apt install python3.11
```

### Issue 4: Different Arguments

```bash
# Check new argument format
./scripts/python/script-name.py --help

# Most scripts follow this pattern:
./scripts/python/script.py [OPTIONS] [ARGUMENTS]
```

## Gradual Migration Strategy

If you can't migrate everything at once:

### 1. Start with Non-Critical Scripts

Begin with scripts that aren't part of critical workflows:
- `test-locally.py`
- `security-check.py`

### 2. Test in Development

Run both versions in parallel to verify behavior:
```bash
# Compare outputs
./scripts/monitor-agents.sh > old-output.json
./scripts/python/monitor-agents.py --output-format yaml > new-output.yaml
```

### 3. Update One Workflow at a Time

Migrate complete workflows together:
- Publishing workflow: `prepublish.py`, `postpublish.py`, `security-check.py`
- Agent workflow: `spawn-agents.py`, `monitor-agents.py`, `agent-commit.py`

### 4. Keep Old Scripts During Transition

Don't delete old scripts until fully migrated and tested.

## Rollback Plan

If issues arise, you can temporarily rollback:

1. **CLI Level**: The old scripts are still present
   ```bash
   # Use old scripts directly
   ./scripts/monitor-agents.sh
   ```

2. **Package.json**: Revert script references
   ```json
   {
     "scripts": {
       "security:check": "node scripts/security-check.js"
     }
   }
   ```

## Benefits After Migration

### 1. Cross-Platform Support
- Scripts work on Windows (with WSL), macOS, and Linux
- No more bash compatibility issues

### 2. Better Performance
- UV caches dependencies for fast execution
- Python scripts start faster than Node.js

### 3. Improved Maintainability
- Type hints catch errors early
- Consistent code structure
- Better testing capabilities

### 4. Enhanced Features
- Rich terminal UI
- Interactive prompts
- Better error messages
- YAML output for readability

## Verification Checklist

After migration, verify:

- [ ] UV is installed and in PATH
- [ ] Python 3.11+ is available
- [ ] All Python scripts are executable
- [ ] CDEV CLI commands work correctly
- [ ] CI/CD pipelines pass
- [ ] No functionality regression

## Getting Help

- Check [Troubleshooting Guide](troubleshooting-python-scripts.md) for common issues
- Review [Script Usage Examples](script-usage-examples.md) for usage patterns
- See [Old vs New Comparison](old-vs-new-comparison.md) for detailed differences

## Next Steps

1. Complete the migration checklist above
2. Test all workflows in your environment
3. Update any custom scripts or automation
4. Remove old shell/JS scripts after verification
5. Enjoy the improved development experience!