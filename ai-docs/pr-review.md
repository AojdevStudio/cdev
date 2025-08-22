---

# PR Review Checklist

* [ ] Tests use typed mocks (`jest.mocked`, `vi.mocked`, `Mocked<T>`).
* [ ] No `as any` casts.
* [ ] Logs follow pino/structlog pattern (no `console.log`).
* [ ] Happy + sad path tested.
* [ ] Coverage meets thresholds.
* [ ] Deterministic tests (no flaky timers/random IDs).
* [ ] Names are descriptive (behavior, not implementation).
* [ ] Protocol streams (MCP stdout) have no stray output.

---
