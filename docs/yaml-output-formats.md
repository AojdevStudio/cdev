# YAML Output Formats

This document describes the YAML output formats used by all Python scripts in the parallel development system. All scripts have migrated from JSON to YAML for better readability and consistency.

## Overview

All scripts support YAML output via the `--output-format yaml` flag:

```bash
./scripts/python/script-name.py --output-format yaml
```

YAML benefits over JSON:
- **Human-readable**: Multi-line strings, comments, cleaner syntax
- **Type preservation**: Maintains dates, numbers, booleans correctly
- **Better for configs**: Ideal for deployment plans and agent contexts
- **Compact**: Less verbose than JSON

## Common YAML Structures

### Error Format

All scripts use a consistent error format:

```yaml
error:
  type: "ValidationError"
  message: "Workspace not found"
  details:
    workspace_path: "/workspaces/auth_backend"
    suggestion: "Run 'cdev spawn' to create agent workspaces"
  timestamp: "2024-01-12T18:30:00Z"
  exit_code: 1
```

### Success Format

Standard success response:

```yaml
success: true
message: "Operation completed successfully"
timestamp: "2024-01-12T18:30:00Z"
details:
  # Script-specific details
```

## Script-Specific Formats

### cache-linear-issue.py

Linear issue cache format:

```yaml
issue:
  id: "LINEAR-123"
  identifier: "PROJ-123"
  title: "Implement user authentication system"
  description: |
    As a user, I want to be able to log in and log out
    so that I can access my personal data securely.
    
    Acceptance Criteria:
    - JWT-based authentication
    - Refresh token support
    - Secure password hashing
    - Session management
  state:
    name: "In Progress"
    type: "started"
    color: "#4A90E2"
  priority: 2  # 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
  priorityLabel: "High"
  estimate: 8  # Story points
  
  assignee:
    id: "user_abc123"
    name: "John Doe"
    email: "john.doe@example.com"
    avatarUrl: "https://linear.app/avatars/user_abc123.jpg"
  
  creator:
    id: "user_def456"
    name: "Jane Smith"
    email: "jane.smith@example.com"
  
  labels:
    - id: "label_1"
      name: "backend"
      color: "#00C853"
    - id: "label_2"
      name: "security"
      color: "#FF5252"
  
  project:
    id: "proj_789"
    name: "Q1 Features"
    icon: "🚀"
  
  team:
    id: "team_xyz"
    name: "Engineering"
    key: "ENG"
  
  cycle:
    id: "cycle_123"
    name: "Sprint 23"
    startsAt: "2024-01-08T00:00:00Z"
    endsAt: "2024-01-22T00:00:00Z"
  
  parent:  # Optional, for sub-issues
    id: "LINEAR-100"
    title: "Epic: Authentication System"
  
  children:  # Sub-tasks
    - id: "LINEAR-124"
      title: "Design authentication API"
      state: "Done"
    - id: "LINEAR-125"
      title: "Implement JWT service"
      state: "In Progress"
  
  comments:
    - id: "comment_1"
      body: "Let's use bcrypt for password hashing"
      user:
        name: "Alice Johnson"
      createdAt: "2024-01-10T14:30:00Z"
  
  attachments:
    - id: "attach_1"
      title: "Authentication Flow Diagram"
      url: "https://linear.app/attachments/auth-flow.png"
      metadata:
        mimeType: "image/png"
        size: 125000
  
  relations:
    blocks:
      - id: "LINEAR-120"
        title: "Database schema design"
    blockedBy: []
    relates:
      - id: "LINEAR-130"
        title: "Frontend login UI"
  
  customFields:
    techStack: "Node.js, JWT, PostgreSQL"
    riskLevel: "Medium"
  
  createdAt: "2024-01-05T10:00:00Z"
  updatedAt: "2024-01-12T15:30:00Z"
  startedAt: "2024-01-08T09:00:00Z"
  completedAt: null
  canceledAt: null
  autoClosedAt: null
  autoArchivedAt: null
  
  url: "https://linear.app/company/issue/LINEAR-123"
  branchName: "feature/linear-123-user-authentication"

metadata:
  cached_at: "2024-01-12T18:30:00Z"
  cache_path: ".cache/linear-issues/LINEAR-123.yaml"
  cache_version: "1.0"
  expires_at: "2024-01-13T18:30:00Z"  # 24-hour cache
```

