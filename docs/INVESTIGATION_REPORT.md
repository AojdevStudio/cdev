# NPX vs CLI Installation Investigation Report

## Executive Summary

The `npx @aojdevstudio/cdev@latest install` command works while `cdev install` fails after global installation due to **path resolution differences** and **missing directories in the published package**.

## Key Findings

### 1. NPX Command Implementation

**Entry Point**: `package.json` defines the bin entry:

```json
"bin": {
  "cdev": "bin/cli.js"
}
```

**Execution Flow**:

1. `bin/cli.js` → `src/cli-commands.js` → `InteractiveInstaller`
2. Both NPX and regular CLI use the same `InteractiveInstaller` class
3. No special handling for NPX execution exists

### 2. Missing Directories Problem

**Root Cause**: The package is missing critical directories that the installer expects:

**Expected by InteractiveInstaller**:

- `.claude/hooks/` - Hook scripts
- `.claude/commands/` - Command definitions
- `.claude/agents/` - Agent configurations
- `.claude/scripts/` - Workflow scripts
- `ai-docs/` - Documentation templates

**Actually in Package**:

- `.claude/` directory exists but is **empty**
- `ai-docs/` exists with templates
- No `workflows/paralell-development-claude/` directory (referenced by old installer)

### 3. Path Resolution Analysis

**Critical Code** in `interactive-installer.js`:

```javascript
constructor() {
  this.packageRoot = path.join(__dirname, '..');
}
```

**Path Resolution Differences**:

#### When using NPX:

- NPX extracts package to temporary location: `/tmp/npx-XXXXX/`
- `__dirname` = `/tmp/npx-XXXXX/src/`
- `packageRoot` = `/tmp/npx-XXXXX/`
- NPX might be using cached/different version that has the directories

#### When installed globally:

- Package installed to: `/Users/ossieirondi/.npm-global/lib/node_modules/@aojdevstudio/cdev/`
- `__dirname` = `/Users/ossieirondi/.npm-global/lib/node_modules/@aojdevstudio/cdev/src/`
- `packageRoot` = `/Users/ossieirondi/.npm-global/lib/node_modules/@aojdevstudio/cdev/`
- Missing directories cause installation to fail

### 4. Validation Failures

The `validatePackageStructure()` method checks for:

```javascript
const requiredPaths = ['.claude/hooks', '.claude/commands', '.claude/agents'];
```

These directories don't exist in the current package, causing:

```
Error: Package structure invalid: missing .claude/hooks
```

## Root Causes

1. **Incomplete Package Publishing**: The `.claude/` directory structure with hooks, commands, and agents is not being included in the published package.

2. **package.json files array**: While it includes `.claude/`, the directory is empty:

   ```json
   "files": [
     "bin/",
     "src/",
     "scripts/python/",
     "scripts/wrappers/",
     "scripts/changelog/",
     ".claude/",  // This directory is empty!
     "ai-docs/",
     // ...
   ]
   ```

3. **NPX Success Mystery**: NPX might be:
   - Using a cached version that had these directories
   - Failing silently on validation but appearing to work
   - Using a different resolution path that bypasses validation

## Recommendations

### Immediate Fix

1. Populate the `.claude/` directory with required subdirectories and files
2. Ensure all hook scripts, commands, and agent configurations are included
3. Update the package publishing process to include these files

### Alternative Solutions

1. **Remove validation**: Make the installer work without pre-existing directories
2. **Create directories dynamically**: Generate missing structures during installation
3. **Embed templates**: Include templates as JavaScript strings rather than files

### Investigation Next Steps

1. Check what's in the published NPM package: `npm pack @aojdevstudio/cdev`
2. Verify NPX cache: `npm cache ls @aojdevstudio/cdev`
3. Test with `--prefer-offline` flag to force cache usage

## Conclusion

The issue is not with NPX vs CLI execution paths, but with **missing files in the published package**. The `.claude/` directory and its contents need to be properly included in the package for the installer to work correctly.
