#!/usr/bin/env node

/**
 * Test script for the enhanced /agent-start command
 * Tests the task parsing and sub-agent decomposition with PUBLISHING-PLAN.md
 */

const { TaskParser } = require('./utils/task-parser.js');
const { SubagentDecomposer } = require('./utils/subagent-decomposer.js');
const fs = require('node:fs').promises;
const path = require('node:path');

async function testAgentStart() {
  console.log('🧪 Testing enhanced /agent-start command with PUBLISHING-PLAN.md\n');
  
  try {
    // Initialize parser and decomposer
    const parser = new TaskParser();
    const decomposer = new SubagentDecomposer();
    
    // Test with PUBLISHING-PLAN.md
    const inputFile = 'PUBLISHING-PLAN.md';
    console.log(`📄 Testing with: ${inputFile}`);
    
    // Step 1: Parse the file
    console.log('\n1️⃣ Parsing task file...');
    const parsed = await parser.parse(inputFile);
    
    console.log(`✅ Format detected: ${parsed.format}`);
    console.log(`📋 Total tasks found: ${parsed.tasks.length}`);
    console.log(`✅ Completed tasks: ${parsed.metadata.completedTasks || 0}`);
    console.log(`📂 Sections: ${parsed.metadata.sections?.join(', ') || 'none'}`);
    
    // Show first few tasks
    console.log('\n📝 Sample tasks:');
    parsed.tasks.slice(0, 5).forEach(task => {
      const status = task.completed ? '✅' : '⬜';
      console.log(`  ${status} ${task.text.substring(0, 60)}${task.text.length > 60 ? '...' : ''}`);
    });
    
    // Step 2: Get task statistics
    console.log('\n2️⃣ Task Statistics:');
    const stats = parser.getStatistics(parsed);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Completed: ${stats.completed}`);
    console.log(`  Pending: ${stats.pending}`);
    console.log(`  By Type:`, stats.byType);
    console.log(`  By Section:`, stats.bySection);
    
    // Step 3: Decompose into sub-agents
    console.log('\n3️⃣ Decomposing into concurrent sub-agents...');
    const tasks = parser.toSimpleArray(parsed);
    const decomposition = await decomposer.decomposeForSubagents(
      tasks,
      { projectRoot: process.cwd() }
    );
    
    console.log(`\n✅ Decomposition complete!`);
    console.log(`🤖 Strategy: ${decomposition.strategy}`);
    console.log(`📊 Confidence: ${(decomposition.confidence * 100).toFixed(0)}%`);
    console.log(`👥 Sub-agents created: ${decomposition.subagents.length}`);
    
    // Display sub-agents
    console.log('\n📦 Sub-agents:');
    for (const subagent of decomposition.subagents) {
      console.log(`\n  ${subagent.agentId}:`);
      console.log(`    Role: ${subagent.agentRole}`);
      console.log(`    Focus: ${subagent.focusArea}`);
      console.log(`    Tasks: ${subagent.tasks.length}`);
      console.log(`    Can Start: ${subagent.canStartImmediately ? '✅ Yes' : '⏳ No'}`);
      if (subagent.dependencies.length > 0) {
        console.log(`    Dependencies: ${subagent.dependencies.join(', ')}`);
      }
      console.log(`    Est. Time: ${subagent.estimatedTime} minutes`);
      
      // Show first 3 tasks
      console.log(`    Sample tasks:`);
      subagent.tasks.slice(0, 3).forEach(task => {
        const taskText = typeof task === 'string' ? task : task.text || task;
        console.log(`      - ${taskText.substring(0, 50)}${taskText.length > 50 ? '...' : ''}`);
      });
    }
    
    // Display orchestration plan
    console.log('\n🎯 Orchestration Plan:');
    for (const phase of decomposition.orchestrationPlan.phases) {
      console.log(`\n  Phase ${phase.phase}: ${phase.description}`);
      console.log(`    Concurrent agents: ${phase.concurrent.join(', ')}`);
    }
    
    // Step 4: Generate agent contexts
    console.log('\n4️⃣ Generating agent contexts...');
    const { contexts, orchestrationPlan } = await decomposer.generateAgentContexts(
      decomposition,
      parsed.source
    );
    
    // Save contexts for inspection
    const contextDir = './test-output/subagent-contexts';
    await fs.mkdir(contextDir, { recursive: true });
    
    for (const context of contexts) {
      const contextPath = path.join(contextDir, `${context.identity.agentId}.json`);
      await fs.writeFile(contextPath, JSON.stringify(context, null, 2));
    }
    
    console.log(`✅ Generated ${contexts.length} agent contexts`);
    console.log(`💾 Saved to: ${contextDir}`);
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`  Input: ${inputFile} (${parsed.format})`);
    console.log(`  Tasks: ${parsed.tasks.length} total, ${stats.pending} pending`);
    console.log(`  Sub-agents: ${decomposition.subagents.length}`);
    console.log(`  Phases: ${orchestrationPlan.phases.length}`);
    console.log(`  Strategy: Concurrent execution with orchestration`);
    
    // Test dry-run output
    console.log('\n5️⃣ Dry-run preview:');
    console.log('  This would launch:');
    for (const phase of orchestrationPlan.phases) {
      console.log(`    Phase ${phase.phase}: ${phase.concurrent.length} agents concurrently`);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testAgentStart().catch(console.error);