### spawn-agents.py

Agent creation result format:

```yaml
spawn_result:
  success: true
  deployment_plan_path: "deployment-plan.yaml"
  workspace_root: "./workspaces"
  base_branch: "main"
  timestamp: "2024-01-12T18:30:00Z"
  
  agents_created:
    - agent_id: "auth_backend"
      worktree_path: "./workspaces/auth_backend"
      branch_name: "feature/auth-backend"
      context_file: "./workspaces/auth_backend/agent_context.yaml"
      status: "created"
      
    - agent_id: "auth_frontend"
      worktree_path: "./workspaces/auth_frontend"
      branch_name: "feature/auth-frontend"
      context_file: "./workspaces/auth_frontend/agent_context.yaml"
      status: "created"
  
  summary:
    total_agents: 2
    successfully_created: 2
    failed: 0
    skipped: 0
  
  validation:
    all_branches_created: true
    all_contexts_generated: true
    no_conflicts: true
```

### monitor-agents.py

Agent status monitoring format:

```yaml
agent_status:
  timestamp: "2024-01-12T18:30:00Z"
  workspace_root: "./workspaces"
  
  agents:
    - agent_id: "auth_backend"
      status: "completed"
      progress_percentage: 100
      branch: "feature/auth-backend"
      worktree_path: "./workspaces/auth_backend"
      
      validation_checklist:
        total_items: 5
        completed_items: 5
        items:
          - description: "Implement JWT service"
            completed: true
          - description: "Add user repository"
            completed: true
          - description: "Create auth middleware"
            completed: true
          - description: "Write unit tests"
            completed: true
          - description: "Update API documentation"
            completed: true
      
      deliverables:
        files_created:
          - "src/auth/jwt.service.ts"
          - "src/auth/user.repository.ts"
        files_modified:
          - "src/app.module.ts"
          - "package.json"
        tests_added: 12
        
      git_status:
        clean: true
        ahead_of_main: 8
        behind_main: 0
        has_uncommitted_changes: false
        
    - agent_id: "auth_frontend"
      status: "in_progress"
      progress_percentage: 75
      branch: "feature/auth-frontend"
      worktree_path: "./workspaces/auth_frontend"
      
      validation_checklist:
        total_items: 4
        completed_items: 3
        items:
          - description: "Create login form"
            completed: true
          - description: "Create register form"
            completed: true
          - description: "Add token management"
            completed: true
          - description: "Write E2E tests"
            completed: false
            
      current_task: "Writing E2E tests for authentication flow"
      estimated_completion: "2024-01-12T20:00:00Z"
  
  summary:
    total_agents: 4
    by_status:
      completed: 2
      in_progress: 1
      ready: 1
      blocked: 0
    overall_progress: 68.75  # Percentage
    
  recommendations:
    - priority: "high"
      action: "Complete E2E tests for auth_frontend"
      agent: "auth_frontend"
      
    - priority: "medium"
      action: "Start auth_docs agent"
      agent: "auth_docs"
      
    - priority: "low"
      action: "Run integration tests after auth_frontend completion"
      agents: ["auth_backend", "auth_frontend"]
```

### agent-commit.py

Commit result format:

