# Changelog Conventions

## Overview

This document defines the standards and conventions for maintaining the CHANGELOG.md file in any project. We follow the principles of [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

## Quick Reference

```markdown
## [Unreleased]

### Added

- New feature descriptions

### Changed

- Modified functionality

### Deprecated

- Features to be removed

### Removed

- Deleted features

### Fixed

- Bug fixes

### Security

- Security patches
```

## Semantic Versioning

### Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Version Examples

```markdown
## [2.1.0] - 2024-12-20

Breaking change: Major version bump

## [1.5.0] - 2024-12-15

New feature: Minor version bump

## [1.4.3] - 2024-12-10

Bug fix: Patch version bump
```

## Changelog Structure

### File Header

```markdown
# Changelog

All notable changes to the Dental Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
```

### Entry Format

```markdown
## [Version] - YYYY-MM-DD

### Category

- Change description with [#PR-number](link-to-pr) by @username
- Another change with issue reference fixes [#issue-number](link-to-issue)
```

## Change Categories

### Added

For new features or capabilities.

```markdown
### Added

- Provider performance dashboard with real-time metrics [#123](https://github.com/org/repo/pull/123)
- Multi-location support for provider assignments [#125](https://github.com/org/repo/pull/125)
- Export functionality for financial reports in PDF format [#130](https://github.com/org/repo/pull/130)
```

### Changed

For changes in existing functionality.

```markdown
### Changed

- Updated dashboard layout for better mobile responsiveness [#135](https://github.com/org/repo/pull/135)
- Improved query performance for provider list by 50% [#140](https://github.com/org/repo/pull/140)
- Migrated from REST to GraphQL for real-time data [#145](https://github.com/org/repo/pull/145)
```

### Deprecated

For features that will be removed in future versions.

```markdown
### Deprecated

- Legacy API endpoints (/api/v1/\*) - will be removed in v3.0.0 [#150](https://github.com/org/repo/pull/150)
- jQuery-based chart library - migrating to React-based solution [#155](https://github.com/org/repo/pull/155)
```

### Removed

For features that have been removed.

```markdown
### Removed

- Deprecated provider import via CSV [#160](https://github.com/org/repo/pull/160)
- Legacy authentication system [#165](https://github.com/org/repo/pull/165)
- Unused dashboard widgets [#170](https://github.com/org/repo/pull/170)
```

### Fixed

For bug fixes.

```markdown
### Fixed

- Provider goals not saving correctly for multi-location providers [#175](https://github.com/org/repo/pull/175)
- Dashboard crash when viewing yearly analytics [#180](https://github.com/org/repo/pull/180)
- Incorrect production calculations for hygienists [#185](https://github.com/org/repo/pull/185)
```

### Security

For security-related changes.

```markdown
### Security

- Updated dependencies to patch CVE-2024-1234 [#190](https://github.com/org/repo/pull/190)
- Fixed XSS vulnerability in provider notes field [#195](https://github.com/org/repo/pull/195)
- Implemented rate limiting on authentication endpoints [#200](https://github.com/org/repo/pull/200)
```

## Writing Guidelines

### Entry Guidelines

1. **Start with a verb**

   ```markdown
   ✅ Added provider search functionality
   ✅ Fixed memory leak in dashboard
   ❌ Provider search functionality
   ❌ Memory leak in dashboard
   ```

2. **Be concise but descriptive**

   ```markdown
   ✅ Added bulk import for providers with validation and error reporting
   ❌ Added bulk import
   ❌ Added a new feature that allows users to import multiple providers at once with validation
   ```

3. **Include context when helpful**

   ```markdown
   ✅ Fixed calculation error that caused 10% overstatement in production metrics
   ❌ Fixed calculation error
   ```

4. **Reference issues and PRs**
   ```markdown
   ✅ Fixed login timeout issue [#210](link) fixes [#205](link)
   ❌ Fixed login timeout issue
   ```

### Technical Details

For complex changes, include technical context:

```markdown
### Changed

- Migrated from CRA to Next.js 14 for improved performance and SEO [#220](link)
  - Server-side rendering for dashboard pages
  - API routes consolidated into Next.js API
  - Static generation for marketing pages
```

## Unreleased Section

### Purpose

Track changes that haven't been released yet.

```markdown
## [Unreleased]

### Added

- Real-time notifications for goal achievements
- Provider schedule management interface

### Fixed

- Dashboard loading spinner not appearing on slow connections
```

### Moving to Release

When releasing, move all unreleased items to a new version section:

```markdown
## [1.5.0] - 2024-12-25

### Added

- Real-time notifications for goal achievements [#225](link)
- Provider schedule management interface [#230](link)

### Fixed

- Dashboard loading spinner not appearing on slow connections [#235](link)

## [Unreleased]

<!-- Now empty, ready for new changes -->
```

## Version Comparison Links

### Footer Section

```markdown
[Unreleased]: https://github.com/org/repo/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/org/repo/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/org/repo/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/org/repo/releases/tag/v1.3.0
```

## Release Process Integration

### 1. Pre-release Checklist

```bash
# Update version in package.json
npm version minor # or major/patch

# Update CHANGELOG.md
# - Move Unreleased to new version
# - Add release date
# - Update comparison links

# Commit changes
git add package.json CHANGELOG.md
git commit -m "chore: release v1.5.0"
git tag v1.5.0
```

### 2. Automated Changelog

Using conventional commits for automation:

```bash
# Commit format
<type>(<scope>): <subject>

# Examples
feat(providers): add bulk import functionality
fix(dashboard): resolve memory leak in charts
docs(api): update provider endpoint documentation
```

### 3. Changelog Generation Script

```typescript
// scripts/update-changelog.ts
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

interface Commit {
  hash: string;
  type: string;
  scope: string;
  subject: string;
  pr?: string;
}

function generateChangelog(version: string) {
  const commits = getCommitsSinceLastTag();
  const grouped = groupCommitsByType(commits);
  const changelog = formatChangelog(grouped, version);

  updateChangelogFile(changelog);
}

function groupCommitsByType(commits: Commit[]) {
  return {
    Added: commits.filter((c) => c.type === 'feat'),
    Fixed: commits.filter((c) => c.type === 'fix'),
    Changed: commits.filter((c) => c.type === 'refactor'),
    Security: commits.filter((c) => c.type === 'security'),
  };
}
```

## Examples

### Major Release (2.0.0)

```markdown
## [2.0.0] - 2024-12-30

### Added

- Multi-tenant architecture with complete data isolation [#300](link)
- New React-based UI with improved performance [#305](link)
- GraphQL API for real-time updates [#310](link)

### Changed

- **BREAKING**: API endpoints moved from /api/v1 to /api/v2 [#315](link)
- **BREAKING**: Database schema updated for UUID support [#320](link)
- Complete UI redesign with new design system [#325](link)

### Removed

- **BREAKING**: Legacy REST API endpoints [#330](link)
- jQuery and related dependencies [#335](link)

### Security

- Implemented Row Level Security for all database tables [#340](link)
- Added multi-factor authentication support [#345](link)
```

### Minor Release (1.5.0)

```markdown
## [1.5.0] - 2024-12-25

### Added

- Provider performance analytics dashboard [#250](link)
- Bulk goal setting for multiple providers [#255](link)
- CSV export for all report types [#260](link)

### Changed

- Improved dashboard loading time by 40% [#265](link)
- Updated provider list UI with better filtering [#270](link)

### Fixed

- Goal calculations for part-time providers [#275](link)
- Date picker not working in Safari [#280](link)
```

### Patch Release (1.4.1)

```markdown
## [1.4.1] - 2024-12-20

### Fixed

- Critical bug in production calculation [#240](link)
- Memory leak in dashboard charts [#242](link)
- Login redirect loop on session timeout [#245](link)

### Security

- Updated dependencies to patch vulnerabilities [#247](link)
```

## Special Sections

### Migration Guides

For breaking changes, link to migration guides:

```markdown
## [2.0.0] - 2024-12-30

### Changed

- **BREAKING**: New database schema ([Migration Guide](./docs/migrations/v2.md)) [#350](link)
```

### Performance Improvements

Highlight significant performance gains:

```markdown
### Changed

- Dashboard initial load time reduced by 60% through:
  - Code splitting and lazy loading [#355](link)
  - Image optimization [#360](link)
  - Database query optimization [#365](link)
```

### Dependencies

Note major dependency updates:

```markdown
### Changed

- Updated to Next.js 14 from 13 [#370](link)
- Migrated from Prisma 4 to Prisma 5 [#375](link)
- Updated all Radix UI components to latest versions [#380](link)
```

## Maintenance

### Regular Tasks

1. **Before Each PR**
   - Add entry to Unreleased section
   - Follow proper categorization
   - Include PR reference

2. **During Release**
   - Move Unreleased to version section
   - Add release date
   - Update version links
   - Tag release in git

3. **Quarterly Review**
   - Ensure all PRs are documented
   - Clean up formatting
   - Verify links work
   - Archive old versions if needed

### Tools Integration

```json
// package.json scripts
{
  "scripts": {
    "changelog:validate": "changelog-validator",
    "changelog:generate": "conventional-changelog -p angular -i CHANGELOG.md -s",
    "version": "npm run changelog:generate && git add CHANGELOG.md"
  }
}
```

## Related Resources

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Workflow Guide](./git-workflow.md)

---

**Last Updated**: July 2025
**Navigation**: [Back to Architecture Index](./index.md)
