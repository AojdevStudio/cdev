# CDEV Development Commands

## Quality & Testing Commands
```bash
# Run all tests
npm test                    # Runs unit + integration tests
npm run test:all           # Runs unit + integration + DOM tests
npm run test:ci            # CI test suite
npm run test:coverage      # Test coverage report

# Code Quality
npm run lint               # ESLint JavaScript files
npm run lint:fix          # Auto-fix ESLint issues
npm run format            # Prettier format all files
npm run quality           # Lint + format check
npm run quality:fix       # Auto-fix lint + format

# Python Quality
npm run lint:python       # Ruff check Python scripts
npm run quality:python    # Lint + format check Python
npm run quality:python:fix # Auto-fix Python issues

# TypeScript
npm run typecheck         # TypeScript type checking
```

## Build & Security
```bash
npm run build             # Quality check + permissions setup
npm run security:check    # Run security validation
npm run security:audit    # NPM audit
```

## API Development (when applicable)
```bash
npm run api:dev           # Development server
npm run api:build         # Build API
npm run api:test          # API tests
```

## Changelog Management
```bash
npm run changelog:auto    # Auto-generate changelog
npm run changelog:preview # Preview changelog changes
```

## System Commands (Darwin/macOS)
- `ls`, `find`, `grep`, `git` - Standard Unix tools
- `ruff` - Python linting/formatting
- `chmod +x` - Make scripts executable