# CDEV Task Completion Workflow

## When Task is Completed
1. **Code Quality**: Run `npm run quality` to check lint + format
2. **Testing**: Run `npm test` or `npm run test:all` for comprehensive testing
3. **Python Quality**: If Python scripts modified, run `npm run quality:python`
4. **TypeScript**: If TypeScript files involved, run `npm run typecheck`
5. **Security**: For sensitive changes, run `npm run security:check`

## Pre-Commit Checklist
- [ ] All tests passing
- [ ] Code formatted and linted
- [ ] No console.log statements in production code
- [ ] Security checks passed
- [ ] Documentation updated if needed

## Build Verification
```bash
npm run build  # Runs quality + sets permissions
```

## Git Workflow
- Use kebab-case for branch names
- Follow conventional commit messages
- Ensure all quality gates pass before committing

## Special Considerations
- Python scripts in `scripts/python/` must be executable
- Hook files must implement proper logging
- All changes should maintain backward compatibility