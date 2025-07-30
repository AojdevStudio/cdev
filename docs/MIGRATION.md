# CDEV Migration Guide: From Global to Project-Local Installation

## Overview

Starting with version 0.1.0, CDEV is transitioning from a global npm package to a project-local development dependency. This change aligns CDEV with modern JavaScript tooling best practices and provides better version control and team consistency.

## Why This Change?

1. **Version Consistency**: Each project can lock to a specific CDEV version
2. **Team Collaboration**: All team members use the same version automatically
3. **No Global Conflicts**: Multiple projects can use different CDEV versions
4. **Modern Standards**: Follows the same pattern as ESLint, Prettier, and other dev tools

## Migration Steps

### 1. Uninstall Global Package

If you have CDEV installed globally, first remove it:

```bash
npm uninstall -g @aojdevstudio/cdev
```

### 2. Install in Your Project

Navigate to your project directory and install CDEV as a dev dependency:

```bash
cd your-project
npm install --save-dev @aojdevstudio/cdev
```

### 3. Update Your Workflow

#### Before (Global Installation):

```bash
cdev install
cdev get PROJ-123
cdev split PROJ-123
```

#### After (Project-Local Installation):

```bash
npx cdev install
npx cdev get PROJ-123
npx cdev split PROJ-123
```

### 4. Remove Shell Aliases

If you created shell aliases for `cdev`, remove them from your shell configuration:

```bash
# Remove from ~/.bashrc, ~/.zshrc, or similar
# alias cdev="npx @aojdevstudio/cdev@latest install"
```

## Using NPX Without Installation

You can still use CDEV without installing it in your project:

```bash
# One-time use
npx @aojdevstudio/cdev@latest install

# Specific version
npx @aojdevstudio/cdev@0.1.0 install
```

## Adding to package.json Scripts

For convenience, add commonly used commands to your package.json:

```json
{
  "scripts": {
    "cdev:install": "cdev install",
    "cdev:get": "cdev get",
    "cdev:split": "cdev split",
    "cdev:run": "cdev run",
    "cdev:status": "cdev status"
  }
}
```

Then use:

```bash
npm run cdev:install
npm run cdev:get PROJ-123
```

## Troubleshooting

### "Command not found: cdev"

This is expected! Use `npx cdev` instead, or add to your package.json scripts.

### Version Mismatch

If you see version warnings, ensure you're using the project-local version:

```bash
# Check installed version
npm list @aojdevstudio/cdev

# Update to latest
npm update @aojdevstudio/cdev
```

### Permission Issues

No more global permission issues! Everything runs in your project directory.

## Benefits of Project-Local Installation

1. **CI/CD Integration**: Your build pipeline automatically has the right version
2. **Onboarding**: New team members get CDEV automatically with `npm install`
3. **Reproducible Builds**: Same CDEV version across all environments
4. **Security**: No global packages with system-wide access

## Questions?

- [GitHub Issues](https://github.com/AOJDevStudio/cdev/issues)
- [NPM Package](https://www.npmjs.com/package/@aojdevstudio/cdev)

---

Thank you for using CDEV! This change makes CDEV more reliable and easier to use in team environments.
