# Complex Scripts - Python Conversion

This directory contains Python conversions of complex JavaScript scripts that handle intelligent agent generation and parallel decomposition for the parallel development workflow.

## Scripts

### intelligent-agent-generator.py

Intelligent agent generation engine that:

- Analyzes requirements using semantic parsing
- Maps requirements to work domains using codebase analysis
- Generates agents dynamically based on the analysis

**Usage:**

```bash
# Generate agent for a requirement
./intelligent-agent-generator.py "Create authentication system with JWT tokens"

# Save output to file
./intelligent-agent-generator.py "Add user profile forms" -o agent.yaml
```

### decompose-parallel.py

Exclusive ownership decomposition engine that ensures NO file conflicts by:

- Analyzing all file operations first
- Grouping files by dependency clusters
- Creating exclusive agent domains
- Validating no overlaps before generating agents

**Usage:**

```bash
# Decompose a Linear issue
./decompose-parallel.py LINEAR-123

# Dry run mode (preview without saving)
./decompose-parallel.py LINEAR-123 --dry-run
```

## Key Features

1. **UV Package Manager**: All scripts use UV shebangs and PEP 723 inline metadata
2. **YAML Output**: Replaced JSON with YAML for better readability
3. **Click CLI**: Professional command-line interfaces with help text
4. **Rich Output**: Beautiful console output with tables and panels
5. **Type Safety**: Full type hints and dataclasses
6. **Async Support**: Async/await patterns for better performance

## Testing

Run the smoke test to verify everything works:

```bash
./test_complex_scripts.py
```

## Dependencies

All dependencies are specified inline using PEP 723 format:

- pyyaml>=6.0
- click>=8.1
- rich>=13.0

## Conversion Notes

These scripts were converted from JavaScript/CommonJS to Python with the following improvements:

- Class-based architecture preserved with Python dataclasses
- Pattern matching converted to Python regex
- Async patterns maintained with asyncio
- Error handling improved with Python exceptions
- Console output enhanced with Rich library
