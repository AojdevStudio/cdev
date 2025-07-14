# Script Wrappers for Backward Compatibility

This directory contains wrapper scripts that maintain backward compatibility during the migration from shell/JavaScript to Python scripts.

## Purpose

These wrappers ensure that existing workflows continue to function while users migrate to the new Python scripts. Each wrapper:

1. Displays a deprecation notice
2. Forwards all arguments to the Python equivalent
3. Preserves exit codes and output format
4. Logs usage for migration tracking (optional)

## Wrapper Structure

### Shell Script Wrapper Example

```bash
#!/bin/bash
# Wrapper for deploy.sh -> deploy.py

SCRIPT_NAME=$(basename "$0")
PYTHON_SCRIPT="scripts/python/${SCRIPT_NAME%.sh}.py"

# Display deprecation notice
echo "⚠️  DEPRECATION WARNING: $SCRIPT_NAME is deprecated." >&2
echo "   Please use: python $PYTHON_SCRIPT" >&2
echo "   This wrapper will be removed in January 2026." >&2
echo "" >&2

# Forward to Python script
exec python "$PYTHON_SCRIPT" "$@"
```

### JavaScript Wrapper Example

```javascript
#!/usr/bin/env node
// Wrapper for intelligent-agent-generator.js -> intelligent-agent-generator.py

const { spawn } = require('child_process');
const path = require('path');

const scriptName = path.basename(__filename);
const pythonScript = path.join('scripts', 'python', scriptName.replace(/\.(js|cjs)$/, '.py'));

// Display deprecation notice
console.error(`⚠️  DEPRECATION WARNING: ${scriptName} is deprecated.`);
console.error(`   Please use: python ${pythonScript}`);
console.error(`   This wrapper will be removed in January 2026.`);
console.error('');

// Forward to Python script
const python = spawn('python', [pythonScript, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

python.on('exit', (code) => {
  process.exit(code || 0);
});
```

## Available Wrappers

| Wrapper                        | Forwards To                                   | Type    |
| ------------------------------ | --------------------------------------------- | ------- |
| deploy.sh                      | scripts/python/deploy.py                      | Shell   |
| agent-commit-enhanced.sh       | scripts/python/agent-commit.py                | Shell   |
| cache-linear-issue.sh          | scripts/python/cache-linear-issue.py          | Shell   |
| integrate-parallel-work.sh     | scripts/python/integrate-parallel-work.py     | Shell   |
| monitor-agents.sh              | scripts/python/monitor-agents.py              | Shell   |
| resolve-conflicts.sh           | scripts/python/resolve-conflicts.py           | Shell   |
| spawn-agents.sh                | scripts/python/spawn-agents.py                | Shell   |
| test-locally.sh                | scripts/python/test-locally.py                | Shell   |
| validate-parallel-work.sh      | scripts/python/validate-parallel-work.py      | Shell   |
| decompose-parallel.cjs         | scripts/python/decompose-parallel.py          | Node.js |
| intelligent-agent-generator.js | scripts/python/intelligent-agent-generator.py | Node.js |
| postpublish.js                 | scripts/python/postpublish.py                 | Node.js |
| prepublish.js                  | scripts/python/prepublish.py                  | Node.js |
| security-check.js              | scripts/python/security-check.py              | Node.js |

## Environment Variables

The wrappers preserve all environment variables, ensuring compatibility with existing configurations:

- `NODE_ENV` → `PYTHON_ENV` (if applicable)
- All other environment variables are passed through unchanged

## Migration Tracking

Wrappers can optionally log usage to help track migration progress:

```bash
# Enable migration tracking
export TRACK_WRAPPER_USAGE=1

# Usage will be logged to .migration-metrics/wrapper-usage.log
```

## Testing Wrappers

To test that a wrapper correctly forwards to the Python script:

```bash
# Test with help flag
./scripts/wrappers/deploy.sh --help

# Test with actual arguments
./scripts/wrappers/deploy.sh --environment staging --dry-run

# Compare output with direct Python call
python scripts/python/deploy.py --environment staging --dry-run
```

## Creating New Wrappers

If you need to create additional wrappers:

1. Copy the appropriate template from this README
2. Update the script name references
3. Ensure the Python script path is correct
4. Make the wrapper executable: `chmod +x wrapper-name.sh`
5. Test thoroughly with various arguments

## Removal Plan

These wrappers will be removed according to the deprecation timeline:

- **October 2025**: Add more prominent deprecation warnings
- **December 2025**: Final reminder notices
- **January 2026**: Complete removal

Please migrate to the Python scripts before the removal date to avoid disruption.

## Questions?

If you have questions about the wrappers or migration process:

1. Check the deprecation notice: `scripts/archived/DEPRECATION_NOTICE.md`
2. Review the migration announcement: `docs/migration-announcement.md`
3. Open an issue for specific concerns
