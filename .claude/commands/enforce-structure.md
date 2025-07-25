# /enforce-structure - Root Directory Structure Enforcement

## Purpose

Validates and enforces clean root directory structure by checking for unauthorized files and automatically moving them to appropriate locations.

## Usage

```
/enforce-structure [--fix] [--dry-run] [--strict] [--report]
```

## Options

- `--fix` - Automatically move misplaced files to correct locations
- `--dry-run` - Preview what would be moved without making changes
- `--strict` - Enable stricter validation rules
- `--report` - Generate JSON report of violations

## Structure Rules

### Essential Framework Directories (Must Stay in Root)

- `ai-docs/` - Framework AI documentation and templates
- `src/` - Source code
- `test/` - Test files
- `bin/` - Binary/executable files
- `lib/` - Library files
- `.claude/` - Claude configuration
- `config/` - Configuration files
- `scripts/` - Utility scripts
- `docs/` - Project documentation

### Allowed .md Files in Root

- `README.md` - Main project documentation
- `CHANGELOG.md` - Version history
- `CLAUDE.md` - Project AI instructions
- `ROADMAP.md` - Project roadmap
- `SECURITY.md` - Security policy
- `LICENSE.md` - License information

### Forbidden Files in Root (Auto-moved)

- **Config Files** → `config/`
  - `jest.config*.js`, `babel.config.js`, `webpack.config*.js`
  - `tsconfig*.json`, `docker-compose.yml`, `Dockerfile`
- **Scripts** → `scripts/`
  - `*.sh` files, `build.js`, `deploy.js`
  - `publish.js` → `scripts/deployment/`

- **Documentation** → `docs/`
  - `USAGE.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `API.md`
  - `*-report.md`, `*-plan.md` files

- **Temporary/Debug Files** → `archive/`
  - `debug-*.js`, `test-*.js`, `temp-*` files

## Examples

### Check Structure (Read-only)

```bash
/enforce-structure
```

### Preview Changes

```bash
/enforce-structure --dry-run
```

### Fix Violations Automatically

```bash
/enforce-structure --fix
```

### Generate Report

```bash
/enforce-structure --report > structure-report.json
```

## Integration with Hooks

The enforcement system integrates with `pre_tool_use.py` hook to prevent violations:

1. **Automatic Prevention**: Hook blocks unauthorized file creation in real-time
2. **Clear Messages**: Provides helpful error messages explaining the rules
3. **Suggestions**: Recommends using `/enforce-structure --fix` for cleanup

## Command Implementation

Run via Node.js:

```bash
node src/commands/enforce-structure.js [options]
```

Or use the Claude command interface:

```
/enforce-structure [options]
```
