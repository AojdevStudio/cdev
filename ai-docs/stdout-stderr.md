# The stdout/stderr Architecture Pattern

## 1. CLI Tools & Unix Pipelines

````bash
# stdout for data, stderr for logs
myapp process data.json | jq '.results' | sort
# ↑ logs go to stderr, clean data flows through pipe
stdout: Clean data output for piping
stderr: Logs, progress bars, warnings
Example: curl, grep, ffmpeg all follow this

## 2. MCP Servers (Your Case)

```bash
# stdout: JSON-RPC protocol only
process.stdout.write(JSON.stringify({jsonrpc: "2.0", result}));
# stderr: All logging
logger.error("Something went wrong"); // → stderr
stdout: Protocol communication
stderr: Debugging, monitoring

## 3. Docker/Container Applications

```bash
# Common pattern in containerized apps
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
        stderrLevels: ['error', 'warn', 'info', 'debug'], // Everything to stderr
      })
    ]
  });
stdout: Health check responses, metrics
stderr: Application logs (collected by Docker/K8s)

## 4. Web Servers & APIs

```bash
# Express/Fastify apps
app.use((req, res, next) => {
  # Structured logging to stderr
  logger.info({method: req.method, path: req.path}); // → stderr
    next();
  });
  // stdout often unused or for specific output formats

  5. Background Workers/Cron Jobs

  // Worker that processes tasks
  async function processJob() {
    // Results to stdout (for capture/storage)
    process.stdout.write(JSON.stringify(results));
    // Logs to stderr (for monitoring)
    logger.info('Job completed', {duration}); // → stderr
  }

## 6. Testing Frameworks

```bash
# Jest, Mocha, etc.
# TAP format to stdout for CI parsing
process.stdout.write('ok 1 - test passed\n');
# Debug info to stderr
console.error('Debug: Setting up test environment');

## When to Use This Pattern:

## Use stdout/stderr separation when:
  - Building CLI tools that need to be pipeable
  - Creating protocol-based servers (JSON-RPC, GraphQL subscriptions)
  - Writing data processing scripts
  - Building container-native applications
  - Creating tools that integrate with Unix toolchains

## Don't worry about it when:
  - Building standard web APIs (everything goes to stderr/logs)
  - Creating desktop GUI apps
  - Writing simple scripts for one-time use
  - Building browser JavaScript

## Real-World Examples:

## 1. Git: Outputs data to stdout, progress to stderr
## 2. Docker: Container output to stdout, Docker daemon logs to stderr
## 3. npm/yarn: Package data to stdout, progress bars to stderr
## 4. Database CLIs: Query results to stdout, connection info to stderr
## 5. ffmpeg: Encoded video to stdout, progress to stderr

## Pro Tips:

```bash
# Pattern 1: Conditional output based on TTY
if (process.stderr.isTTY) {
  # Interactive terminal - show progress bars
    showProgressBar();
  } else {
    # Piped/redirected - just log completion
    logger.info('Processing...');
  }

```bash
# Pattern 2: Debug flag for verbose stderr
const debug = process.env.DEBUG;
logger.level = debug ? 'debug' : 'info';

# Pattern 3: Structured logging for observability
logger.info({
  event: 'request_complete',
    duration_ms: 145,
    status: 200
}); // → stderr for log aggregation
````

## Definitive rules (use these everywhere)

1. **No `console.log`—ever.** Add an ESLint rule to enforce it (below).
2. **stdout = results, stderr = logs.** Services “respond” via HTTP; only logs go to stderr.
3. **Always structured logs (NDJSON).** One JSON object per line.
4. **Use levels.** `debug < info < warn < error < fatal`. Failures = non-zero exit code.
5. **Attach correlation.** Include `requestId`/`traceId` on every log line.
6. **No secrets/PHI in logs.** Add a redaction step (keys like `password`, `token`, `ssn`, etc.).
7. **Dev pretty, Prod JSON.** Human-friendly in dev; machine-friendly in prod.
8. **Sampling for noisy debug.** E.g., only 1% of `debug` in hot paths.
9. **Protocols stay pristine.** MCP stdout = protocol only; all diagnostics to stderr.
10. **Fail loud, not verbose.** On errors, log once with context; don’t spam stack traces.

---

# What to use (opinionated picks)

## JavaScript/TypeScript (Next.js + CLI + MCP)

- **Use `pino`.** It’s fast, JSON-first, battle-tested.
- **Winston?** Fine, but heavier/slower and less JSON-first. If you’re Next.js-heavy, prefer **pino**.
- **Dev UX:** `pino-pretty` for local readability.
- **Edge runtime:** you can’t use Node transports; use a tiny wrapper that outputs the same JSON shape via `console` (still conceptually “stderr”).

### Ban `console.*`

```json
// .eslintrc.json
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```

### Next.js logger (server runtime)

```ts
// lib/logger.ts
import pino from 'pino';

const redact = { paths: ['password', 'token', 'authorization', 'cookie', 'ssn'], remove: true };

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  redact,
  base: null, // don’t add pid/hostname; keep it lean in serverless
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
```

Attach `requestId` (one line middleware-ish pattern):

```ts
// app/api/hello/route.ts (example)
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const child = logger.child({ requestId, route: '/api/hello' });

  child.info({ msg: 'request.start' });
  try {
    // ... work
    child.info({ msg: 'request.ok', durationMs: 3 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    child.error({ msg: 'request.error', err: (err as Error).message });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
```

### CLI logger (Node)

```ts
// bin/logger.ts
import pino from 'pino';
export const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
});
// Usage:
log.info({ msg: 'starting', argv: process.argv.slice(2) });
log.warn({ msg: 'slow-step', step: 'fetch' });
log.error({ msg: 'failed', error: String(err) });
```

- **Remember:** results your CLI emits → `process.stdout.write(...)`; logs → `log.*(...)` (which writes to stderr).

### MCP server rule

- **Stdout:** JSON-RPC frames only.
- **Stderr:** the same `pino` logger as above. Never print banners or “listening on port…” to stdout.

---

## Python projects

- **Use `structlog` + stdlib `logging`** (best mix of ergonomics + performance + JSON).
- `loguru` is nice, but `structlog` plays cleaner with existing libs and has first-class JSON processors.

### Python config (JSON to stderr)

```python
# logging_setup.py
import logging, sys, structlog

logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stderr)],
    format="%(message)s",
)

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.dict_tracebacks,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),
)

log = structlog.get_logger()

# usage
# log.info("request.start", request_id=req_id, route="/health")
# log.error("db.error", err=str(e))
```

**CLI in Python:**

- Results → `print(..., file=sys.stdout)`
- Logs → `log.info(...)` (stderr via config)

**FastAPI/Uvicorn note:**

- Set `UVICORN_ACCESS_LOG=0`, integrate `structlog`, and emit your own request logs with `request_id`.

---

# Dev vs Prod behaviors (pre-baked)

- **Dev:** pretty logs (`pino-pretty` / `structlog.dev.ConsoleRenderer()` if you want), more `debug`.
- **Prod:** strict NDJSON, fewer `debug`, redaction on, write to **stderr**.

---
