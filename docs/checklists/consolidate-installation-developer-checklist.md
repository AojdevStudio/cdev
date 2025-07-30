# Developer Checklist: Consolidate CDEV Installation Method

**PRD Reference:** [Consolidate CDEV to Project-Dependent Installation Only](/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/docs/prds/consolidate-installation-method.md)
**Issue ID:** [TBD]
**Priority:** High
**Estimated Time:** 8-12 hours

## Pre-Development Setup

- [ ] Review PRD and acceptance criteria
- [ ] Set up development branch: `refactor/consolidate-installation-method`
- [ ] Review existing code in: `package.json`, `bin/`, `src/`, `README.md`, `docs/`
- [ ] Identify all references to global installation across codebase
- [ ] Create backup of current installation documentation

## Implementation Tasks

### Package Configuration Updates

- [ ] Open `/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/package.json`
- [ ] Remove line 111: `"preferGlobal": true,`
- [ ] Update package description to remove "global" references
- [ ] Add `"type": "module"` if using ES modules (verify compatibility)
- [ ] Update keywords to remove "global" if present
- [ ] Add example npm scripts section to package.json for local usage

### CLI Entry Point Modifications

- [ ] Modify `/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/bin/cli.js`
- [ ] Update shebang to ensure proper local execution
- [ ] Add project root detection logic for local installations
- [ ] Ensure proper path resolution when run from node_modules/.bin
- [ ] Add fallback for npx execution context
- [ ] Test with various execution methods (npm run, npx, direct)

### Path Resolution Updates

- [ ] Review `/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/src/path-resolver.js`
- [ ] Update all path resolution to work from project root, not global locations
- [ ] Ensure `.claude` directory is resolved relative to project root
- [ ] Update script path resolution to find local scripts directory
- [ ] Add detection for project root (look for package.json upwards)
- [ ] Handle edge cases (monorepos, nested projects)

### Interactive Installer Updates

- [ ] Modify `/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/src/interactive-installer.js`
- [ ] Remove any global installation assumptions
- [ ] Update installation target to always be current project
- [ ] Modify prompts to reflect project-local context
- [ ] Ensure hook installation works with local paths
- [ ] Update validation to check project context

### Documentation Updates

#### README.md Updates

- [ ] Open `/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/README.md`
- [ ] Remove line 94: `npm install -g @aojdevstudio/cdev`
- [ ] Replace with: `npm install --save-dev @aojdevstudio/cdev`
- [ ] Update all command examples to use npm scripts or npx
- [ ] Remove "Install globally (recommended)" references
- [ ] Add section on adding npm scripts to package.json
- [ ] Update quick start guide to reflect local installation

#### Installation Guide Updates

- [ ] Modify `/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/docs/guides/installation.md`
- [ ] Remove all global installation instructions
- [ ] Add project-local installation as the only method
- [ ] Include npm script setup examples
- [ ] Add npx usage examples
- [ ] Remove line 51: `# Install globally (recommended)`
- [ ] Update troubleshooting section for local installation issues

#### Other Documentation Updates

- [ ] Search all markdown files for global installation references
- [ ] Update `/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/docs/USAGE.md`
- [ ] Update any example commands to use `npx cdev` or npm scripts
- [ ] Check and update all files in `docs/guides/`
- [ ] Update any workflow documentation
- [ ] Ensure consistency across all documentation

### Migration Guide Creation

- [ ] Create `/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/docs/migration/global-to-local.md`
- [ ] Document steps to uninstall global version
- [ ] Provide clear local installation instructions
- [ ] Include npm script setup template
- [ ] Add troubleshooting for common migration issues
- [ ] Create examples for different package managers (npm, yarn, pnpm)

### Command Updates

- [ ] Review all commands in `/Users/ossieirondi/Projects/dev-utils/paralell-development-claude/src/cli-commands.js`
- [ ] Ensure commands work with local execution context
- [ ] Update any hardcoded global paths
- [ ] Test each command with local installation
- [ ] Verify Python script execution from local context

## Testing Tasks

### Unit Tests

- [ ] Update tests that assume global installation
- [ ] Add tests for project root detection
- [ ] Test path resolution with local installation
- [ ] Test CLI execution from node_modules/.bin
- [ ] Achieve minimum 90% code coverage
- [ ] Run: `npm run test:unit`

### Integration Tests

- [ ] Create test for fresh local installation
- [ ] Test all commands via npm scripts
- [ ] Test all commands via npx
- [ ] Test in monorepo setup
- [ ] Test with different package managers
- [ ] Run: `npm run test:integration`

### Manual Testing Scenarios

- [ ] Fresh project with `npm install --save-dev @aojdevstudio/cdev`
- [ ] Run via npm script: `npm run cdev decompose`
- [ ] Run via npx: `npx cdev status`
- [ ] Test interactive installer in local context
- [ ] Verify hooks installation to correct location
- [ ] Test Python script execution
- [ ] Verify all commands work without global cdev

## Documentation Tasks

- [ ] Update main README.md with new installation instructions
- [ ] Update all command examples to show local usage
- [ ] Add npm scripts section to documentation
- [ ] Create troubleshooting guide for local installation
- [ ] Update any video tutorial references
- [ ] Add migration guide to documentation index

## Review & Deployment

- [ ] Self-review all code changes
- [ ] Verify no global installation references remain
- [ ] Run all quality checks: `npm run quality`
- [ ] Test on fresh system without global cdev
- [ ] Create PR with breaking change notice
- [ ] Link PR to issue using magic words
- [ ] Update CHANGELOG.md with breaking change
- [ ] Create release notes highlighting the change

## Post-Deployment

- [ ] Monitor npm downloads for issues
- [ ] Check GitHub issues for installation problems
- [ ] Update any external documentation/tutorials
- [ ] Respond to user migration questions
- [ ] Create FAQ if common issues arise
- [ ] Consider npm deprecation notice for old versions

## Breaking Change Communication

- [ ] Add prominent notice to README
- [ ] Create GitHub release with migration guide
- [ ] Post to relevant communities/forums
- [ ] Update npm package description
- [ ] Consider major version bump (0.x.x → 1.0.0)

## Rollback Plan

- [ ] Document rollback procedure
- [ ] Keep previous version available
- [ ] Prepare hotfix branch if critical issues arise
- [ ] Monitor user feedback closely post-release
