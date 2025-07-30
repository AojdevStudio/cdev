# Package.json Guide for @aojdevstudio/cdev

This document explains every section of the `package.json` file.

## Package Identity

```json
{
  "name": "@aojdevstudio/cdev",
  "version": "0.0.20",
  "description": "Claude Development - Parallel workflow system with intelligent hooks, Linear integration, and automated agent management"
}
```

- **name**: NPM package name with organization scope
- **version**: Current version following semantic versioning
- **description**: What the package does

## Entry Points

```json
{
  "main": "bin/cli.js",
  "bin": {
    "cdev": "bin/cli.js"
  }
}
```

- **main**: What gets loaded when someone does `require('@aojdevstudio/cdev')`
- **bin**: Creates `cdev` command when installed globally

## Development Scripts

### Testing Scripts

- `test`: Run all tests (unit + integration)
- `test:unit`: Test individual components
- `test:integration`: Test component interactions
- `test:dom`: Test DOM-related code
- `test:all`: Every test possible
- `test:watch`: Continuous testing during development
- `test:ci`: What CI/CD runs
- `test:coverage`: Generate coverage reports

### Code Quality Scripts

- `lint`: Check JavaScript code style
- `lint:fix`: Auto-fix JavaScript issues
- `format`: Auto-format all files
- `format:check`: Check if files need formatting
- `lint:prettier`: Same as format:check (duplicate?)
- `quality`: Check all code quality
- `quality:fix`: Fix all code quality issues

### Python Code Quality

- `lint:python`: Check Python code style
- `lint:python:fix`: Auto-fix Python issues
- `format:python`: Auto-format Python files
- `format:python:check`: Check Python formatting
- `quality:python`: Check Python quality
- `quality:python:fix`: Fix Python quality

### Build & Deployment

- `build`: Prepare for publishing
- `prepublishOnly`: Runs automatically before 'npm publish'
- `prepare`: Runs after 'npm install' (setup)
- `postpublish`: Runs after successful publish

### Security Checks

- `security:check`: Custom security validation
- `security:audit`: NPM's built-in security check

### TypeScript Support

- `typecheck`: Check TypeScript types without building

### Changelog Management

- `changelog:update`: Interactive changelog update
- `changelog:auto`: Auto-generate changelog
- `changelog:manual`: Manual changelog editing
- `changelog:preview`: Preview changes
- `changelog:force`: Force changelog update

## Package Distribution (files array)

What gets included when published to NPM:

- `bin/`: CLI executable
- `src/**/*.js`: All JavaScript source files
- `!src/**/*.test.js`: EXCLUDE test files
- `!src/**/*.spec.js`: EXCLUDE spec files
- `scripts/python/`: Python workflow scripts
- `scripts/wrappers/`: Shell wrapper scripts
- `scripts/changelog/`: Changelog management scripts
- `.claude/`: Claude configuration directory
- `ai-docs/`: AI documentation
- `README.md`, `LICENSE`, `CHANGELOG.md`: Documentation
- `.env.example`: Environment template

## Runtime Dependencies

Required for the package to work:

- `chalk`: Colored terminal output
- `commander`: CLI argument parsing
- `dotenv`: Environment variable loading
- `fs-extra`: Enhanced file system operations
- `inquirer`: Interactive command line prompts
- `ora`: Terminal spinners
- `semver`: Semantic version parsing
- `which`: Find executables in PATH

## Development Dependencies

Only needed for building/testing:

- **Babel**: JavaScript transpilation
- **Testing**: Jest framework and utilities
- **Code Quality**: ESLint, Prettier
- **TypeScript**: Compiler and Jest support

## Package Behavior

- `preferGlobal: true`: Suggest global installation (for CLI tools)
- `publishConfig.access: "public"`: Make package publicly available on NPM

## Issues Found

1. **Missing `templates/` in files array** - Your installer needs this
2. **`lint:prettier` is duplicate** of `format:check`
3. **No Claude workflow scripts** like `claude:spawn`, `claude:deploy`
