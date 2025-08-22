---
allowed-tools: Bash, Task
description: Monitor GitHub Actions workflow runs and delegate failures to appropriate sub-agents
---

# GitHub Actions Monitor

Monitor GitHub Actions workflow runs and automatically delegate failed workflows to specialized sub-agents for resolution.

**variables:**
RunLimit: $ARGUMENTS

**Usage Examples:**

- `/gh-actions-monitor` - Show last 10 workflow runs
- `/gh-actions-monitor 20` - Show last 20 workflow runs
- `/gh-actions-monitor fix` - Analyze failures and delegate fixes

```yaml
gh_actions_monitor_protocol:
  instructions:
    - step: 1
      action: "Fetch recent workflow runs using GitHub CLI"
      details: "Use `gh run list --limit ${RunLimit:-10}` to get recent runs"
    
    - step: 2
      action: "Identify failed or cancelled workflows"
      details: "Filter runs with failure or cancelled status"
    
    - step: 3
      action: "Analyze failure patterns"
      details: "For each failed run, use `gh run view <run-id>` to get details"
    
    - step: 4
      action: "Categorize failures by type"
      details: |
        - Test failures → test-automator
        - Build/compilation errors → language-specific agents
        - Linting issues → code-reviewer
        - CI configuration → github-actions-specialist
        - Security scans → quality-guardian
    
    - step: 5
      action: "Delegate to appropriate sub-agents"
      details: "Use the Task tool to spawn specialized agents for each failure type"

  workflow_analysis:
    failure_categories:
      test_failures:
        patterns: ["Test failed", "test suite", "FAIL", "assertion error"]
        agent: "test-automator"
        action: "Fix failing tests and update test suites"
      
      build_errors:
        patterns: ["build failed", "compilation error", "module not found"]
        agent: "javascript-craftsman or typescript-expert or python-pro"
        action: "Resolve build/compilation issues"
      
      lint_violations:
        patterns: ["ESLint", "Prettier", "linting", "code style"]
        agent: "code-reviewer"
        action: "Fix linting violations and code style issues"
      
      ci_config_issues:
        patterns: ["workflow syntax", "invalid workflow", "action not found"]
        agent: "github-actions-specialist"
        action: "Fix GitHub Actions workflow configuration"
      
      security_issues:
        patterns: ["security", "vulnerability", "audit", "CVE"]
        agent: "quality-guardian"
        action: "Address security vulnerabilities"

  commands:
    list_runs: "gh run list --limit ${RunLimit:-10}"
    view_run: "gh run view <run-id>"
    view_logs: "gh run view <run-id> --log"
    list_failed: "gh run list --status failed --limit ${RunLimit:-10}"
    download_logs: "gh run download <run-id>"

  delegation_templates:
    - trigger: "test failures detected"
      action: |
        Use the test-automator sub-agent to analyze and fix the failing tests.
        Provide the workflow logs and failure details.
    
    - trigger: "build errors detected"
      action: |
        Use the appropriate language agent (javascript-craftsman, typescript-expert, or python-pro)
        to resolve compilation and build issues.
    
    - trigger: "workflow configuration issues"
      action: |
        Use the github-actions-specialist sub-agent to fix the GitHub Actions workflow files.
        Include the error messages and current workflow configuration.

  output_format:
    dashboard:
      - "Workflow run summary with status indicators"
      - "Failed runs grouped by failure type"
      - "Recommended actions for each failure"
    
    delegation_report:
      - "Agents spawned for each issue"
      - "Expected resolution time"
      - "Follow-up actions required"
```

## Instructions

- Run `gh run list --limit ${RunLimit:-10}` to fetch recent workflow runs
- Identify failed or cancelled workflows from the output
- For each failed workflow, run `gh run view <run-id>` to get detailed failure information
- Analyze the failure logs to categorize the type of issue
- Based on the failure type, use the Task tool to spawn the appropriate sub-agent:
  - **Test failures**: Use the test-automator sub-agent to fix failing tests
  - **Build errors**: Use the javascript-craftsman, typescript-expert, or python-pro sub-agent based on the language
  - **Linting issues**: Use the code-reviewer sub-agent to fix code style violations
  - **CI configuration**: Use the github-actions-specialist sub-agent to fix workflow files
  - **Security issues**: Use the quality-guardian sub-agent to address vulnerabilities
- Provide each sub-agent with the specific failure context and logs
- Track which issues have been delegated for fixing

## Context

GitHub Actions workflows can fail for various reasons. This command helps identify failures and automatically delegates them to specialized agents who can fix the specific type of issue. The command uses the GitHub CLI which must be authenticated:

```bash
# Check GitHub CLI authentication
gh auth status

# Common workflow commands
gh run list --limit 10           # List recent runs
gh run view <run-id>            # View run details
gh run view <run-id> --log      # View full logs
gh run list --status failed     # List only failed runs
```

## Output

- **Workflow Dashboard**: Summary of recent runs with status indicators (✓ success, ✗ failed, ○ cancelled)
- **Failure Analysis**: Categorized list of failures with recommended fixes
- **Delegation Report**: List of sub-agents spawned to address each issue
- **Resolution Tracking**: Status of fixes being implemented by sub-agents