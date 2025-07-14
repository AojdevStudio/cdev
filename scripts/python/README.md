# Python UV Scripts

This directory contains Python scripts that have been converted from JavaScript, using UV (Astral's package manager) for dependency management and execution.

## Overview

All scripts use UV's inline dependency specification (PEP 723) format, making them self-contained and executable without prior package installation.

## Scripts

### security-check.py

Security validation script for package publication.

```bash
./scripts/python/security-check.py
# Or with YAML output
./scripts/python/security-check.py --output-format yaml
```

Features:

- Verifies environment files are properly excluded in .gitignore (does NOT delete them)
- Validates sensitive files won't be published
- Scans for hardcoded secrets in source code
- Verifies package.json security settings
- Checks .npmignore and .gitignore patterns

**Important**: This script only performs checks and validations. It does NOT modify or delete any files.

### prepublish.py

Pre-publication validation script.

```bash
./scripts/python/prepublish.py
# Allow uncommitted changes
ALLOW_DIRTY=1 ./scripts/python/prepublish.py
```

Features:

- Validates package.json structure
- Verifies required files are present
- Checks script executability
- Validates build status
- Generates distribution manifest

### postpublish.py

Post-publication operations script.

```bash
./scripts/python/postpublish.py
# Skip NPM verification (for testing)
./scripts/python/postpublish.py --skip-verification
```

Features:

- Verifies package on NPM registry
- Tests global NPX installation
- Updates distribution manifest
- Generates usage documentation
- Cleans up temporary files

### intelligent-agent-generator.py

Intelligent agent generation for parallel development.

```bash
# Interactive mode
./scripts/python/intelligent-agent-generator.py

# With requirement
./scripts/python/intelligent-agent-generator.py "Implement user authentication"

# With codebase structure
./scripts/python/intelligent-agent-generator.py \
  --codebase-file codebase.yaml \
  --test-file tests.yaml \
  "Add file upload feature"
```

Features:

- Semantic requirement parsing
- Dynamic work domain discovery
- Intelligent agent specification generation
- Complexity estimation
- Technology detection

## UV Script Format

All scripts follow the UV inline script format:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0"]
# ///
```

This format allows:

- Self-contained scripts with dependencies
- No virtual environment setup required
- Automatic dependency installation on first run
- Cross-platform compatibility

## Dependencies

Common dependencies across scripts:

- `pyyaml`: YAML parsing and generation
- `click`: Command-line interface framework
- `rich`: Terminal formatting and colors
- `httpx`: Async HTTP client (postpublish only)

## Output Formats

All scripts support two output formats:

1. **Console** (default): Human-readable output with colors
2. **YAML**: Machine-readable output for automation

## Environment Variables

- `FORCE_PUBLISH`: Override version 1.0.0 warning (prepublish)
- `ALLOW_DIRTY`: Allow uncommitted changes (prepublish)

## Migration from JavaScript

These scripts have been migrated from their JavaScript counterparts to:

- Improve cross-platform compatibility
- Leverage UV's modern package management
- Maintain consistent output format (YAML)
- Enable easier testing and automation

## Running Scripts

All scripts are executable and can be run directly:

```bash
# Direct execution
./scripts/python/script-name.py

# Or with UV explicitly
uv run scripts/python/script-name.py
```

## Testing

Test any script by running with `--help`:

```bash
./scripts/python/security-check.py --help
```

This will show available options and verify the script loads correctly.