```yaml
commit_result:
  success: true
  agent_id: "auth_backend"
  worktree_path: "./workspaces/auth_backend"
  
  validation:
    all_checklist_items_complete: true
    tests_passing: true
    no_lint_errors: true
    no_type_errors: true
    no_merge_conflicts: true
  
  commit_details:
    sha: "a1b2c3d4e5f6"
    branch: "feature/auth-backend"
    message: |
      feat(auth): implement JWT authentication service
      
      - Add JWT service with token generation and validation
      - Implement user repository with PostgreSQL
      - Create auth middleware for route protection
      - Add comprehensive unit tests
      
      LINEAR-123
    author:
      name: "John Doe"
      email: "john@example.com"
    timestamp: "2024-01-12T18:30:00Z"
  
  changes:
    files_changed: 8
    insertions: 245
    deletions: 12
    files:
      - path: "src/auth/jwt.service.ts"
        additions: 120
        deletions: 0
      - path: "src/auth/user.repository.ts"
        additions: 85
        deletions: 0
      - path: "src/auth/auth.middleware.ts"
        additions: 40
        deletions: 0
  
  merge_status:
    merged_to_main: true
    merge_commit: "b2c3d4e5f6g7"
    conflicts_resolved: false  # No conflicts
    
  cleanup:
    worktree_removed: true
    branch_deleted_locally: true
    branch_deleted_remote: false  # Kept for PR
```

### validate-parallel-work.py

Validation report format:

```yaml
validation_report:
  timestamp: "2024-01-12T18:30:00Z"
  workspace_root: "./workspaces"
  
  agents:
    - agent_id: "auth_backend"
      status: "passed"
      
      checks:
        checklist:
          passed: true
          total_items: 5
          completed_items: 5
          
        tests:
          passed: true
          total: 15
          passing: 15
          failing: 0
          skipped: 0
          duration: "2.3s"
          
        linting:
          passed: true
          errors: 0
          warnings: 0
          
        type_checking:
          passed: true
          errors: 0
          
        coverage:
          passed: true
          percentage: 92.5
          threshold: 80
          uncovered_lines: 12
          
        security:
          passed: true
          vulnerabilities: 0
          
      deliverables:
        expected_files_created: 3
        actual_files_created: 3
        missing_files: []
        
    - agent_id: "auth_frontend"
      status: "passed_with_warnings"
      
      checks:
        checklist:
          passed: false
          total_items: 4
          completed_items: 3
          incomplete:
            - "Write E2E tests"
            
        tests:
          passed: true
          total: 8
          passing: 8
          
        linting:
          passed: true
          errors: 0
          warnings: 2
          warning_details:
            - file: "src/components/LoginForm.tsx"
              line: 45
              message: "Missing explicit return type"
              
  summary:
    total_agents: 4
    passed: 2
    passed_with_warnings: 1
    failed: 1
    overall_status: "ready_with_warnings"
    
  recommendations:
    - severity: "high"
      message: "Complete E2E tests for auth_frontend before integration"
      agent: "auth_frontend"
      
    - severity: "low"
      message: "Address linting warnings in auth_frontend"
      agent: "auth_frontend"
```

### integrate-parallel-work.py

Integration result format:

```yaml
integration_result:
  success: true
  timestamp: "2024-01-12T18:30:00Z"
  base_branch: "main"
  
  integration_plan:
    - agent_id: "auth_backend"
      order: 1
      status: "completed"
      
    - agent_id: "auth_frontend"
      order: 2
      status: "completed"
      
    - agent_id: "auth_tests"
      order: 3
      status: "completed"
  
  agents_integrated:
    - agent_id: "auth_backend"
      branch: "feature/auth-backend"
      merge_commit: "c3d4e5f6g7h8"
      strategy: "merge"
      conflicts: false
      
      commits_integrated: 8
      files_changed: 12
      insertions: 245
      deletions: 12
      
    - agent_id: "auth_frontend"
      branch: "feature/auth-frontend"
      merge_commit: "d4e5f6g7h8i9"
      strategy: "merge"
      conflicts: false
      
      commits_integrated: 6
      files_changed: 8
      insertions: 180
      deletions: 5
  
  validation:
    all_tests_passing: true
    no_conflicts: true
    ci_checks_passed: true
    
  summary:
    total_planned: 3
    successfully_integrated: 3
    failed: 0
    total_commits: 21
    total_files_changed: 23
    total_insertions: 520
    total_deletions: 25
    
  cleanup:
    worktrees_removed: 3
    branches_deleted: 0  # Kept for history
```

### resolve-conflicts.py

Conflict resolution format:

```yaml
conflict_resolution:
  timestamp: "2024-01-12T18:30:00Z"
  
  conflicts_found:
    - file: "src/config/auth.config.ts"
      type: "merge_conflict"
      agents_involved:
        - "auth_backend"
        - "auth_frontend"
      
      conflict_regions:
        - start_line: 15
          end_line: 20
          description: "Different token expiry values"
          
      resolution:
        strategy: "manual"
        chosen_version: "auth_frontend"
        resolved_by: "user"
        
    - file: "package.json"
      type: "dependency_conflict"
      agents_involved:
        - "auth_backend"
        - "auth_tests"
        
      conflict_details:
        dependency: "jsonwebtoken"
        version_backend: "^9.0.0"
        version_tests: "^8.5.1"
        
      resolution:
        strategy: "use_latest"
        resolved_version: "^9.0.0"
  
  summary:
    total_conflicts: 2
    resolved: 2
    resolution_strategies:
      manual: 1
      use_latest: 1
    all_conflicts_resolved: true
```

### Publishing Script Formats

#### prepublish.py

```yaml
prepublish_validation:
  timestamp: "2024-01-12T18:30:00Z"
  
  package_info:
    name: "@aojdevstudio/cdev"
    version: "1.0.1"
    description: "AI-Powered Development Orchestration System"
    main: "bin/cli.js"
    license: "CC-BY-NC-SA-4.0"
    
  checks:
    git_status:
      passed: true
      is_clean: true
      branch: "main"
      
    tests:
      passed: true
      total: 42
      passing: 42
      coverage: 92.5
      
    linting:
      passed: true
      errors: 0
      warnings: 0
      
    build:
      passed: true
      output_exists: true
      size: "125KB"
      
    required_files:
      passed: true
      present:
        - "README.md"
        - "LICENSE"
        - "package.json"
        - "bin/cli.js"
      missing: []
      
    package_json_validation:
      passed: true
      has_name: true
      has_version: true
      has_description: true
      has_main: true
      has_bin: true
      
    version_check:
      passed: true
      current: "1.0.1"
      previous: "1.0.0"
      is_new_version: true
      
  warnings:
    - type: "large_file"
      message: "File 'docs/images/demo.gif' is 2.5MB"
      severity: "low"
      
  summary:
    all_checks_passed: true
    ready_to_publish: true
    total_checks: 7
    passed_checks: 7
    warnings: 1
```

#### postpublish.py

```yaml
postpublish_verification:
  timestamp: "2024-01-12T18:30:00Z"
  
  package_info:
    name: "@aojdevstudio/cdev"
    version: "1.0.1"
    
  npm_verification:
    published: true
    registry_url: "https://registry.npmjs.org/@aojdevstudio/cdev"
    
    api_check:
      accessible: true
      latest_version: "1.0.1"
      
    tarball_check:
      downloadable: true
      size: "125KB"
      integrity: "sha512-..."
      
  installation_test:
    global_install:
      success: true
      command_works: true
      version_matches: true
      
    npx_test:
      success: true
      command: "npx @aojdevstudio/cdev --version"
      output: "1.0.1"
      
  documentation:
    readme_updated: true
    changelog_updated: true
    
  git_operations:
    tag_created: true
    tag_name: "v1.0.1"
    tag_pushed: true
    
  cleanup:
    temp_files_removed: true
    cache_cleared: true
    
  notifications:
    slack_notified: true
    email_sent: true
    
  summary:
    all_verifications_passed: true
    package_accessible: true
    ready_for_use: true
```

#### security-check.py

```yaml
security_report:
  timestamp: "2024-01-12T18:30:00Z"
  
  sensitive_data_scan:
    passed: true
    files_scanned: 156
    
    patterns_checked:
      - type: "api_key"
        pattern: "API_KEY|APIKEY|api_key"
        found: 0
        
      - type: "aws_credentials"
        pattern: "AWS_ACCESS_KEY|AWS_SECRET"
        found: 0
        
      - type: "private_key"
        pattern: "BEGIN RSA PRIVATE KEY"
        found: 0
        
      - type: "password"
        pattern: "password\\s*=\\s*[\"']\\w+[\"']"
        found: 0
        
  gitignore_validation:
    passed: true
    
    required_patterns:
      - pattern: ".env*"
        present: true
      - pattern: "node_modules/"
        present: true
      - pattern: "*.key"
        present: true
      - pattern: "*.pem"
        present: true
        
  npmignore_validation:
    passed: true
    
    excluded_items:
      - "test/"
      - "*.test.js"
      - ".github/"
      - "docs/"
      
  dependency_audit:
    passed: true
    vulnerabilities:
      critical: 0
      high: 0
      moderate: 0
      low: 0
      
  package_json_security:
    passed: true
    
    checks:
      no_install_scripts: true
      no_suspicious_scripts: true
      proper_license: true
      
  summary:
    all_checks_passed: true
    total_issues: 0
    security_score: 100
    ready_for_publication: true
```

### Development Tool Formats

#### test-locally.py

```yaml
test_report:
  timestamp: "2024-01-12T18:30:00Z"
  
  test_suites:
    - name: "Unit Tests"
      passed: true
      tests: 26
      passing: 26
      failing: 0
      duration: "1.8s"
      
    - name: "Integration Tests"
      passed: true
      tests: 11
      passing: 11
      failing: 0
      duration: "3.2s"
      
    - name: "E2E Tests"
      passed: true
      tests: 5
      passing: 5
      failing: 0
      duration: "8.5s"
      
  coverage:
    statements:
      percentage: 92.5
      covered: 1850
      total: 2000
      
    branches:
      percentage: 88.2
      covered: 150
      total: 170
      
    functions:
      percentage: 95.1
      covered: 195
      total: 205
      
    lines:
      percentage: 91.8
      covered: 1836
      total: 2000
      
  summary:
    all_passing: true
    total_tests: 42
    total_duration: "13.5s"
    coverage_threshold_met: true
```

#### intelligent-agent-generator.py

```yaml
generated_deployment_plan:
  metadata:
    generated_at: "2024-01-12T18:30:00Z"
    requirement: "Implement real-time chat feature"
    estimated_complexity: "high"
    estimated_duration: "5-7 days"
    confidence_score: 0.85
    
  task:
    id: "GENERATED-001"
    title: "Implement real-time chat feature"
    description: |
      Implement a real-time chat system with:
      - WebSocket connections
      - Message persistence
      - User presence
      - Typing indicators
      - Read receipts
      
  analysis:
    detected_technologies:
      - "Node.js"
      - "Socket.io"
      - "PostgreSQL"
      - "Redis"
      - "React"
      
    identified_components:
      - "WebSocket server"
      - "Message service"
      - "Chat UI components"
      - "Database schema"
      - "Caching layer"
      
    complexity_factors:
      - "Real-time synchronization"
      - "Scale considerations"
      - "Message ordering"
      - "Offline support"
      
  agents:
    - agent_id: "chat_backend"
      role: "WebSocket server and message handling"
      focus_area: "Real-time message delivery and persistence"
      priority: 1
      
      deliverables:
        files_to_create:
          - "src/chat/websocket.gateway.ts"
          - "src/chat/message.service.ts"
          - "src/chat/presence.service.ts"
        files_to_modify:
          - "src/app.module.ts"
        database_changes:
          - "Create messages table"
          - "Create chat_rooms table"
          
      dependencies: []
      estimated_hours: 16
      required_skills:
        - "WebSocket/Socket.io"
        - "Node.js"
        - "PostgreSQL"
        
    - agent_id: "chat_frontend"
      role: "Chat UI components and client"
      focus_area: "User interface and real-time updates"
      priority: 2
      
      deliverables:
        files_to_create:
          - "src/components/ChatWindow.tsx"
          - "src/components/MessageList.tsx"
          - "src/hooks/useWebSocket.ts"
        files_to_modify:
          - "src/App.tsx"
          
      dependencies: ["chat_backend"]
      estimated_hours: 12
      required_skills:
        - "React"
        - "Socket.io-client"
        - "CSS/Tailwind"
        
    - agent_id: "chat_tests"
      role: "Comprehensive test suite"
      focus_area: "Unit and integration tests"
      priority: 3
      
      deliverables:
        files_to_create:
          - "tests/chat/websocket.test.ts"
          - "tests/chat/message.test.ts"
          - "tests/e2e/chat.test.ts"
          
      dependencies: ["chat_backend", "chat_frontend"]
      estimated_hours: 8
      required_skills:
        - "Jest"
        - "Testing Library"
        - "E2E testing"
        
  integration_strategy:
    order: ["chat_backend", "chat_frontend", "chat_tests"]
    merge_strategy: "sequential"
    validation_approach: "progressive"
    
  risk_assessment:
    identified_risks:
      - risk: "WebSocket connection stability"
        mitigation: "Implement reconnection logic"
        severity: "medium"
        
      - risk: "Message ordering at scale"
        mitigation: "Use timestamp + sequence numbers"
        severity: "high"
        
  recommendations:
    - "Consider using Socket.io for better browser compatibility"
    - "Implement message pagination early"
    - "Add Redis for presence management"
    - "Plan for horizontal scaling"
```

