# ESLint Fixes Checklist

## Current Status
- **Total Issues**: 322 (2 errors, 320 warnings)
- **Security**: All critical security rules are enabled ✅
- **Python**: All Ruff checks pass ✅

## Priority 1: Fix Errors (2 issues)
These must be fixed as they could cause runtime issues:

- [ ] **valid-typeof errors** in `src/config-loader.js`
  - Line 179: Fix typeof comparison to use string literal
  - Quick fix: Change invalid typeof comparisons to proper strings

## Priority 2: Clean Up Unused Variables (≈250 warnings)
These clutter the codebase and should be addressed:

### Approach Options:
1. **Batch Fix by Type**:
   - [ ] Remove unused imports (fs, path, os) from test files
   - [ ] Prefix unused function parameters with `_` (e.g., `options` → `_options`)
   - [ ] Remove completely unused variables
   - [ ] Comment out or remove unused destructured variables

2. **File-by-File Approach**:
   - [ ] Start with test files (often have unused imports)
   - [ ] Move to src files with most warnings
   - [ ] Use `npm run lint:fix` after manual changes

### Quick Wins:
```bash
# Find all unused 'path' imports
npm run lint 2>&1 | grep "'path' is assigned a value but never used"

# Find all unused function parameters
npm run lint 2>&1 | grep "is defined but never used. Allowed unused args"
```

## Priority 3: Import Organization (≈20 warnings)
These improve code readability:

- [ ] Fix import order warnings
- [ ] Remove empty lines within import groups
- [ ] Can be auto-fixed: `npm run lint:fix`

## Priority 4: Code Quality Warnings
Lower priority but good for maintainability:

- [ ] Fix empty block statements
- [ ] Address console.warn usage (already allowed, but review if needed)
- [ ] Review consistent-return warnings

## Automation Strategy

### Step 1: Auto-fix what's possible
```bash
npm run lint:fix
```

### Step 2: Script to prefix unused parameters
Create a script to automatically prefix unused parameters with `_`:
```javascript
// Example: Convert (options) => {} to (_options) => {}
```

### Step 3: Batch remove unused imports
```bash
# Remove unused imports from test files
find test -name "*.js" -exec sed -i '' '/^import.*path.*from/d' {} \;
```

## Tracking Progress

### Current Baseline
```bash
# Save current state
npm run lint 2>&1 > lint-baseline.txt

# Track progress
npm run lint 2>&1 | grep -c "error"    # Should be 2
npm run lint 2>&1 | grep -c "warning"  # Should be ~320
```

### Goal Metrics
- [ ] 0 errors
- [ ] <50 warnings (focus on real issues)
- [ ] All security rules passing

## Implementation Plan

### Phase 1: Critical Fixes (Today)
1. Fix 2 valid-typeof errors
2. Run tests to ensure nothing breaks

### Phase 2: Unused Variables (This Week)
1. Batch fix test file imports
2. Prefix unused parameters with `_`
3. Remove truly unused variables

### Phase 3: Polish (Next Week)
1. Fix import ordering
2. Address remaining warnings
3. Update ESLint config if needed

## Notes
- The security-focused config maintains all critical security checks
- Most warnings are style issues, not bugs
- Focus on errors first, then high-value warnings
- Consider adding pre-commit hooks after cleanup