---
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Task
description: Intelligently transform any task format into concurrent sub-agents for orchestrated execution
---

# Orchestrate

This command intelligently transforms various task formats (markdown checklists, text lists, YAML, Linear issues) into concurrent sub-agents that execute within a single Claude instance. It acts as an orchestrator, spawning sub-agents via the Task tool for maximum efficiency.

**variables:**  
Input: $ARGUMENTS <!-- Can be: file path, Linear ID, or direct text -->

**Usage Examples:**

- `/orchestrate` — auto-detect agent_context.yaml in current directory
- `/orchestrate $ARGUMENTS` — parse markdown checklist into sub-agents
- `/orchestrate tasks.txt` — convert text list to concurrent sub-agents
- `/orchestrate LINEAR-123` — decompose Linear issue into sub-agents
- `/orchestrate "Fix linting, add tests, update docs"` — direct text input
- `/orchestrate checklist.md --dry-run` — preview sub-agent plan without executing

```yaml
# Describes the complete workflow for orchestrating sub-agents based on input tasks.
agent_orchestration_workflow:
  # Initial step for parsing and transforming input into a structured format.
  format_detection_and_transformation:
    - step: 1
      title: "Parse Input"
      description: "Auto-detects the input format and parses it into a list of tasks."
      code_snippet: |
        const { TaskParser } = require('../../utils/task-parser.js');
        const { SubagentDecomposer } = require('../../utils/subagent-decomposer.js');

        const parser = new TaskParser();
        const decomposer = new SubagentDecomposer();

        // Auto-detect format and parse
        const parsed = await parser.parse($ARGUMENTS || 'agent_context.yaml');
        console.log(`📄 Detected format: ${parsed.format}`);
        console.log(`📋 Found ${parsed.tasks.length} tasks`);
    - step: 2
      title: "Intelligent Decomposition"
      description: "Uses an LLM to group tasks into concurrent sub-agents and create an execution plan."
      code_snippet: |
        // Use LLM to group tasks into concurrent sub-agents
        const decomposition = await decomposer.decomposeForSubagents(parser.toSimpleArray(parsed), {
          projectRoot: process.cwd(),
          scriptsDirectory: './scripts',
          scriptType: 'standalone-python-uv',
          scriptRequirements: {
            shebang: '#!/usr/bin/env -S uv run --script',
            format: 'pep723-inline-metadata',
            dependencies: ['pyyaml>=6.0', 'click>=8.1', 'rich>=13.0'],
            outputFormat: 'yaml'
          }
        });

        console.log(`🤖 Created ${decomposition.subagents.length} concurrent sub-agents`);
        console.log(`⚡ Execution phases: ${decomposition.orchestrationPlan.phases.length}`);
    - step: 3
      title: "Generate Agent Contexts"
      description: "Creates and saves detailed contexts for each sub-agent to use during execution."
      code_snippet: |
        const { contexts, orchestrationPlan } = await decomposer.generateAgentContexts(
          decomposition,
          parsed.source,
        );

        // Save contexts for reference
        const contextDir = './shared/subagent-contexts';
        await fs.mkdir(contextDir, { recursive: true });

        for (const context of contexts) {
          const contextPath = path.join(contextDir, `${context.identity.agentId}.yaml`);
          await fs.writeFile(contextPath, YAML.stringify(context, null, 2));
        }

  # Defines the multi-phase process for executing the sub-agents.
  orchestration_workflow:
    phase_1_launch_concurrent_subagents:
      title: "Phase 1 — Launch Concurrent Sub-agents"
      description: "Launches sub-agents in phases according to the generated orchestration plan."
      code_snippet: |
        for (const phase of orchestrationPlan.phases) {
          console.log(`\n🚀 Phase ${phase.phase}: ${phase.description}`);

          // Launch all concurrent sub-agents for this phase
          const subagentPromises = phase.concurrent.map((agentId) => {
            const context = contexts.find((c) => c.identity.agentId === agentId);

            return launchSubagent(context);
          });

          // Wait for all sub-agents in this phase to complete
          const results = await Promise.all(subagentPromises);

          // Aggregate results
          console.log(`✅ Phase ${phase.phase} complete`);
        }
    sub_agent_launch_function:
      title: "Sub-agent Launch Function"
      description: "A function to spawn and execute a single sub-agent with its specific context and tasks."
      code_snippet: |
        async function launchSubagent(context) {
          console.log(`🤖 Launching ${context.identity.agentId}...`);

                  // Use Task tool to spawn sub-agent
        const result = await Task({
          description: `Execute ${context.identity.agentRole}`,
          prompt: `You are a specialized sub-agent: ${context.identity.agentId}
            
    Role: ${context.identity.agentRole}
    Focus Area: ${context.identity.focusArea}

    Tasks to complete:
    ${context.deliverables.tasks.map((t) => `- ${t}`).join('\n')}

    File Placement Instructions:
    - Create all scripts in the scripts/ directory
    - Use the exact file paths specified in your context: ${context.deliverables.filesToCreate?.join(', ') || 'See context for file paths'}
    
    Script Requirements:
    - Create standalone Python scripts using UV as the package manager
    - Use UV shebang: #!/usr/bin/env -S uv run --script
    - Include inline metadata with PEP 723 format:
      # /// script
      # requires-python = ">=3.11"
      # dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0"]
      # ///
    - Each script should be self-contained with all dependencies specified inline
    - Make scripts executable with proper permissions
    - Replace JSON outputs with YAML format using yaml.dump()

    Validation Criteria:
    ${context.deliverables.validationCriteria.map((c) => `- ${c}`).join('\n')}

    Instructions:
    1. Complete all assigned tasks
    2. Create files in the specified scripts/ directory paths
    3. Ensure all scripts are standalone UV-compatible Python scripts
    4. Ensure quality and correctness
    5. Report completion status
    6. Return results in structured format

    Please execute these tasks and return a completion report.`,
        });

          return {
            agentId: context.identity.agentId,
            status: 'completed',
            result: result,
          };
        }
    phase_2_monitor_and_coordinate:
      title: "Phase 2 — Monitor & Coordinate"
      description: "Tracks the real-time progress of all active sub-agents."
      code_snippet: |
        const progressTracker = new Map();

        // Initialize tracking
        for (const context of contexts) {
          progressTracker.set(context.identity.agentId, {
            status: 'pending',
            progress: 0,
            tasks: context.deliverables.tasks,
          });
        }

        // Update progress as sub-agents work
        function updateProgress(agentId, progress) {
          const tracker = progressTracker.get(agentId);
          tracker.progress = progress;

          // Display overall progress
          const totalProgress =
            Array.from(progressTracker.values()).reduce((sum, t) => sum + t.progress, 0) /
            progressTracker.size;

          console.log(`📊 Overall progress: ${totalProgress.toFixed(0)}%`);
        }
    phase_3_aggregate_results:
      title: "Phase 3 — Aggregate Results"
      description: "Collects outputs from all sub-agents and compiles a final summary report."
      code_snippet: |
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
          './shared/reports/subagent-execution-report.yaml',
          YAML.stringify(finalReport, null, 2)
        );

  # Additional capabilities that improve the orchestration process.
  enhanced_features:
    format_specific_handling:
      title: "Format-Specific Handling"
      description: "Custom logic to handle different input formats intelligently."
      handlers:
        - format: "Markdown Checklists"
          details: "Preserves section structure, groups related tasks, and tracks completion status."
        - format: "Linear Issues"
          details: "Extracts requirements, maintains issue context, and links back to Linear."
        - format: "Direct Text"
          details: "Smart task splitting, keyword-based grouping, and dependency detection."
    dry_run_mode:
      title: "Dry Run Mode"
      description: "Allows previewing the orchestration plan without executing any tasks."
      code_snippet: |
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
    error_handling_and_recovery:
      title: "Error Handling & Recovery"
      description: "Robust mechanisms to catch errors, attempt retries, and save state for recovery."
      code_snippet: |
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
            `./shared/coordination/error-${context.identity.agentId}.yaml`,
            YAML.stringify({ error: error.message, context, timestamp: Date.now() }, null, 2),
          );
        }

  # Defines the structure of the final output responses.
  return_status:
    success_response:
      description: "YAML response returned when all sub-agents complete successfully."
      payload:
        status: "OK"
        subagentsCompleted: 5
        totalTasks: 23
        executionTime: "5m 32s"
        reportPath: "./shared/reports/subagent-execution-report.yaml"
    error_response:
      description: "YAML response returned when one or more sub-agents fail."
      payload:
        status: "FAIL"
        reason: "2 sub-agents failed to complete"
        failedAgents:
          - "security_subagent"
          - "publishing_subagent"
        partialResults: "./shared/coordination/partial-results.yaml"

  # Illustrative examples of the orchestrator in action.
  examples:
    - scenario: "Publishing Plan from a Markdown file"
      command: "/orchestrate PUBLISHING-PLAN.md"
      output: |
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
    - scenario: "Linear Issue"
      command: "/orchestrate DEV-456"
      output: |
        📄 Detected format: linear-issue
        🔗 Issue: "Implement authentication system"
        📋 Found 8 tasks
        🤖 Created 3 concurrent sub-agents
    - scenario: "Direct Text Input"
      command: "/orchestrate \"Run tests, fix linting, update docs, deploy to staging\""
      output: |
        📄 Detected format: direct-text
        📋 Found 4 tasks
        🤖 Created 3 concurrent sub-agents
```