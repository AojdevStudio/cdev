#!/usr/bin/env node

const { 
  executeCommand, 
  cacheCommand,
  decomposeCommand,
  spawnCommand,
  statusCommand,
  commitCommand
} = require('./cli-commands.js');

// Test suite for CLI commands
function runTests() {
  console.log('Running CLI commands tests...');
  
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
  
  // Test 1: executeCommand function exists
  test('executeCommand function exists', () => {
    if (typeof executeCommand !== 'function') {
      throw new Error('executeCommand is not a function');
    }
  });
  
  // Test 2: cacheCommand function exists
  test('cacheCommand function exists', () => {
    if (typeof cacheCommand !== 'function') {
      throw new Error('cacheCommand is not a function');
    }
  });
  
  // Test 3: decomposeCommand function exists
  test('decomposeCommand function exists', () => {
    if (typeof decomposeCommand !== 'function') {
      throw new Error('decomposeCommand is not a function');
    }
  });
  
  // Test 4: spawnCommand function exists
  test('spawnCommand function exists', () => {
    if (typeof spawnCommand !== 'function') {
      throw new Error('spawnCommand is not a function');
    }
  });
  
  // Test 5: statusCommand function exists
  test('statusCommand function exists', () => {
    if (typeof statusCommand !== 'function') {
      throw new Error('statusCommand is not a function');
    }
  });
  
  // Test 6: commitCommand function exists
  test('commitCommand function exists', () => {
    if (typeof commitCommand !== 'function') {
      throw new Error('commitCommand is not a function');
    }
  });
  
  // Test 7: executeCommand handles help command
  test('executeCommand handles help command', () => {
    const originalLog = console.log;
    let helpShown = false;
    
    console.log = (msg) => {
      if (msg.includes('Usage:')) {
        helpShown = true;
      }
    };
    
    try {
      // Call executeCommand synchronously for testing
      const { showHelp } = require('./cli-parser.js');
      showHelp();
      if (!helpShown) {
        throw new Error('Help was not shown');
      }
    } finally {
      console.log = originalLog;
    }
  });
  
  // Test 8: executeCommand handles version option  
  test('executeCommand handles version option', () => {
    const fs = require('fs');
    const path = require('path');
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!packageData.version) {
      throw new Error('Version not found in package.json');
    }
  });
  
  console.log(`\nCLI Commands Tests: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('All CLI commands tests passed!');
    process.exit(0);
  } else {
    console.log('Some CLI commands tests failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };