# 📄 **Testing & Logging Policy**

**Applies to:** Next.js web app, Node CLI tools, MCP servers.

---

### **1. Testing Framework**

- **Next.js app:** Use **Jest** + React Testing Library + `jest.mocked` helpers.
- **Node CLI & MCP servers:** Use **Vitest** + `vitest-mock-extended` or `vi.mocked`.
- **No `any` in mocks** — must use framework helpers or typed mock libs.

---

### **2. Mocking Rules**

- Only mock **interfaces at the boundary** (e.g., `UserRepo`), not internal functions.
- Use:
  - **Jest:** `jest.mocked()`, `jest.Mocked<T>`, `jest.MockedFunction<F>`.
  - **Vitest:** `vi.mocked()`, `Mocked<T>`, `vi.fn<Return, Args>()`.

- For deep mocks, use:
  - Jest: [`jest-mock-extended`](https://github.com/marchaos/jest-mock-extended)
  - Vitest: [`vitest-mock-extended`](https://github.com/marchaos/vitest-mock-extended)

---

### **3. CI / Quality Gates**

- **Typecheck:** `tsc --noEmit` (strict mode).
- **Lint:** ESLint — `no-console` error (only `console.error`/`console.warn` allowed in dev).
- **Format:** Prettier — check on commit.
- **Test Coverage:** Minimum `--coverage 85 --branches 80`.
- **Lockfile Integrity:** `pnpm install --frozen-lockfile`.

---

### **4. Logging**

- **No `console.log`** — use:
  - JS/TS: **pino** (pretty in dev, NDJSON to stderr in prod)
  - Python: **structlog** (JSON to stderr in prod)

- Attach `requestId` or equivalent context to every log line.
- Redact sensitive keys (`password`, `token`, `authorization`, `cookie`, `ssn`).
- MCP: stdout = protocol only, all logs to stderr.

**Violations**: CI will block merges on type errors, lint failures, coverage gaps, or formatting issues.

If you want, I can also give you **the ESLint config + Husky pre-commit hook scripts** so that these rules are _automatically enforced before CI_. That way, AI-generated code can’t even commit with `console.log` or `any` mocks.

Do you want me to prepare those enforcement configs next?
