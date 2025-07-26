#!/usr/bin/env node

const { execSync } = require('child_process');

const { main } = require('../bin/cli.js');

// Test suite for CLI entry point
function runTests() {
  console.log('Running CLI tests...');

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

  // Test 1: CLI module exports main function
  test('CLI module exports main function', () => {
    if (typeof main !== 'function') {
      throw new Error('main is not a function');
    }
  });

  // Test 2: CLI shows help when no arguments
  test('CLI shows help when no arguments', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'help'];

    try {
      // This would show help, which is expected behavior
      const result = execSync('node bin/cli.js help', { encoding: 'utf8' });
      if (!result.includes('Usage:')) {
        throw new Error('Help message not displayed');
      }
    } catch (error) {
      if (error.status === 0) {
        // Help command should exit with status 0
        return;
      }
      throw error;
    } finally {
      process.argv = originalArgv;
    }
  });

  // Test 3: CLI handles version flag
  test('CLI handles version flag', () => {
    try {
      const result = execSync('node bin/cli.js --version', { encoding: 'utf8' });
      if (!result.includes('v')) {
        throw new Error('Version not displayed');
      }
    } catch (error) {
      if (error.status === 0) {
        // Version command should exit with status 0
        return;
      }
      throw error;
    }
  });

  console.log(`\nCLI Tests: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('All CLI tests passed!');
    process.exit(0);
  } else {
    console.log('Some CLI tests failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
