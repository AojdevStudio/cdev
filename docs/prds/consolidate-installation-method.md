# [REFACTOR] Consolidate CDEV to Project-Dependent Installation Only

## Metadata

- **Priority:** High
- **Status:** Todo
- **Assignee:** Unassigned
- **Estimate:** 8-12 hours
- **Issue ID:** [TBD]
- **Labels:**
  - type:refactor
  - priority:high
  - breaking-change
  - installation
  - architecture

## Problem Statement

### What

CDEV currently supports multiple installation methods (global npm install, npx, manual, project-specific), creating confusion and maintenance overhead. We need to consolidate to a single, clear installation method: project-dependent dev tool installation.

### Why

- **User Confusion:** Multiple installation methods lead to unclear best practices and conflicting documentation
- **Maintenance Burden:** Supporting multiple installation patterns increases complexity and testing requirements
- **Inconsistent Experience:** Different installation methods result in varying behaviors and capabilities
- **Version Conflicts:** Global installations can conflict with project-specific needs
- **Modern Best Practice:** Project-local tools are the standard for modern development workflows

### Context

Current installation methods found:

1. Global installation via `npm install -g @aojdevstudio/cdev` (recommended in README)
2. Direct usage via `npx @aojdevstudio/cdev` (mentioned throughout)
3. Manual installation from repository
4. Project-specific installation (exists but not primary)

The package.json has `"preferGlobal": true` which actively encourages global installation, contradicting modern development practices.

## Acceptance Criteria

- [ ] **AC1:** Remove all global installation support and documentation
- [ ] **AC2:** Update package.json to remove `preferGlobal` and related global configurations
- [ ] **AC3:** Modify CLI to work exclusively as a local dev dependency
- [ ] **AC4:** Update all documentation to reflect project-only installation
- [ ] **AC5:** Create migration guide for existing global installation users
- [ ] **AC6:** Ensure all commands work via npm scripts or npx from project
- [ ] **AC7:** Interactive installer adapts to project-local context
- [ ] **AC8:** No breaking changes to core functionality, only installation method

## Technical Requirements

### Implementation Notes

- Remove `preferGlobal` from package.json
- Update bin/cli.js to handle project-local execution context
- Modify interactive installer to assume project-local installation
- Update all file path resolution to work from project root
- Ensure scripts work with local node_modules/.bin/cdev
- Add npm script examples to documentation

### Testing Requirements

- [ ] **Unit Tests** - Framework: Jest, Coverage: 90%, Location: test/unit/
- [ ] **Integration Tests** - Framework: Jest, Location: test/integration/
- [ ] **E2E Tests** - Framework: Manual, Location: docs/testing/installation-scenarios.md

### Dependencies

- **Blockers:** None
- **Related:** Documentation updates, README overhaul
- **Files to Modify:**
  - package.json
  - bin/cli.js
  - src/interactive-installer.js
  - src/path-resolver.js
  - README.md
  - All documentation files mentioning installation

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests written and passing (per testing requirements)
- [ ] Documentation updated to reflect new installation method
- [ ] Migration guide created and tested
- [ ] Manual verification completed on fresh project
- [ ] Breaking change notice added to CHANGELOG

## Agent Context

### Reference Materials

- Modern npm best practices: https://docs.npmjs.com/cli/v8/using-npm/developers
- Project-local tools pattern: https://classic.yarnpkg.com/blog/2018/02/11/introducing-workspaces/
- npx usage patterns: https://www.npmjs.com/package/npx

### Integration Points

- npm/yarn/pnpm package managers
- package.json scripts section
- node_modules/.bin directory
- npx execution context
- Project root detection logic

## Validation Steps

### Automated Verification

- [ ] Build pipeline passes
- [ ] All tests green
- [ ] Linting passes
- [ ] No global installation references remain

### Manual Verification

1. **Step 1:** Fresh project installation - `npm install --save-dev @aojdevstudio/cdev`
2. **Step 2:** Verify bin available at `node_modules/.bin/cdev`
3. **Step 3:** Test via npm script: `"cdev": "cdev"` in package.json
4. **Step 4:** Test via npx: `npx cdev decompose`
5. **Step 5:** Ensure all commands work without global installation
6. **Step 6:** Verify interactive installer detects project context
7. **Step 7:** Test migration from global to local installation

## Agent Execution Record

### Branch Strategy

- **Name Format:** refactor/consolidate-installation-method
- **Linear Example:** refactor/ENG-XXX-consolidate-installation
- **GitHub Example:** refactor/#XXX-project-only-install

### PR Strategy

Link to this issue using magic words in PR description

### Implementation Approach

1. Remove global installation configurations
2. Update path resolution logic
3. Modify documentation systematically
4. Create comprehensive migration guide
5. Test all scenarios thoroughly

### Completion Notes

- Document any edge cases discovered
- Note any backward compatibility considerations
- Record performance impact if any

### PR Integration

- **Linear Magic Words:** Fixes ENG-XXX
- **GitHub Magic Words:** Closes #XXX
- **Auto Close Trigger:** PR merge to main branch
- **Status Automation:** Issue will auto-move from 'In Progress' to 'Done'

### Debug References

- Installation test results
- Path resolution logs
- User feedback from migration

### Change Log

- Initial PRD creation
- Technical requirements refined based on codebase analysis

## Bot Automation Integration

### Branch Naming for Auto-Linking

#### Linear Examples

- refactor/ENG-XXX-consolidate-installation
- refactor/ENG-XXX-project-only-install

#### GitHub Examples

- refactor/#XXX-consolidate-installation
- refactor/#XXX-remove-global-install

### PR Description Template

```markdown
## Description

Consolidates CDEV installation to project-dependent only, removing global installation support.

**Breaking Change:** This removes global installation support. Users must migrate to project-local installation.

**Linked Issues:**

- Fixes [ISSUE_ID]

## Migration Guide

See docs/migration/global-to-local.md for detailed migration instructions.

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Fresh installation tested
- [ ] Migration from global tested
- [ ] All commands work via npm scripts
- [ ] All commands work via npx
```
