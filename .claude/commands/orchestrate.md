---
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Task
description: Intelligently transform any task format into concurrent sub-agents for orchestrated execution
---

# Orchestrate

This command intelligently transforms various task formats (markdown checklists, text lists, JSON, Linear issues) into concurrent sub-agents that execute within a single Claude instance. It acts as an orchestrator, spawning sub-agents via the Task tool for maximum efficiency.

**variables:**  
Input: $ARGUMENTS   <!-- Can be: file path, Linear ID, or direct text -->

**Usage Examples:**
- `/orchestrate` — auto-detect agent_context.json in current directory
- `/orchestrate PUBLISHING-PLAN.md` — parse markdown checklist into sub-agents
- `/orchestrate tasks.txt` — convert text list to concurrent sub-agents
- `/orchestrate LINEAR-123` — decompose Linear issue into sub-agents
- `/orchestrate "Fix linting, add tests, update docs"` — direct text input
- `/orchestrate checklist.json --dry-run` — preview sub-agent plan without executing

---

## Format Detection & Transformation

**Step 1: Parse Input**
```javascript
const { TaskParser } = require('../../utils/task-parser.js');
const { SubagentDecomposer } = require('../../utils/subagent-decomposer.js');

const parser = new TaskParser();
const decomposer = new SubagentDecomposer();

// Auto-detect format and parse
const parsed = await parser.parse($ARGUMENTS || 'agent_context.json');
console.log(`📄 Detected format: ${parsed.format}`);
console.log(`📋 Found ${parsed.tasks.length} tasks`);
```

**Step 2: Intelligent Decomposition**
```javascript
// Use LLM to group tasks into concurrent sub-agents
const decomposition = await decomposer.decomposeForSubagents(
  parser.toSimpleArray(parsed),
  { projectRoot: process.cwd() }
);

console.log(`🤖 Created ${decomposition.subagents.length} concurrent sub-agents`);
console.log(`⚡ Execution phases: ${decomposition.orchestrationPlan.phases.length}`);
```

**Step 3: Generate Agent Contexts**
```javascript
const { contexts, orchestrationPlan } = await decomposer.generateAgentContexts(
  decomposition,
  parsed.source
);

// Save contexts for reference
const contextDir = './shared/subagent-contexts';
await fs.mkdir(contextDir, { recursive: true });

for (const context of contexts) {
  const contextPath = path.join(contextDir, `${context.identity.agentId}.json`);
  await fs.writeFile(contextPath, JSON.stringify(context, null, 2));
}
```

---

## Orchestration Workflow

### Phase 1 — Launch Concurrent Sub-agents

Based on the orchestration plan, launch sub-agents in phases:

```javascript
for (const phase of orchestrationPlan.phases) {
  console.log(`\n🚀 Phase ${phase.phase}: ${phase.description}`);
  
  // Launch all concurrent sub-agents for this phase
  const subagentPromises = phase.concurrent.map(agentId => {
    const context = contexts.find(c => c.identity.agentId === agentId);
    
    return launchSubagent(context);
  });
  
  // Wait for all sub-agents in this phase to complete
  const results = await Promise.all(subagentPromises);
  
  // Aggregate results
  console.log(`✅ Phase ${phase.phase} complete`);
}
```

### Sub-agent Launch Function
```javascript
async function launchSubagent(context) {
  console.log(`🤖 Launching ${context.identity.agentId}...`);
  
  // Use Task tool to spawn sub-agent
  const result = await Task({
    description: `Execute ${context.identity.agentRole}`,
    prompt: `You are a specialized sub-agent: ${context.identity.agentId}
    
Role: ${context.identity.agentRole}
Focus Area: ${context.identity.focusArea}

Tasks to complete:
${context.deliverables.tasks.map(t => `- ${t}`).join('\n')}

Validation Criteria:
${context.deliverables.validationCriteria.map(c => `- ${c}`).join('\n')}

Instructions:
1. Complete all assigned tasks
2. Ensure quality and correctness
3. Report completion status
4. Return results in structured format

Please execute these tasks and return a completion report.`
  });
  
  return {
    agentId: context.identity.agentId,
    status: 'completed',
    result: result
  };
}
```

### Phase 2 — Monitor & Coordinate

Track progress across all sub-agents:

```javascript
const progressTracker = new Map();

// Initialize tracking
for (const context of contexts) {
  progressTracker.set(context.identity.agentId, {
    status: 'pending',
    progress: 0,
    tasks: context.deliverables.tasks
  });
}

// Update progress as sub-agents work
function updateProgress(agentId, progress) {
  const tracker = progressTracker.get(agentId);
  tracker.progress = progress;
  
  // Display overall progress
  const totalProgress = Array.from(progressTracker.values())
    .reduce((sum, t) => sum + t.progress, 0) / progressTracker.size;
  
  console.log(`📊 Overall progress: ${totalProgress.toFixed(0)}%`);
}
```

