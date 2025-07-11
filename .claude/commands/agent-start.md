---
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Task
description: Load workspace and run parallel-sub-agent Explore–Plan–Test–Code workflow
---

# Agent Start

This command parses an **agent_context.json** task file and orchestrates a **parallel-sub-agent** workflow —  
**Explore → Plan → Write Tests → Code → Refactor → Validate → Write-Up** — to ship fast, high-quality implementations.

**variables:**  
AgentContextPath: $ARGUMENTS   <!-- default: ./agent_context.json -->

**Usage Examples:**
- `/agent-start` — run in current directory (default agent_context.json)  
- `/agent-start ../ticket_742/ctx.json` — open a specific task file  
- `/agent-start . --phase=plan` — start at a given phase  
- `/agent-start . --resume` — continue from last completed phase  
- `/agent-start . --validate-only` — skip directly to Validate phase  

---

## Instructions
_Read **$AgentContextPath**, then follow the phases below.  
All sub-agents must be launched with the **Task** tool, given a bounded goal, and terminate when done to avoid context clashes._

### Sub-Agent Resource Rules
- Launch sub-agents **only for scoped, independent subtasks**.  
- Each sub-agent writes its output to `/shared/coordination/` (scratch) **and** any final artefact to the phase-specific folder listed below.  
- Do **not** leave idle or persistent sub-agents running after completion.

### Phase-Recovery Logic
- `--resume` 👉 read `/shared/coordination/phase_state.json` and jump to next phase.  
- `--validate-only` 👉 execute **Phase 6 – Validate** directly.  
- Otherwise honour `--phase=` or default to **Explore**.

---

### Phase 1 — Explore
*Think hard* and spin up ≤ 6 sub-agents (one per directory bucket).  
Each agent produces `explore-<bucket>.md` in `/shared/coordination/`.

**Explore Output Template**
```markdown
## Explore Output
**File**: `path/to/file.ts`
**Purpose**: One-line description
**Key Patterns**: • pattern 1 • pattern 2
**Integration Notes**: Relevance to task

After all return, aggregate highlights into `/shared/coordination/explore_summary.md`, then echo top findings.

<!-- CONFIRM EXPLORE BEFORE PLAN -->

---

## Phase 2 — Plan

- Launch sub-agents to draft plan segments (tests, refactor, dependencies, etc.).
- Each sub-agent saves its segment to `/shared/deployment-plans/plan-<agent-name>.md`.
- When all segments are in, optionally merge key points into `/shared/deployment-plans/plan_master.md`.
- Ask clarifying questions if blockers arise; commit the plan artefacts.

---

## Phase 3 — Write Tests

- Spawn component-focused sub-agents to create failing tests under `/shared/coordination/tests/`.
- Run the project test runner; store red log as `/shared/reports/red_test_log.txt`.
- Commit tests.

<!-- CONFIRM TESTS BEFORE CODE -->

---

## Phase 4 — Code to Pass Tests

- Fork sub-agents per component; implement minimal code to go green.
- Run linter / formatter; save `/shared/reports/lint_results.txt`.
- Commit implementation.

---

## Phase 5 — Refactor

- Launch review sub-agents (clarity, performance, security).
- Apply safe edits; rely on test suite; commit refactor.

---

## Phase 6 — Validate

*Entry point for `--validate-only`*

Parallel validation sub-agents:

1. Full unit / integration tests
2. UX checks (Puppeteer) - user credentials are in .env
3. Static analysis

- Save artefacts to `/shared/reports/validation/`.
- On failure, loop to the following tools: Plan, ultrathink, mcp__context7__*, mcp__zen__*.
- Summarize validation in ≤ 1200 tokens.

---

## Phase 7 — Write-Up

- Collect `plan_master.md` (or individual plan files), commit hashes, coverage, screenshots.
- Generate `/shared/reports/pr_description.md`; present summary in chat.

**Return:** `OK` on success, else `FAIL: <reason>`.

---

## Context
- Agent context file: !`cat agent_context.json 2>/dev/null || echo "No agent context found"`
- Files to work on: !`cat files_to_work_on.txt 2>/dev/null || echo "No file list found"`
- Validation checklist: !`cat validation_checklist.txt 2>/dev/null || echo "No checklist found"`
- Test contracts: !`cat test_contracts.txt 2>/dev/null || echo "No test contracts"`
- Current directory: !`pwd`
- Git branch: !`git branch --show-current 2>/dev/null || echo "Not in git repo"`
- Agent role: Determined dynamically from agentRole field in context
- Focus area: Extracted from focusArea field for specialized work
- Success criteria: All validation checklist items marked complete
- Work approach: Systematic, checklist-driven development