# UV Installation Guide

UV is a fast Python package manager developed by Astral, designed to be a drop-in replacement for pip with significant performance improvements. All Python scripts in the parallel development system use UV for dependency management.

## Why UV?

- **Speed**: 10-100x faster than pip for package operations
- **Self-contained scripts**: Dependencies specified inline with PEP 723
- **No virtual environment management**: UV handles isolation automatically
- **Cross-platform compatibility**: Works on Windows, macOS, and Linux
- **Reproducible builds**: Lockfile support for consistent dependencies

## Installation Methods

### macOS

#### Using Homebrew (Recommended)

```bash
brew install uv
```

#### Using the Official Installer

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### Using pip

```bash
pip install uv
```

### Linux

#### Using the Official Installer (Recommended)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### Using pip

```bash
pip install uv
```

#### Distribution-specific Methods

**Ubuntu/Debian:**

```bash
# Add to your .bashrc or .zshrc after installation
export PATH="$HOME/.cargo/bin:$PATH"
```

**Arch Linux (AUR):**

```bash
yay -S uv
# or
paru -S uv
```

### Windows

#### Using PowerShell (Recommended)

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### Using Scoop

```powershell
scoop install uv
```

#### Using pip

```powershell
pip install uv
```

#### WSL (Windows Subsystem for Linux)

Follow the Linux installation instructions within your WSL environment.

## Verifying Installation

After installation, verify UV is correctly installed:

```bash
uv --version
```

You should see output like:

```
uv 0.4.0 (stable)
```

## Environment Setup

### PATH Configuration

UV installs to different locations depending on your installation method:

- **Homebrew (macOS)**: `/opt/homebrew/bin/uv` or `/usr/local/bin/uv`
- **Official Installer**: `$HOME/.cargo/bin/uv`
- **pip**: Location depends on Python installation

Ensure UV is in your PATH by adding to your shell configuration:

**Bash (~/.bashrc):**

```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

**Zsh (~/.zshrc):**

```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

**Fish (~/.config/fish/config.fish):**

```fish
set -gx PATH $HOME/.cargo/bin $PATH
```

**PowerShell (Windows):**
Add to your PowerShell profile:

```powershell
$env:Path += ";$env:USERPROFILE\.cargo\bin"
```

### Python Version Requirements

The parallel development scripts require Python 3.11 or later. UV will automatically use the correct Python version based on script requirements.

Check your Python version:

```bash
python --version
# or
python3 --version
```

If you need to install Python 3.11+:

- **macOS**: `brew install python@3.11`
- **Ubuntu/Debian**: `sudo apt install python3.11`
- **Windows**: Download from [python.org](https://www.python.org/downloads/)

## Using UV with Scripts

All Python scripts in this project use UV's inline script format:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0"]
# ///
```

This allows scripts to be run directly without manual dependency installation:

```bash
./scripts/python/monitor-agents.py --help
```

UV automatically:

1. Creates an isolated environment
2. Installs required dependencies
3. Runs the script with the correct Python version

## Troubleshooting

### "uv: command not found"

1. Ensure UV is installed: Re-run the installation command
2. Check PATH: Run `echo $PATH` and verify UV's location is included
3. Reload shell configuration: `source ~/.bashrc` (or appropriate file)

### Permission Denied

Make scripts executable:

```bash
chmod +x scripts/python/*.py
```

### SSL Certificate Errors

If you encounter SSL errors during installation:

```bash
# Temporary workaround (not recommended for production)
export UV_NO_VERIFY_SSL=1
```

### Corporate Proxy Issues

Configure UV to use your proxy:

```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

### Windows-specific Issues

1. **Execution Policy**: If scripts won't run, update PowerShell execution policy:

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Path Separators**: UV handles path conversion automatically, but ensure you use forward slashes in scripts

## Advanced Configuration

### UV Configuration File

Create `~/.config/uv/config.toml` for persistent settings:

```toml
[global]
index-url = "https://pypi.org/simple"
extra-index-url = ["https://download.pytorch.org/whl/cpu"]

[install]
compile = true
```

### Cache Management

UV caches packages for faster subsequent installs:

```bash
# View cache info
uv cache info

# Clean cache
uv cache clean
```

## Integration with IDEs

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "python.terminal.activateEnvironment": true
}
```

### PyCharm

1. Go to Settings → Project → Python Interpreter
2. Add Interpreter → System Interpreter
3. Select the Python executable UV uses

## Next Steps

- Read the [Standalone Scripts Guide](standalone-scripts-guide.md) to understand the script structure
- See [Script Usage Examples](script-usage-examples.md) for practical examples
- Check [Troubleshooting Guide](troubleshooting-python-scripts.md) for common issues

## Resources

- [UV Documentation](https://docs.astral.sh/uv/)
- [PEP 723 - Inline script metadata](https://peps.python.org/pep-0723/)
- [UV GitHub Repository](https://github.com/astral-sh/uv)
