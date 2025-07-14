# Standalone Scripts Guide

This guide explains the standalone Python script approach used in the parallel development system, leveraging UV's inline dependency management for self-contained, executable scripts.

## Overview

All Python scripts in the `scripts/python/` directory are standalone, meaning they:
- Include all dependencies inline using PEP 723 format
- Run without manual virtual environment setup
- Execute directly without prior package installation
- Handle dependency management automatically via UV

## Script Structure

### Anatomy of a Standalone Script

Every script follows this structure:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pyyaml>=6.0",
#   "click>=8.1", 
#   "rich>=13.0",
#   "httpx>=0.25.0"
# ]
# ///

"""Script description and purpose"""

import sys
from pathlib import Path
from typing import Optional, Dict, Any

import click
import yaml
from rich.console import Console
from rich.panel import Panel

# Script implementation...
```

### Key Components

#### 1. Shebang Line
```python
#!/usr/bin/env -S uv run --script
```
- Uses `env -S` to pass multiple arguments
- Tells the system to run the script with UV
- UV handles Python version and dependencies

#### 2. PEP 723 Metadata Block
```python
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "dependency-name>=version"
# ]
# ///
```
- Enclosed in `# /// script` markers
- Specifies Python version requirements
- Lists all required dependencies
- UV reads this and sets up the environment

#### 3. Imports and Implementation
Standard Python code with full access to specified dependencies.

## Benefits of Standalone Scripts

### 1. Zero Setup Required
```bash
# Just run the script - UV handles everything
./scripts/python/monitor-agents.py
```

### 2. Reproducible Execution
Dependencies are locked to specific versions, ensuring consistent behavior across environments.

### 3. No Virtual Environment Management
UV creates isolated environments automatically:
- No `venv` creation needed
- No activation/deactivation required
- No `requirements.txt` files to maintain

### 4. Cross-Platform Compatibility
Scripts work identically on:
- macOS
- Linux
- Windows (with WSL or native Python)

### 5. Fast Execution
UV caches dependencies, making subsequent runs nearly instant.

## Common Patterns

### CLI Interface with Click

All scripts use Click for command-line interfaces:

```python
import click

@click.command()
@click.option('--output-format', type=click.Choice(['console', 'yaml']), 
              default='console', help='Output format')
@click.argument('task_id', required=False)
def main(output_format: str, task_id: Optional[str]):
    """Main command description"""
    if output_format == 'yaml':
        yaml.dump(result, sys.stdout)
    else:
        console.print(Panel(result))
```

### YAML Output Format

Scripts output YAML instead of JSON for better readability:

```python
from ruamel.yaml import YAML

yaml = YAML()
yaml.default_flow_style = False
yaml.preserve_quotes = True

# Output with proper formatting
yaml.dump(data, sys.stdout)
```

### Rich Terminal Output

Enhanced console output using Rich:

```python
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

# Status messages
console.print("[green]✓[/green] Operation successful")

# Tables
table = Table(title="Agent Status")
table.add_column("Agent", style="cyan")
table.add_column("Status", style="green")
console.print(table)

# Panels for important info
console.print(Panel("Important message", title="Notice"))
```

### Error Handling

Consistent error handling pattern:

```python
try:
    result = perform_operation()
except FileNotFoundError as e:
    console.print(f"[red]Error:[/red] {e}")
    sys.exit(1)
except Exception as e:
    console.print(f"[red]Unexpected error:[/red] {e}")
    if output_format == 'yaml':
        yaml.dump({'error': str(e)}, sys.stdout)
    sys.exit(1)
```

## Script Categories

### 1. Linear Integration Scripts
- `cache-linear-issue.py`: Fetch and cache Linear issues
- Uses `httpx` for API calls
- Caches data in YAML format

### 2. Agent Management Scripts
- `spawn-agents.py`: Create parallel agent worktrees
- `monitor-agents.py`: Track agent progress
- `agent-commit.py`: Commit and integrate agent work

### 3. Workflow Scripts
- `validate-parallel-work.py`: Validate agent deliverables
- `integrate-parallel-work.py`: Merge agent branches
- `resolve-conflicts.py`: Interactive conflict resolution

### 4. Publishing Scripts
- `prepublish.py`: Pre-publication validation
- `postpublish.py`: Post-publication verification
- `security-check.py`: Security and secrets scanning

### 5. Development Tools
- `test-locally.py`: Local testing automation
- `deploy.py`: Deployment automation
- `intelligent-agent-generator.py`: AI-powered agent creation

## Execution Methods

### Direct Execution
```bash
# Make executable once
chmod +x scripts/python/script-name.py

# Run directly
./scripts/python/script-name.py --help
```

### Via UV Explicitly
```bash
uv run scripts/python/script-name.py --help
```

### Through CDEV CLI
```bash
# Scripts integrated into cdev commands
cdev status  # Uses monitor-agents.py
cdev commit  # Uses agent-commit.py
```

## Dependency Management

### Adding Dependencies

1. Edit the script's metadata block:
```python
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pyyaml>=6.0",
#   "click>=8.1",
#   "rich>=13.0",
#   "new-package>=1.0"  # Add here
# ]
# ///
```

2. Import and use in the script:
```python
import new_package
```

### Dependency Guidelines

- **Minimize dependencies**: Only add what's essential
- **Pin major versions**: Use `>=` for flexibility with patches
- **Common dependencies**:
  - `pyyaml` or `ruamel.yaml`: YAML processing
  - `click`: CLI framework
  - `rich`: Terminal formatting
  - `httpx`: Async HTTP requests
  - `GitPython`: Git operations

## Best Practices

### 1. Consistent Structure
Follow the established pattern for all scripts:
- Shebang and metadata at the top
- Docstring explaining purpose
- Click CLI interface
- YAML output option
- Rich console for user feedback

### 2. Error Messages
Provide clear, actionable error messages:
```python
if not workspace_path.exists():
    console.print(
        f"[red]Error:[/red] Workspace not found: {workspace_path}\n"
        f"[yellow]Hint:[/yellow] Run 'cdev run' first to create agent workspaces"
    )
    sys.exit(1)
```

### 3. Exit Codes
Use consistent exit codes:
- `0`: Success
- `1`: General error
- `2`: Command-line usage error
- `3`: Validation failure

### 4. Testing
Include a `--dry-run` option for testing:
```python
@click.option('--dry-run', is_flag=True, help='Show what would be done')
def main(dry_run: bool):
    if dry_run:
        console.print("[yellow]DRY RUN:[/yellow] Would perform action")
        return
```

## Converting Existing Scripts

When converting shell or JavaScript to Python:

1. **Preserve functionality**: Maintain exact behavior
2. **Enhance output**: Add Rich formatting and YAML output
3. **Improve errors**: Add comprehensive error handling
4. **Add types**: Use type hints for clarity
5. **Document well**: Include docstrings and comments

Example conversion checklist:
- [ ] UV shebang and metadata block
- [ ] Click CLI with same arguments
- [ ] YAML output format option
- [ ] Rich console output
- [ ] Error handling with exit codes
- [ ] Type hints throughout
- [ ] Comprehensive docstrings
- [ ] Make executable (chmod +x)

## Troubleshooting

### Script Won't Run
```bash
# Check if executable
ls -la scripts/python/script-name.py

# Make executable
chmod +x scripts/python/script-name.py

# Check UV is installed
uv --version
```

### Dependency Errors
```bash
# Clear UV cache and retry
uv cache clean
./scripts/python/script-name.py
```

### Import Errors
Ensure dependencies are listed in the metadata block and spelled correctly.

## Next Steps

- Review [Script Usage Examples](script-usage-examples.md) for practical examples
- See [Migration Guide](migration-guide.md) for converting scripts
- Check [YAML Output Formats](yaml-output-formats.md) for output conventions