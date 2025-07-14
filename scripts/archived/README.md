# Archived Scripts

This directory contains legacy shell and JavaScript scripts that have been deprecated in favor of their Python equivalents.

## Directory Structure

```
archived/
├── shell/      # Legacy shell scripts (.sh)
├── js/         # Legacy JavaScript scripts (.js, .cjs)
└── README.md   # This file
```

## Why These Scripts Were Archived

As part of our modernization effort, all scripts have been rewritten in Python to provide:

- **Better cross-platform compatibility**: Python runs consistently across Windows, macOS, and Linux
- **Improved error handling**: Python provides more robust exception handling
- **Enhanced maintainability**: Single language reduces cognitive overhead
- **Better dependency management**: Python's pip provides reliable package management
- **Type safety**: Optional type hints improve code quality
- **Better testing**: Python's unittest and pytest provide comprehensive testing capabilities

## Migration Timeline

- **Phase 1 (Current)**: Scripts archived, wrapper scripts provide backward compatibility
- **Phase 2 (3 months)**: Deprecation warnings added to wrapper scripts
- **Phase 3 (6 months)**: Final removal of wrapper scripts

## Finding Replacement Scripts

All Python replacements are located in `scripts/python/`. The naming convention remains the same:

| Old Script               | New Script                      |
| ------------------------ | ------------------------------- |
| `scripts/script-name.sh` | `scripts/python/script-name.py` |
| `scripts/script-name.js` | `scripts/python/script-name.py` |

## Using Wrapper Scripts

During the transition period, wrapper scripts in `scripts/wrappers/` maintain backward compatibility. These wrappers:

1. Display a deprecation notice
2. Call the corresponding Python script with the same arguments
3. Return the same exit codes

Example:

```bash
# Old way (still works via wrapper)
./scripts/deploy.sh

# New way (recommended)
python scripts/python/deploy.py
```

## Need Help?

If you encounter any issues during migration:

1. Check the migration announcement in `docs/migration-announcement.md`
2. Review the removal timeline in `docs/removal-timeline.md`
3. Consult the Python script's `--help` output
4. Open an issue if you need assistance

## Archive Date

Scripts archived on: **July 12, 2025**
