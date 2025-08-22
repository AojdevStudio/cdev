# NPX vs CLI Installation Investigation Report (Updated)

## Executive Summary

The `npx @aojdevstudio/cdev@latest install` command works while `cdev install` fails after global installation. Investigation reveals **the required directories ARE included in the package**, suggesting the issue is likely with path resolution or permissions when installed globally.

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

### 2. Directory Structure Analysis

**Package Contents Verification**: Analyzed npm package tarball and confirmed:

**Actually in Package (VERIFIED)**:

```bash
package/.claude/hooks/           # ✅ All hook scripts included
package/.claude/commands/        # ✅ All command definitions included
package/.claude/agents/          # ✅ All agent configurations included
package/.claude/scripts/         # ✅ Workflow scripts included
package/ai-docs/                 # ✅ Documentation templates included
```

**Not in Package**:

- No `workflows/paralell-development-claude/` directory (referenced by old installer in install-steps.js but not used by InteractiveInstaller)

### 3. Path Resolution Analysis

**Critical Code** in `interactive-installer.js`:

```javascript
constructor() {
  this.packageRoot = path.join(__dirname, '..');
}
```

**Path Resolution Scenarios**:

#### When using NPX:

- NPX extracts package to temporary location with proper permissions
- All files are accessible in the temporary extraction
- No permission issues with reading package files

#### When installed globally:

- Package installed to system npm directory
- Possible permission issues reading from global node_modules
- Path resolution should work the same way

### 4. The Real Problem

Since the directories ARE in the package, the issue must be one of:

1. **File System Permissions**: Global npm installations may have restricted read permissions
2. **NPM Package Cache**: NPX might be using a different/newer version from cache
3. **Package Installation Issues**: The global installation might be corrupted or incomplete
4. **Version Mismatch**: NPX using @latest while global might have older version

## Debugging Steps to Try

1. **Check global installation**:

   ```bash
   ls -la $(npm root -g)/@aojdevstudio/cdev/.claude/
   ```

2. **Compare versions**:

   ```bash
   npm list -g @aojdevstudio/cdev
   npx @aojdevstudio/cdev@latest --version
   ```

3. **Check permissions**:

   ```bash
   ls -la $(npm root -g)/@aojdevstudio/cdev/.claude/hooks/
   ```

4. **Force reinstall globally**:
   ```bash
   npm uninstall -g @aojdevstudio/cdev
   npm install -g @aojdevstudio/cdev@latest
   ```

## Recommendations

### Immediate Actions

1. Verify the global installation has all required files
2. Check file permissions in the global npm directory
3. Compare the exact versions being used by NPX vs global

### Potential Fixes

1. **Add error logging**: Enhanced error messages showing exact paths being checked
2. **Fallback mechanism**: If packageRoot files not found, check alternative locations
3. **Version check**: Ensure minimum version requirements are met
4. **Permission handling**: Better error messages for permission-denied scenarios

## Conclusion

The investigation shows that the package structure is correct and all required files are included. The issue appears to be related to how the globally installed package is accessed, potentially due to permissions, caching, or version differences between NPX and global installations.
