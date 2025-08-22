# Testing Standards Protocol

## Test-Driven Development (TDD)

- Write tests before implementation
- Red → Green → Refactor cycle
- One failing test at a time

## Test Structure

- Arrange → Act → Assert pattern
- One assertion per test when possible
- Descriptive test names that explain the scenario
- Group related tests in describe blocks

## Coverage Requirements

- Minimum 80% code coverage
- 100% coverage for critical paths
- Coverage is a tool, not a goal

## Test Types

- **Unit Tests:** Test individual functions/methods
- **Integration Tests:** Test component interactions
- **E2E Tests:** Test complete user flows
- **Performance Tests:** Test speed and resource usage

## Mocking & Stubbing

- Mock external dependencies
- Use test doubles appropriately
- Avoid over-mocking
- Test behavior, not implementation

## Test Data

- Use factories for test data creation
- Avoid hardcoded test data
- Clean up test data after tests
- Use realistic data scenarios

## CI/CD Integration

- All tests must pass before merge
- Tests run automatically on push
- Fast tests run first
- Flaky tests must be fixed immediately
