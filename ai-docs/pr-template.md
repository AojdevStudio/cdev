---

## 📝 **Pull Request Template** (place in `.github/pull_request_template.md`)

```markdown
## Summary
<!-- Briefly describe the purpose of this PR -->

## Testing Approach
- [ ] Framework: Jest (Next.js) / Vitest (CLI/MCP)
- [ ] Typed mocks used (`jest.mocked`, `vi.mocked`, or Mocked<T>)
- [ ] No `any` or `as any`
- [ ] Happy + sad path tests included
- [ ] Coverage meets thresholds

## Logging Compliance
- [ ] No `console.log` — all logs use pino/structlog
- [ ] Redaction rules applied
- [ ] MCP stdout contains only protocol messages

## Additional Notes
<!-- Anything reviewers should know about unusual decisions -->
```

---
