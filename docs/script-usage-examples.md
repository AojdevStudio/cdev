# Script Usage Examples

This guide provides practical examples for using each of the 14 Python scripts in the parallel development system.

## Table of Contents

1. [Linear Integration Scripts](#linear-integration-scripts)
2. [Agent Management Scripts](#agent-management-scripts)
3. [Workflow Validation Scripts](#workflow-validation-scripts)
4. [Publishing Scripts](#publishing-scripts)
5. [Development Tools](#development-tools)

---

## Linear Integration Scripts

### cache-linear-issue.py

Fetches and caches Linear issue data for offline processing.

```bash
# Basic usage - cache a Linear issue
./scripts/python/cache-linear-issue.py LINEAR-123

# With custom cache directory
./scripts/python/cache-linear-issue.py LINEAR-123 --cache-dir /tmp/linear-cache

# Output as YAML to file
./scripts/python/cache-linear-issue.py LINEAR-123 --output-format yaml > issue.yaml

# Using environment variable for API key
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
./scripts/python/cache-linear-issue.py LINEAR-123

# Help and options
./scripts/python/cache-linear-issue.py --help
```

**Example Output:**
```yaml
issue:
  id: LINEAR-123
  title: "Implement user authentication system"
  description: "Add JWT-based authentication with refresh tokens"
  state: "In Progress"
  priority: 2
  labels:
    - backend
    - security
  assignee:
    name: "John Doe"
    email: "john@example.com"
  created_at: "2024-01-10T10:00:00Z"
  updated_at: "2024-01-12T15:30:00Z"
cached_at: "2024-01-12T18:00:00Z"
cache_path: ".cache/linear-issues/LINEAR-123.yaml"
```

---

## Agent Management Scripts

### spawn-agents.py

Creates parallel agent worktrees from a deployment plan.

```bash
# Basic usage - spawn agents from deployment plan
./scripts/python/spawn-agents.py deployment-plan.yaml

# Specify workspace directory
./scripts/python/spawn-agents.py deployment-plan.yaml --workspace-dir ./workspaces

# Dry run to see what would be created
./scripts/python/spawn-agents.py deployment-plan.yaml --dry-run

# Force recreation of existing worktrees
./scripts/python/spawn-agents.py deployment-plan.yaml --force

# YAML output for automation
./scripts/python/spawn-agents.py deployment-plan.yaml --output-format yaml
```

**Example Deployment Plan (deployment-plan.yaml):**
```yaml
task:
  id: "LINEAR-123"
  title: "Implement authentication system"
agents:
  - agent_id: "auth_backend"
    role: "Backend authentication implementation"
    focus_area: "JWT tokens and user management"
    branch_name: "feature/auth-backend"
    files_to_create:
      - "src/auth/jwt.service.ts"
      - "src/auth/user.service.ts"
    
  - agent_id: "auth_frontend"
    role: "Frontend authentication UI"
    focus_area: "Login/register forms and token management"
    branch_name: "feature/auth-frontend"
    files_to_create:
      - "src/components/LoginForm.tsx"
      - "src/components/RegisterForm.tsx"
```

**Example Output:**
```
✓ Created worktree: workspaces/auth_backend (branch: feature/auth-backend)
✓ Created worktree: workspaces/auth_frontend (branch: feature/auth-frontend)
✓ Generated agent contexts in each workspace

Summary:
• Agents created: 2
• Base branch: main
• Workspace: ./workspaces
```

### monitor-agents.py

Monitors the status of all active agents.

```bash
# One-time status check
./scripts/python/monitor-agents.py

# Continuous monitoring (updates every 5 seconds)
./scripts/python/monitor-agents.py --watch

# Custom update interval
./scripts/python/monitor-agents.py --watch --interval 10

# Check specific workspace
./scripts/python/monitor-agents.py --workspace-dir ./custom-workspaces

# Filter by status
./scripts/python/monitor-agents.py --filter in-progress

# YAML output for CI/CD
./scripts/python/monitor-agents.py --output-format yaml
```

**Example Output (Console):**
```
╭─────────────────── Agent Status Overview ───────────────────╮
│                                                             │
│ Total Agents: 4                                             │
│ ✓ Completed: 2  ⚡ In Progress: 1  ⏳ Ready: 1              │
│                                                             │
╰─────────────────────────────────────────────────────────────╯

┏━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Agent          ┃ Status        ┃ Progress  ┃ Branch                         ┃
┡━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━╇━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ auth_backend   │ ✓ Completed   │ 100%      │ feature/auth-backend           │
│ auth_frontend  │ ⚡ In Progress │ 75%       │ feature/auth-frontend          │
│ auth_tests     │ ✓ Completed   │ 100%      │ feature/auth-tests             │
│ auth_docs      │ ⏳ Ready      │ 0%        │ feature/auth-docs              │
└────────────────┴───────────────┴───────────┴────────────────────────────────┘

Next Actions:
• Complete auth_frontend agent (1 task remaining)
• Start auth_docs agent
• Run integration tests after auth_frontend completion
```

### agent-commit.py

Commits and integrates completed agent work.

```bash
# Basic commit for an agent
./scripts/python/agent-commit.py ./workspaces/auth_backend

# Custom commit message
./scripts/python/agent-commit.py ./workspaces/auth_backend \
  --message "feat(auth): implement JWT service with refresh tokens"

# Skip validation checks (use with caution)
./scripts/python/agent-commit.py ./workspaces/auth_backend --skip-validation

# Dry run to see what would happen
./scripts/python/agent-commit.py ./workspaces/auth_backend --dry-run

# Auto-merge after commit
./scripts/python/agent-commit.py ./workspaces/auth_backend --auto-merge

# YAML output
./scripts/python/agent-commit.py ./workspaces/auth_backend --output-format yaml
```

**Example Validation Output:**
```
Validating agent: auth_backend
✓ All validation checklist items completed (5/5)
✓ All tests passing
✓ No merge conflicts detected
✓ Code review checks passed

Commit Summary:
• Branch: feature/auth-backend
• Files changed: 8
• Insertions: 245
• Deletions: 12
• Commit message: "feat(auth): implement JWT service [LINEAR-123]"

Ready to commit? [y/N]:
```

---

## Workflow Validation Scripts

### validate-parallel-work.py

Validates that all agent deliverables meet requirements.

```bash
# Validate all agents in workspace
./scripts/python/validate-parallel-work.py

# Validate specific workspace
./scripts/python/validate-parallel-work.py --workspace-dir ./workspaces

# Detailed validation report
./scripts/python/validate-parallel-work.py --detailed

# Check specific validation types
./scripts/python/validate-parallel-work.py --checks tests,lint,types

# Output validation report as YAML
./scripts/python/validate-parallel-work.py --output-format yaml > validation-report.yaml
```

**Example Output:**
```
Validation Report
═════════════════

auth_backend:
  ✓ Tests: All 15 tests passing
  ✓ Linting: No issues found
  ✓ Type Check: No type errors
  ✓ Coverage: 92% (threshold: 80%)
  ✓ Checklist: 5/5 items completed

auth_frontend:
  ✓ Tests: All 8 tests passing
  ⚠ Linting: 2 warnings (non-critical)
  ✓ Type Check: No type errors
  ✓ Coverage: 88% (threshold: 80%)
  ⚡ Checklist: 4/5 items completed

Overall Status: READY (with warnings)
```

### integrate-parallel-work.py

Merges all completed agent work into the main branch.

```bash
# Basic integration
./scripts/python/integrate-parallel-work.py

# Specify integration order
./scripts/python/integrate-parallel-work.py --order auth_backend,auth_frontend,auth_tests

# Skip specific agents
./scripts/python/integrate-parallel-work.py --skip auth_docs

# Force integration despite warnings
./scripts/python/integrate-parallel-work.py --force

# Dry run
./scripts/python/integrate-parallel-work.py --dry-run

# Custom merge strategy
./scripts/python/integrate-parallel-work.py --strategy squash
```

**Example Integration Flow:**
```
Integration Plan:
1. auth_backend → main
2. auth_frontend → main  
3. auth_tests → main

Pre-flight Checks:
✓ All agents validated
✓ No merge conflicts detected
✓ CI/CD checks passed

Proceed with integration? [y/N]: y

Integrating auth_backend...
✓ Merged successfully
✓ Tests passing on main

Integrating auth_frontend...
✓ Merged successfully
✓ Tests passing on main

Integrating auth_tests...
✓ Merged successfully
✓ All integration tests passing

Integration Summary:
• Agents integrated: 3/3
• Total commits: 45
• Files changed: 23
• All tests passing ✓
```

### resolve-conflicts.py

Interactive conflict resolution for parallel development.

```bash
# Check for conflicts across all agents
./scripts/python/resolve-conflicts.py

# Resolve conflicts for specific agent
./scripts/python/resolve-conflicts.py --agent auth_frontend

# Auto-resolve using strategy
./scripts/python/resolve-conflicts.py --strategy ours  # or theirs, union

# Interactive mode (default)
./scripts/python/resolve-conflicts.py --interactive
```

**Example Interactive Resolution:**
```
Conflict detected in: src/auth/config.ts
═══════════════════════════════════════

<<<<<<< auth_backend
const TOKEN_EXPIRY = 3600; // 1 hour
=======
const TOKEN_EXPIRY = 7200; // 2 hours
>>>>>>> auth_frontend

How would you like to resolve this conflict?
1. Keep auth_backend version (3600)
2. Keep auth_frontend version (7200)
3. Edit manually
4. View more context

Choice [1-4]: 2
✓ Resolved: keeping auth_frontend version

[2 more conflicts to resolve...]
```

---

## Publishing Scripts

### prepublish.py

Pre-publication validation and preparation.

```bash
# Basic pre-publish check
./scripts/python/prepublish.py

# Allow uncommitted changes
ALLOW_DIRTY=1 ./scripts/python/prepublish.py

# Force publish of v1.0.0
FORCE_PUBLISH=1 ./scripts/python/prepublish.py

# Skip specific checks
./scripts/python/prepublish.py --skip-checks tests,lint

# YAML output
./scripts/python/prepublish.py --output-format yaml
```

**Example Output:**
```
Pre-publish Validation
═════════════════════

Package: @aojdevstudio/cdev
Version: 1.0.1
Registry: https://registry.npmjs.org/

Checks:
✓ Git repository is clean
✓ On main branch
✓ All tests passing (42/42)
✓ No lint errors
✓ Build successful
✓ Package.json valid
✓ README.md present
✓ LICENSE file present
✓ No sensitive files in package

Ready to publish! Run: npm publish
```

### postpublish.py

Post-publication verification and cleanup.

```bash
# Basic post-publish verification
./scripts/python/postpublish.py

# Skip NPM verification (for testing)
./scripts/python/postpublish.py --skip-verification

# Custom registry
./scripts/python/postpublish.py --registry https://custom.registry.com

# With specific package version
./scripts/python/postpublish.py --version 1.0.1

# YAML output
./scripts/python/postpublish.py --output-format yaml
```

**Example Output:**
```
Post-publish Verification
════════════════════════

✓ Package published to NPM: @aojdevstudio/cdev@1.0.1
✓ Package accessible via NPM API
✓ Tarball downloadable
✓ Global installation test passed

Testing npx execution...
✓ npx @aojdevstudio/cdev --version works

Cleanup:
✓ Removed temporary test directory
✓ Updated package-lock.json
✓ Tagged release: v1.0.1

Publication successful! 🎉
```

### security-check.py

Security validation for package publication.

```bash
# Basic security check
./scripts/python/security-check.py

# Detailed scan with patterns
./scripts/python/security-check.py --detailed

# Check specific paths
./scripts/python/security-check.py --paths src/ scripts/

# Custom ignore patterns
./scripts/python/security-check.py --ignore "*.test.js,*.md"

# YAML output for CI/CD
./scripts/python/security-check.py --output-format yaml
```

**Example Output:**
```
Security Check Report
════════════════════

Scanning for sensitive data...
✓ No hardcoded API keys found
✓ No AWS credentials detected
✓ No private keys found
✓ No database passwords detected

Checking .gitignore...
✓ .env files properly ignored
✓ node_modules ignored
✓ Private keys patterns present

Checking .npmignore...
✓ Test files excluded
✓ Development configs excluded
✓ CI/CD files excluded

Package Security:
✓ No vulnerable dependencies (npm audit)
✓ Package.json has proper license
✓ No suspicious scripts in package.json

Status: PASSED ✓
```

---

## Development Tools

### test-locally.py

Automated local testing workflow.

```bash
# Run all tests
./scripts/python/test-locally.py

# Run specific test suites
./scripts/python/test-locally.py --suites unit,integration

# With coverage report
./scripts/python/test-locally.py --coverage

# Watch mode
./scripts/python/test-locally.py --watch

# Parallel test execution
./scripts/python/test-locally.py --parallel

# YAML report
./scripts/python/test-locally.py --output-format yaml > test-report.yaml
```

**Example Output:**
```
Local Test Suite
═══════════════

Running: Unit Tests
✓ Config tests (8 passed)
✓ Agent tests (12 passed)
✓ Utils tests (6 passed)

Running: Integration Tests
✓ Workflow tests (4 passed)
✓ CLI tests (7 passed)

Running: E2E Tests
✓ Full workflow test (1 passed)

Coverage Report:
• Statements: 92.5%
• Branches: 88.2%
• Functions: 95.1%
• Lines: 91.8%

Total: 38 tests passed in 4.2s
```

### deploy.py

Deployment automation script.

```bash
# Deploy to staging
./scripts/python/deploy.py staging

# Deploy to production with specific version
./scripts/python/deploy.py production --version 1.0.1

# Dry run
./scripts/python/deploy.py production --dry-run

# Skip health checks
./scripts/python/deploy.py staging --skip-health-check

# Rollback if issues
./scripts/python/deploy.py production --rollback
```

### intelligent-agent-generator.py

AI-powered agent generation from requirements.

```bash
# Interactive mode
./scripts/python/intelligent-agent-generator.py

# With requirement string
./scripts/python/intelligent-agent-generator.py "Add user profile management"

# With Linear issue
./scripts/python/intelligent-agent-generator.py --linear-issue LINEAR-456

# With codebase context
./scripts/python/intelligent-agent-generator.py \
  --codebase-file codebase-structure.yaml \
  --test-file test-structure.yaml \
  "Implement payment processing"

# Specify number of agents
./scripts/python/intelligent-agent-generator.py \
  --max-agents 3 \
  "Refactor authentication system"

# YAML output
./scripts/python/intelligent-agent-generator.py \
  --output-format yaml \
  "Add real-time notifications" > deployment-plan.yaml
```

**Example Generated Plan:**
```yaml
deployment_plan:
  task:
    requirement: "Add real-time notifications"
    complexity: "moderate"
    estimated_time: "2-3 days"
  
  agents:
    - agent_id: "notification_backend"
      role: "WebSocket server and notification service"
      focus_area: "Real-time message delivery"
      skills_required: ["Node.js", "WebSockets", "Redis"]
      
    - agent_id: "notification_frontend"  
      role: "UI components for notifications"
      focus_area: "Toast messages and notification center"
      skills_required: ["React", "CSS", "WebSocket client"]
      
    - agent_id: "notification_tests"
      role: "Test suite for notification system"
      focus_area: "Unit and integration tests"
      skills_required: ["Jest", "Testing Library"]
```

### decompose-parallel.py

Decomposes tasks into parallel agent specifications.

```bash
# From Linear issue
./scripts/python/decompose-parallel.py LINEAR-123

# From YAML file
./scripts/python/decompose-parallel.py task-description.yaml

# From text description
./scripts/python/decompose-parallel.py --text "Build a shopping cart feature"

# With agent limit
./scripts/python/decompose-parallel.py LINEAR-123 --max-agents 4

# Interactive refinement
./scripts/python/decompose-parallel.py LINEAR-123 --interactive

# Output to file
./scripts/python/decompose-parallel.py LINEAR-123 > deployment-plan.yaml
```

## Common Patterns

### Chaining Scripts

Complete workflow example:

```bash
# 1. Cache Linear issue
./scripts/python/cache-linear-issue.py LINEAR-123

# 2. Decompose into agents
./scripts/python/decompose-parallel.py LINEAR-123

# 3. Spawn agent worktrees
./scripts/python/spawn-agents.py deployment-plan.yaml

# 4. Monitor progress
./scripts/python/monitor-agents.py --watch

# 5. Validate completed work
./scripts/python/validate-parallel-work.py

# 6. Integrate changes
./scripts/python/integrate-parallel-work.py
```

### Automation with YAML Output

```bash
# Generate deployment plan
./scripts/python/decompose-parallel.py LINEAR-123 \
  --output-format yaml > plan.yaml

# Spawn agents and capture output
./scripts/python/spawn-agents.py plan.yaml \
  --output-format yaml > spawn-result.yaml

# Check status programmatically
status=$(./scripts/python/monitor-agents.py --output-format yaml)
echo "$status" | yq '.summary.completed'
```

### Error Handling in Scripts

```bash
# Check exit codes
./scripts/python/validate-parallel-work.py
if [ $? -eq 0 ]; then
  echo "Validation passed"
  ./scripts/python/integrate-parallel-work.py
else
  echo "Validation failed"
  exit 1
fi
```

## Tips and Best Practices

1. **Always use `--help`** to see available options
2. **Use `--dry-run`** when available to preview actions
3. **Leverage YAML output** for automation and CI/CD
4. **Check exit codes** in scripts (0 = success, non-zero = failure)
5. **Use environment variables** for API keys and configuration
6. **Monitor agents regularly** during development
7. **Validate before integrating** to catch issues early

## Next Steps

- Review [YAML Output Formats](yaml-output-formats.md) for detailed schema information
- See [Troubleshooting Guide](troubleshooting-python-scripts.md) for common issues
- Check [Migration Guide](migration-guide.md) if transitioning from old scripts