## Format Conventions

### Timestamps

All timestamps use ISO 8601 format:
```yaml
timestamp: "2024-01-12T18:30:00Z"
```

### File Paths

Always use forward slashes, even on Windows:
```yaml
path: "./workspaces/agent_name/file.ts"
```

### Status Values

Consistent status values across scripts:
- Agent status: `ready`, `in_progress`, `completed`, `blocked`
- Validation status: `passed`, `passed_with_warnings`, `failed`
- Operation result: `success`, `failure`, `error`

### Progress Indicators

Progress as percentage (0-100):
```yaml
progress_percentage: 75
```

### Error Severity

Standard severity levels:
- `critical`: Must fix immediately
- `high`: Should fix before proceeding
- `medium`: Should fix soon
- `low`: Nice to fix

### Lists and Arrays

Use YAML list syntax:
```yaml
items:
  - first_item
  - second_item
```

### Multi-line Strings

Use pipe notation for formatted text:
```yaml
description: |
  This is a multi-line
  description that preserves
  line breaks and formatting.
```

### Null Values

Explicit null for missing values:
```yaml
completed_at: null
```

## Best Practices

1. **Consistent Structure**: Follow the established schema for each script
2. **Meaningful Keys**: Use descriptive key names
3. **Type Consistency**: Don't mix types for the same field
4. **Validation**: Include validation results where applicable
5. **Timestamps**: Always include operation timestamps
6. **Summaries**: Provide summary sections for quick overview
7. **Recommendations**: Include actionable recommendations when relevant

## Integration Tips

### Parsing YAML in Shell

```bash
# Using yq
result=$(./scripts/python/monitor-agents.py --output-format yaml)
completed_count=$(echo "$result" | yq '.summary.by_status.completed')
```

### Parsing YAML in Python

```python
import yaml

# Read script output
with open('status.yaml', 'r') as f:
    data = yaml.safe_load(f)
    
# Access nested data
completed = data['summary']['by_status']['completed']
```

### Parsing YAML in JavaScript

```javascript
const yaml = require('js-yaml');
const fs = require('fs');

// Read YAML file
const data = yaml.load(fs.readFileSync('status.yaml', 'utf8'));

// Access data
const completed = data.summary.by_status.completed;
```

## Schema Validation

For automated validation, schemas are available in:
- `schemas/cache-linear-issue.schema.yaml`
- `schemas/agent-status.schema.yaml`
- `schemas/validation-report.schema.yaml`
- etc.

Use with validation tools:
```bash
# Validate output against schema
yq eval-all 'select(di == 1) as $schema | select(di == 0) | validate($schema)' \
  output.yaml schema.yaml
```

## Next Steps

- See [Script Usage Examples](script-usage-examples.md) for practical usage
- Check [Troubleshooting Guide](troubleshooting-python-scripts.md) for YAML-related issues
- Review individual script documentation for detailed field descriptions