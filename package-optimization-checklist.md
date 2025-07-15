# Package Distribution Optimization Checklist

## 🎯 Goal: Reduce package size from ~2.3MB to ~500K (78% reduction)

### 📦 Update package.json Configuration

#### High Priority - Files Field Configuration

- [ ] Update `files` field in package.json to include directories:
  ```json
  "files": [
    "bin/",
    "src/",
    "scripts/python/",
    "scripts/wrappers/",
    ".claude/",
    "ai-docs/",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ]
  ```

#### Create/Update .npmignore Configuration

- [ ] Create or update `.npmignore` file with exclusion patterns:

  ```
  # Test files
  **/*.test.js
  **/*.spec.js
  scripts/python/test-*.py
  scripts/python/test_*.py

  # Deprecated/duplicate scripts
  scripts/*.js
  scripts/*.sh
  scripts/*.cjs
  scripts/archived/

  # Development docs
  docs/
  scripts/python/*.md
  scripts/python/*.yaml

  # Development files
  .eslintrc*
  .prettierrc*
  jest.config.js
  tsconfig.json
  coverage/
  .vscode/
  .idea/
  *.log
  ```

#### Scripts Directory Cleanup

- [x] Remove deprecated JavaScript files from scripts root:
  - [x ] `decompose-parallel.cjs`
  - [x ] `intelligent-agent-generator.js`
  - [x ] `postpublish.js`
  - [x ] `prepublish.js`
  - [x ] `security-check.js`
- [x] Remove duplicate shell scripts from scripts root:
  - [x ] `agent-commit-enhanced.sh`
  - [x ] `cache-linear-issue.sh`
  - [x ] `deploy.sh`
  - [x ] `integrate-parallel-work.sh`
  - [x ] `monitor-agents.sh`
  - [x ] `resolve-conflicts.sh`
  - [x ] `spawn-agents.sh`
  - [x ] `test-locally.sh`
  - [x ] `validate-parallel-work.sh`

- [x] Delete entire `scripts/archived/` directory (deprecated code)

- [x] Clean up Python test files in `scripts/python/`:
  - [x ] `test-locally.py`
  - [x ] `test-ruamel-yaml.py`
  - [x ] `test-yaml-formatting-v2.py`
  - [ ] `test-yaml-formatting.py`
  - [ ] `test_complex_scripts.py`

- [x] Move development documentation from scripts/python/:
  - [x] `lint-agnostic-quality-reporter-plan.md` → Move to development docs
  - [x] `complex_scripts_README.md` → Keep (might be useful for users)
  - [x] `agent_scripts_conversion_report.yaml` → Move to development docs

### 📄 Documentation Restructuring

#### Exclude docs/ Directory

- [x] Add `docs/` to `.npmignore` or exclude from `files` field
- [x] Ensure GitHub repository has complete documentation for reference

#### Move Development-Only Docs

- [x] Create `dev-docs/` directory (add to .gitignore if needed)
- [x] Move from docs/:
  - [x] Implementation plans
  - [x] Internal checklists
  - [x] Development guidelines
  - [x] PLAN.md files

### 🧹 Source Code Cleanup

#### Exclude Test Files from src/

- [x ] Ensure all `*.test.js` files are excluded
- [x ] Ensure all `*.spec.js` files are excluded
- [x ] Verify no test utilities are included in distribution

### ✅ Validation Steps

#### Pre-publish Checks

- [x] Run `npm pack --dry-run` to preview package contents
- [x ] Verify package size is around 500K (not 2.3MB)
- [x ] Check that essential directories are included:
  - [x ] ✅ bin/
  - [x ] ✅ src/ (without tests)
  - [x ] ✅ scripts/python/ (core tools only)
  - [x ] ✅ scripts/wrappers/
  - [x ] ✅ .claude/
  - [x ] ✅ ai-docs/

#### Test Installation

- [x] Run `npm pack` to create tarball
- [x] Test install in a clean directory: `npm install path/to/tarball`
- [x] Verify CLI works: `npx cdev --help`
- [x] Test core commands still function

### 🚀 Final Steps

- [x] Update CHANGELOG.md with optimization details
- [x] Commit all changes with message: "feat: optimize package distribution size by 78%"
- [x] Tag release if appropriate
- [x] Publish to npm registry

### 📊 Expected Results

| Directory | Before    | After     | Savings    |
| --------- | --------- | --------- | ---------- |
| scripts/  | 860K      | ~200K     | 660K       |
| docs/     | 360K      | 0         | 360K       |
| src/      | 740K      | ~300K     | 440K       |
| **Total** | **2.3MB** | **~500K** | **~1.8MB** |

### 🔍 Quick Verification Commands

```bash
# Check current package size
npm pack --dry-run 2>&1 | grep "npm notice"

# List files that will be included
npm pack --dry-run

# Create test package
npm pack

# Analyze package contents
tar -tzf *.tgz | less
```
