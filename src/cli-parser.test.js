#!/usr/bin/env node

const { parseArgs, showHelp } = require('./cli-parser.js');

// Test suite for CLI parser
function runTests() {
  console.log('Running CLI parser tests...');
  
  let passed = 0;
  let total = 0;
  
  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
    }
  }
  
  // Test 1: Parse basic command
  test('Parse basic command', () => {
    const result = parseArgs(['cache', 'PROJ-123']);
    if (result.command !== 'cache' || result.positional[0] !== 'PROJ-123') {
      throw new Error('Failed to parse basic command');
    }
  });
  
  // Test 2: Parse command with long options
  test('Parse command with long options', () => {
    const result = parseArgs(['decompose', 'PROJ-123', '--verbose', '--force']);
    if (result.command !== 'decompose' || 
        result.positional[0] !== 'PROJ-123' ||
        !result.options.verbose ||
        !result.options.force) {
      throw new Error('Failed to parse command with long options');
    }
  });
  
  // Test 3: Parse command with short options
  test('Parse command with short options', () => {
    const result = parseArgs(['status', '-h', '-v']);
    if (result.command !== 'status' || 
        !result.options.h ||
        !result.options.v) {
      throw new Error('Failed to parse command with short options');
    }
  });
  
  // Test 4: Parse command with option values
  test('Parse command with option values', () => {
    const result = parseArgs(['commit', 'backend_agent', '--message', 'test commit']);
    if (result.command !== 'commit' || 
        result.positional[0] !== 'backend_agent' ||
        result.options.message !== 'test commit') {
      throw new Error('Failed to parse command with option values');
    }
  });
  
  // Test 5: Parse command with equals syntax
  test('Parse command with equals syntax', () => {
    const result = parseArgs(['spawn', '--plan=shared/plan.json']);
    if (result.command !== 'spawn' || 
        result.options.plan !== 'shared/plan.json') {
      throw new Error('Failed to parse command with equals syntax');
    }
  });
  
  // Test 6: Handle empty arguments
  test('Handle empty arguments', () => {
    const result = parseArgs([]);
    if (result.command !== null || 
        result.positional.length !== 0 ||
        Object.keys(result.options).length !== 0) {
      throw new Error('Failed to handle empty arguments');
    }
  });
  
  // Test 7: showHelp function exists
  test('showHelp function exists', () => {
    if (typeof showHelp !== 'function') {
      throw new Error('showHelp is not a function');
    }
  });
  
  console.log(`\nCLI Parser Tests: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('All CLI parser tests passed!');
    process.exit(0);
  } else {
    console.log('Some CLI parser tests failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };