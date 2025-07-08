# Astral UV Scripting Documentation

This document provides comprehensive information about scripting with Astral UV (uv), focusing on script execution, dependency management, and automation workflows.

## Overview

Astral UV is a fast Python package manager and project manager that excels at script execution and dependency management. It provides powerful scripting capabilities that enable developers to run Python scripts with automatic dependency resolution, inline metadata, and various execution modes.

## Script Execution Fundamentals

### Basic Script Execution

The most basic way to run a Python script with uv:

```bash
$ uv run example.py
Hello world
```

### Running Scripts from Standard Input

Execute Python scripts directly from stdin:

```bash
$ echo 'print("hello world!")' | uv run -
hello world!
```

### Multi-line Scripts with Here-documents

Execute complex multi-line scripts using shell here-documents:

```bash
uv run - <<EOF
print("hello world!")
EOF
```

### Script Arguments

Pass arguments to your scripts:

```python
# example.py
import sys
print(" ".join(sys.argv[1:]))
```

```bash
$ uv run example.py test
test

$ uv run example.py hello world!
hello world!
```

## Inline Script Metadata (PEP 723)

### Basic Inline Metadata

Define dependencies directly in your script using inline metadata:

```python
# /// script
# dependencies = [
#   "requests<3",
#   "rich",
# ]
# ///

import requests
from rich.pretty import pprint

resp = requests.get("https://peps.python.org/api/peps.json")
data = resp.json()
pprint([(k, v["title"]) for k, v in data.items()][:10])
```

### Python Version Requirements

Specify Python version constraints in your script:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

# Use some syntax added in Python 3.12
type Point = tuple[float, float]
print(Point)
```

### Advanced Metadata with uv Configuration

Include uv-specific configuration in your script metadata:

```python
# /// script
# dependencies = [
#   "requests",
# ]
# [tool.uv]
# exclude-newer = "2023-10-16T00:00:00Z"
# ///

import requests
print(requests.__version__)
```

## Dependency Management for Scripts

### Adding Dependencies to Scripts

Use `uv add --script` to add dependencies to existing scripts:

```bash
$ uv add --script example.py 'requests<3' 'rich'
```

### Alternative Package Indexes

Add dependencies from alternative package indexes:

```bash
$ uv add --index "https://example.com/simple" --script example.py 'requests<3' 'rich'
```

### Temporary Dependencies with --with

Run scripts with temporary dependencies:

```bash
$ uv run --with rich example.py
```

With version constraints:

```bash
$ uv run --with 'rich>12,<13' example.py
```

### Skipping Project Dependencies

Run scripts without project dependencies:

```bash
$ uv run --no-project example.py
```

## Executable Scripts with Shebangs

### Basic Shebang Script

Create executable scripts with uv shebang:

```bash
#!/usr/bin/env -S uv run --script

print("Hello, world!")
```

Make executable and run:

```bash
$ chmod +x greet
$ ./greet
Hello, world!
```

### Shebang with Inline Dependencies

Combine shebang with inline metadata:

```bash
#!/usr/bin/env -S uv run --script
#
# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx"]
# ///

import httpx
print(httpx.get("https://example.com"))
```

## Script Initialization and Templates

### Initialize New Scripts

Create new scripts with inline metadata:

```bash
$ uv init --script example.py --python 3.12
```

### Script Templates

The generated template includes:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

# Your script content here
```

## Python Version Management for Scripts

### Specific Python Version

Run scripts with specific Python versions:

```bash
$ uv run --python 3.10 example.py
3.10.15
```

### Default Python Version

Scripts run with the default Python version:

```bash
$ uv run example.py
3.12.6
```

### Version Detection Script

Check which Python version is being used:

```python
# version_check.py
import sys
print(".".join(map(str, sys.version_info[:3])))
```

## Script Locking and Reproducibility

### Lock Script Dependencies

Create lock files for scripts:

```bash
$ uv lock --script example.py
```

This creates a `.lock` file adjacent to your script for reproducible dependency resolution.

### Reproducibility with exclude-newer

Use timestamp-based exclusion for reproducibility:

```python
# /// script
# dependencies = [
#   "requests",
# ]
# [tool.uv]
# exclude-newer = "2023-10-16T00:00:00Z"
# ///
```

## GUI Scripts and Platform-Specific Features

### Tkinter GUI Scripts

Windows GUI scripts with `.pyw` extension:

```python
# example.pyw
from tkinter import Tk, ttk

root = Tk()
root.title("uv")
frm = ttk.Frame(root, padding=10)
frm.grid()
ttk.Label(frm, text="Hello World").grid(column=0, row=0)
root.mainloop()
```

```powershell
PS> uv run example.pyw
```

### PyQt5 GUI Scripts

Running PyQt5 applications:

```python
# example_pyqt.pyw
import sys
from PyQt5.QtWidgets import QApplication, QWidget, QLabel, QGridLayout

app = QApplication(sys.argv)
widget = QWidget()
grid = QGridLayout()

text_label = QLabel()
text_label.setText("Hello World!")
grid.addWidget(text_label)

widget.setLayout(grid)
widget.setGeometry(100, 100, 200, 50)
widget.setWindowTitle("uv")
widget.show()
sys.exit(app.exec_())
```

```powershell
PS> uv run --with PyQt5 example_pyqt.pyw
```

## Environment Variables and Configuration

### Environment Variables for Scripts

Load environment variables from `.env` files:

```bash
$ echo "MY_VAR='Hello, world!'" > .env
$ uv run --env-file .env -- python -c 'import os; print(os.getenv("MY_VAR"))'
Hello, world!
```

### UV Environment Variables

Key environment variables for scripting:

- `UV_ENV_FILE`: Specify `.env` files for `uv run`
- `UV_CUSTOM_COMPILE_COMMAND`: Override compile command in output headers

## Integration with Development Tools

### Marimo Notebooks

Run Marimo notebooks as scripts:

```bash
$ uv run my_notebook.py
```

Edit notebooks with inline metadata:

```bash
$ uvx marimo edit --sandbox my_notebook.py
```

Add dependencies to notebooks:

```bash
$ uv add --script my_notebook.py numpy
```

### Dependency Bots Integration

Configure Renovate for inline script dependencies:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "pep723": {
    "fileMatch": [
      "scripts/generate_docs\\.py",
      "scripts/run_server\\.py",
    ],
  },
}
```

## Tool Execution with uvx

### Temporary Tool Execution

Run tools without permanent installation:

```bash
$ uvx ruff
$ uvx pycowsay hello from uv
```

### Tool Versioning

Specify tool versions:

```bash
$ uvx ruff@0.3.0 check
$ uvx ruff@latest check
$ uvx --from 'ruff==0.3.0' ruff check
```

### Tools with Dependencies

Include additional dependencies:

```bash
$ uvx --with mkdocs-material mkdocs --help
$ uvx --with 'mypy[faster-cache,reports]' mypy --xml-report mypy_report
```

### Alternative Sources

Run tools from Git repositories:

```bash
$ uvx --from git+https://github.com/httpie/cli httpie
$ uvx --from git+https://github.com/httpie/cli@master httpie
```

## Script Error Handling and Debugging

### Module Not Found Errors

Without proper dependency management:

```bash
$ uv run --no-project example.py
Traceback (most recent call last):
  File "/Users/astral/example.py", line 2, in <module>
    from rich.progress import track
ModuleNotFoundError: No module named 'rich'
```

### Resolution with Dependencies

With proper dependency specification:

```bash
$ uv run --with rich example.py
# Script runs successfully
```

## Advanced Scripting Patterns

### Complex Script Example

A comprehensive script example:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "httpx",
#   "rich",
# ]
# [tool.uv]
# exclude-newer = "2023-10-16T00:00:00Z"
# ///

import httpx
import time
from rich.progress import track
from rich.pretty import pprint

def fetch_peps():
    """Fetch and display Python Enhancement Proposals"""
    resp = httpx.get("https://peps.python.org/api/peps.json")
    data = resp.json()
    return [(k, v["title"]) for k, v in data.items()][:10]

def main():
    print("Fetching PEPs...")
    
    # Simulate progress
    for i in track(range(20), description="Loading:"):
        time.sleep(0.05)
    
    peps = fetch_peps()
    pprint(peps)

if __name__ == "__main__":
    main()
```

### Script with Standard Library Only

Scripts using only standard library modules:

```python
# stdlib_script.py
import os
import sys
from pathlib import Path

print(f"Python version: {sys.version}")
print(f"Home directory: {os.path.expanduser('~')}")
print(f"Current directory: {Path.cwd()}")
```

```bash
$ uv run stdlib_script.py
```

## Project Integration

### Scripts in uv Projects

Running scripts within uv projects:

```bash
$ uv run example.py  # Uses project environment
$ uv run python -c "import example"  # Import project modules
```

### Project vs Standalone Scripts

Scripts with inline metadata run in isolated environments:

```python
# /// script
# dependencies = [
#   "httpx",
# ]
# ///

import httpx
resp = httpx.get("https://peps.python.org/api/peps.json")
data = resp.json()
print([(k, v["title"]) for k, v in data.items()][:10])
```

### Environment Management

Manual environment activation:

```bash
$ uv sync
$ source .venv/bin/activate  # Unix
$ .venv\Scripts\activate     # Windows
```

## Installation and Setup

### Installing uv

Install uv using the official installer:

```bash
# Unix/Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows PowerShell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Docker Integration

Install uv in Docker:

```dockerfile
FROM python:3.12-slim-bookworm

# Install uv
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh
ENV PATH="/root/.local/bin/:$PATH"

# Run scripts with uv
RUN uv run some_script.py
```

### GitHub Actions Integration

Set up uv in GitHub Actions:

```yaml
name: Example
jobs:
  uv-example:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install uv
        uses: astral-sh/setup-uv@v5
      - name: Set up Python
        run: uv python install
```

## Cache Management

### Post-job Cache Cleanup

Clean uv cache in CI/CD:

```bash
#!/usr/bin/env sh
uv cache clean
```

### Cache Commands

```bash
$ uv cache clean    # Clean all cache
$ uv cache prune    # Remove unused cache entries
$ uv cache dir      # Show cache directory
```

## Best Practices

### Script Organization

1. **Use inline metadata** for standalone scripts
2. **Version pin critical dependencies** for reproducibility
3. **Include Python version requirements** when using newer syntax
4. **Use descriptive dependency constraints** (e.g., `requests<3`)

### Development Workflow

1. **Start with basic script**: Begin with simple functionality
2. **Add dependencies as needed**: Use `uv add --script` for new deps
3. **Test with different Python versions**: Use `--python` flag
4. **Lock dependencies**: Use `uv lock --script` for production

### Performance Optimization

1. **Use `--no-project`** for standalone scripts
2. **Leverage uv's caching** for repeated executions
3. **Pin dependency versions** for consistent builds
4. **Use `exclude-newer`** for reproducible environments

## Common Patterns and Examples

### Data Processing Script

```python
# /// script
# dependencies = [
#   "pandas",
#   "numpy",
# ]
# ///

import pandas as pd
import numpy as np

# Process data
data = pd.DataFrame({'x': np.random.randn(100)})
print(data.describe())
```

### Web Scraping Script

```python
# /// script
# dependencies = [
#   "httpx",
#   "beautifulsoup4",
# ]
# ///

import httpx
from bs4 import BeautifulSoup

resp = httpx.get("https://example.com")
soup = BeautifulSoup(resp.text, 'html.parser')
print(soup.title.text)
```

### CLI Tool Script

```python
# /// script
# dependencies = [
#   "click",
#   "rich",
# ]
# ///

import click
from rich.console import Console

console = Console()

@click.command()
@click.argument('name')
def greet(name):
    console.print(f"Hello, [bold blue]{name}[/bold blue]!")

if __name__ == '__main__':
    greet()
```

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError**: Add missing dependencies with `--with` or inline metadata
2. **Python version conflicts**: Specify compatible Python version
3. **Permission errors**: Use `chmod +x` for executable scripts
4. **Path issues**: Ensure scripts are in correct directory

### Debug Commands

```bash
$ uv run --help           # Show run command help
$ uv python list          # List available Python versions
$ uv tool list            # List installed tools
$ uv cache dir            # Show cache location
```

## Conclusion

Astral UV provides powerful scripting capabilities that combine the simplicity of Python scripts with robust dependency management. Its support for inline metadata, shebang execution, and tool integration makes it an excellent choice for both simple automation scripts and complex development workflows.

Key advantages include:
- **Automatic dependency resolution** with inline metadata
- **Fast execution** with efficient caching
- **Python version management** with automatic installation
- **Seamless integration** with development tools and CI/CD
- **Reproducible environments** with locking and constraints

Whether you're writing simple automation scripts or complex data processing pipelines, uv's scripting capabilities provide the tools you need for efficient Python development.

---

*This documentation is based on Astral UV's official documentation and provides comprehensive guidance for scripting with uv. For the most current information, refer to https://docs.astral.sh/uv/*