### Phase 3 — Aggregate Results

Collect and summarize all sub-agent outputs:

```javascript
const finalReport = {
  summary: `Completed ${contexts.length} sub-agent tasks`,
  subagents: {},
  overallStatus: 'success',
  executionTime: Date.now() - startTime
};

for (const [agentId, result of results) {
  finalReport.subagents[agentId] = {
    status: result.status,
    tasksCompleted: result.tasksCompleted,
    issues: result.issues || [],
    output: result.output
  };
}

// Save final report
await fs.writeFile(
  './shared/reports/subagent-execution-report.json',
  JSON.stringify(finalReport, null, 2)
);
```

---

## Enhanced Features

### Format-Specific Handling

**Markdown Checklists:**
- Preserves section structure
- Groups related tasks
- Tracks completion status

**Linear Issues:**
- Extracts requirements
- Maintains issue context
- Links back to Linear

**Direct Text:**
- Smart task splitting
- Keyword-based grouping
- Dependency detection

### Dry Run Mode

Preview the sub-agent plan without execution:

```javascript
if ($ARGUMENTS.includes('--dry-run')) {
  console.log('\n🔍 DRY RUN MODE - Preview Only\n');
  console.log('Proposed Sub-agents:');
  
  for (const subagent of decomposition.subagents) {
    console.log(`\n📦 ${subagent.agentId}`);
    console.log(`   Role: ${subagent.agentRole}`);
    console.log(`   Tasks: ${subagent.tasks.length}`);
    console.log(`   Can Start: ${subagent.canStartImmediately ? 'Yes' : 'No'}`);
    
    if (subagent.dependencies.length > 0) {
      console.log(`   Dependencies: ${subagent.dependencies.join(', ')}`);
    }
  }
  
  console.log('\nOrchestration Plan:');
  for (const phase of orchestrationPlan.phases) {
    console.log(`\nPhase ${phase.phase}: ${phase.description}`);
    console.log(`   Concurrent: ${phase.concurrent.join(', ')}`);
  }
  
  return 'DRY_RUN_COMPLETE';
}
```

### Error Handling & Recovery

```javascript
try {
  // Execute sub-agents with error handling
  const result = await launchSubagent(context);
  
  if (result.status === 'error') {
    console.error(`❌ ${context.identity.agentId} failed: ${result.error}`);
    
    // Retry logic
    if (retryCount < 3) {
      console.log(`🔄 Retrying ${context.identity.agentId}...`);
      return await launchSubagent(context);
    }
  }
} catch (error) {
  console.error(`❌ Critical error in ${context.identity.agentId}: ${error.message}`);
  
  // Save error state for recovery
  await fs.writeFile(
    `./shared/coordination/error-${context.identity.agentId}.json`,
    JSON.stringify({ error: error.message, context, timestamp: Date.now() }, null, 2)
  );
}
```

---

## Return Status

**Success Response:**
```json
{
  "status": "OK",
  "subagentsCompleted": 5,
  "totalTasks": 23,
  "executionTime": "5m 32s",
  "reportPath": "./shared/reports/subagent-execution-report.json"
}
```

**Error Response:**
```json
{
  "status": "FAIL",
  "reason": "2 sub-agents failed to complete",
  "failedAgents": ["security_subagent", "publishing_subagent"],
  "partialResults": "./shared/coordination/partial-results.json"
}
```

---

## Examples

### Publishing Plan
```bash
/orchestrate PUBLISHING-PLAN.md

# Output:
📄 Detected format: markdown-checklist
📋 Found 42 tasks
🤖 Created 4 concurrent sub-agents
⚡ Execution phases: 2

🚀 Phase 1: Run validation, documentation, and configuration concurrently
🤖 Launching validation_subagent...
🤖 Launching documentation_subagent...
🤖 Launching configuration_subagent...
📊 Overall progress: 67%
✅ Phase 1 complete

🚀 Phase 2: Run publishing tasks after prerequisites
🤖 Launching publishing_subagent...
📊 Overall progress: 100%
✅ Phase 2 complete

✅ All sub-agents completed successfully!
```

### Linear Issue
```bash
/orchestrate DEV-456

# Output:
📄 Detected format: linear-issue
🔗 Issue: "Implement authentication system"
📋 Found 8 tasks
🤖 Created 3 concurrent sub-agents
```

### Direct Text
```bash
/orchestrate "Run tests, fix linting, update docs, deploy to staging"

# Output:
📄 Detected format: direct-text
📋 Found 4 tasks
🤖 Created 3 concurrent sub-agents
```