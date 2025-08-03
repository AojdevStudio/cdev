# Repository Health Verification Protocol

This command outlines a comprehensive protocol for verifying and maintaining a repository's health.

## Key Goals
- Verify repo is in a working state
- Run CI checks
- Fix any identified issues
- Prepare files for staging

## Main Steps
1. Update dependencies (detect package manager by lockfile: package-lock.json → npm, pnpm-lock.yaml → pnpm, yarn.lock → yarn, bun.lockb → bun)
2. Run linter checks
3. Verify builds and types
4. Run test coverage
5. Sort package.json
6. Lint packages
7. Double-check all previous steps
8. Stage files (avoiding git submodules)

## Error Handling Protocol
1. Explain why something broke
2. Propose and implement a fix
3. Check for similar issues elsewhere
4. Clean up debugging code

## Important Guidelines
- Never commit, only stage files
- Run tests package-by-package
- Be willing to make necessary fixes
- Use typescript and tests as safeguards

The document emphasizes a methodical approach to maintaining code quality and resolving issues systematically.