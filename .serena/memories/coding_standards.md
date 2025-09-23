# CDEV Coding Standards & Conventions

## File Naming
- Use kebab-case for all files: `user-service.js`, `api-reference.md`
- Exception for special files: `README.md`, `CHANGELOG.md`, `CLAUDE.md`
- Test files: `*.test.js` with descriptive suffixes

## JavaScript Code Style
- **Variables/Functions**: camelCase (`userName`, `getUserProfile()`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Classes**: PascalCase (`UserManager`)
- **ESLint**: Airbnb base configuration with custom rules
- **Prettier**: Enforced formatting
- **Import order**: builtin, external, internal, parent, sibling, index

## Code Quality Rules
- No console.log in production (console.off for tests)
- Prefer const over let
- Arrow functions preferred
- No unused variables (warn with underscore prefix allowed)
- Security rules enforced (no-eval, no-implied-eval, etc.)

## Python Standards
- Ruff for linting and formatting
- Scripts located in `scripts/python/`
- All hooks must implement logging with timestamps and session IDs