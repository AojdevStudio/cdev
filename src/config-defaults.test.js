#!/usr/bin/env node

const {
  defaults,
  getDefaults,
  getDefaultsForCategory,
  validateDefaults,
  mergeWithDefaults,
  deepMerge,
  getConfigSchema,
} = require('./config-defaults.js');

// Test suite for configuration defaults
function runTests() {
  console.log('Running configuration defaults tests...');

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

  // Test 1: defaults object exists
  test('defaults object exists', () => {
    if (typeof defaults !== 'object' || defaults === null) {
      throw new Error('defaults should be an object');
    }
  });

  // Test 2: defaults contains required categories
  test('defaults contains required categories', () => {
    const required = ['linear', 'git', 'claude', 'agent'];

    for (const category of required) {
      if (!defaults[category]) {
        throw new Error(`defaults should contain ${category} category`);
      }
    }
  });

  // Test 3: getDefaults function exists and works
  test('getDefaults function exists and works', () => {
    if (typeof getDefaults !== 'function') {
      throw new Error('getDefaults is not a function');
    }

    const result = getDefaults();

    if (typeof result !== 'object' || result === null) {
      throw new Error('getDefaults should return an object');
    }

    if (result === defaults) {
      throw new Error('getDefaults should return a copy, not the original');
    }
  });

  // Test 4: getDefaultsForCategory function works
  test('getDefaultsForCategory function works', () => {
    if (typeof getDefaultsForCategory !== 'function') {
      throw new Error('getDefaultsForCategory is not a function');
    }

    const linearDefaults = getDefaultsForCategory('linear');

    if (typeof linearDefaults !== 'object' || linearDefaults === null) {
      throw new Error('getDefaultsForCategory should return an object');
    }

    if (linearDefaults === defaults.linear) {
      throw new Error('getDefaultsForCategory should return a copy, not the original');
    }
  });

  // Test 5: getDefaultsForCategory throws error for invalid category
  test('getDefaultsForCategory throws error for invalid category', () => {
    try {
      getDefaultsForCategory('nonexistent');
      throw new Error('Should have thrown error for invalid category');
    } catch (error) {
      if (!error.message.includes('Unknown configuration category')) {
        throw new Error('Should throw specific error for invalid category');
      }
    }
  });

  // Test 6: validateDefaults function works
  test('validateDefaults function works', () => {
    if (typeof validateDefaults !== 'function') {
      throw new Error('validateDefaults is not a function');
    }

    const result = validateDefaults();

    if (result !== true) {
      throw new Error('validateDefaults should return true for valid defaults');
    }
  });

  // Test 7: linear defaults are properly structured
  test('linear defaults are properly structured', () => {
    const linearDefaults = defaults.linear;

    if (typeof linearDefaults.baseUrl !== 'string') {
      throw new Error('linear.baseUrl should be a string');
    }

    if (typeof linearDefaults.timeout !== 'number') {
      throw new Error('linear.timeout should be a number');
    }

    if (typeof linearDefaults.retries !== 'number') {
      throw new Error('linear.retries should be a number');
    }
  });

  // Test 8: git defaults are properly structured
  test('git defaults are properly structured', () => {
    const gitDefaults = defaults.git;

    if (typeof gitDefaults.worktreeBase !== 'string') {
      throw new Error('git.worktreeBase should be a string');
    }

    if (typeof gitDefaults.autoCommit !== 'boolean') {
      throw new Error('git.autoCommit should be a boolean');
    }

    if (typeof gitDefaults.commitMessageTemplate !== 'string') {
      throw new Error('git.commitMessageTemplate should be a string');
    }
  });

  // Test 9: claude defaults are properly structured
  test('claude defaults are properly structured', () => {
    const claudeDefaults = defaults.claude;

    if (typeof claudeDefaults.timeout !== 'number') {
      throw new Error('claude.timeout should be a number');
    }

    if (typeof claudeDefaults.maxRetries !== 'number') {
      throw new Error('claude.maxRetries should be a number');
    }

    if (typeof claudeDefaults.contextWindow !== 'number') {
      throw new Error('claude.contextWindow should be a number');
    }
  });

  // Test 10: agent defaults are properly structured
  test('agent defaults are properly structured', () => {
    const agentDefaults = defaults.agent;

    if (typeof agentDefaults.maxConcurrency !== 'number') {
      throw new Error('agent.maxConcurrency should be a number');
    }

    if (typeof agentDefaults.estimatedTimeBuffer !== 'number') {
      throw new Error('agent.estimatedTimeBuffer should be a number');
    }

    if (typeof agentDefaults.progressTracking !== 'boolean') {
      throw new Error('agent.progressTracking should be a boolean');
    }
  });

  // Test 11: mergeWithDefaults function works
  test('mergeWithDefaults function works', () => {
    if (typeof mergeWithDefaults !== 'function') {
      throw new Error('mergeWithDefaults is not a function');
    }

    const userConfig = {
      linear: { timeout: 60000 },
      custom: { key: 'value' },
    };

    const merged = mergeWithDefaults(userConfig);

    if (merged.linear.timeout !== 60000) {
      throw new Error('mergeWithDefaults should override default values');
    }

    if (merged.linear.baseUrl !== defaults.linear.baseUrl) {
      throw new Error('mergeWithDefaults should preserve non-overridden defaults');
    }

    if (merged.custom.key !== 'value') {
      throw new Error('mergeWithDefaults should include custom values');
    }
  });

  // Test 12: deepMerge function works
  test('deepMerge function works', () => {
    if (typeof deepMerge !== 'function') {
      throw new Error('deepMerge is not a function');
    }

    const target = { a: 1, b: { c: 2, d: 3 } };
    const source = { b: { c: 4 }, e: 5 };

    const merged = deepMerge(target, source);

    if (merged.a !== 1 || merged.b.c !== 4 || merged.b.d !== 3 || merged.e !== 5) {
      throw new Error('deepMerge should merge objects correctly');
    }
  });

  // Test 13: deepMerge handles arrays correctly
  test('deepMerge handles arrays correctly', () => {
    const target = { arr: [1, 2, 3] };
    const source = { arr: [4, 5] };

    const merged = deepMerge(target, source);

    if (!Array.isArray(merged.arr) || merged.arr.length !== 2 || merged.arr[0] !== 4) {
      throw new Error('deepMerge should replace arrays, not merge them');
    }
  });

  // Test 14: getConfigSchema function works
  test('getConfigSchema function works', () => {
    if (typeof getConfigSchema !== 'function') {
      throw new Error('getConfigSchema is not a function');
    }

    const schema = getConfigSchema();

    if (typeof schema !== 'object' || schema === null) {
      throw new Error('getConfigSchema should return an object');
    }

    if (!schema.linear || !schema.git || !schema.claude || !schema.agent) {
      throw new Error('getConfigSchema should contain all required categories');
    }
  });

  // Test 15: security defaults are properly structured
  test('security defaults are properly structured', () => {
    const securityDefaults = defaults.security;

    if (typeof securityDefaults.validateInputs !== 'boolean') {
      throw new Error('security.validateInputs should be a boolean');
    }

    if (typeof securityDefaults.allowUnsafeOperations !== 'boolean') {
      throw new Error('security.allowUnsafeOperations should be a boolean');
    }

    if (!Array.isArray(securityDefaults.allowedExtensions)) {
      throw new Error('security.allowedExtensions should be an array');
    }
  });

  // Test 16: paths defaults are properly structured
  test('paths defaults are properly structured', () => {
    const pathDefaults = defaults.paths;

    if (typeof pathDefaults.home !== 'string') {
      throw new Error('paths.home should be a string');
    }

    if (typeof pathDefaults.config !== 'string') {
      throw new Error('paths.config should be a string');
    }

    if (typeof pathDefaults.cache !== 'string') {
      throw new Error('paths.cache should be a string');
    }
  });

  // Test 17: logging defaults are properly structured
  test('logging defaults are properly structured', () => {
    const loggingDefaults = defaults.logging;

    if (typeof loggingDefaults.level !== 'string') {
      throw new Error('logging.level should be a string');
    }

    if (typeof loggingDefaults.enableConsole !== 'boolean') {
      throw new Error('logging.enableConsole should be a boolean');
    }

    if (typeof loggingDefaults.maxFiles !== 'number') {
      throw new Error('logging.maxFiles should be a number');
    }
  });

  // Test 18: hooks defaults are properly structured
  test('hooks defaults are properly structured', () => {
    const hooksDefaults = defaults.hooks;

    if (typeof hooksDefaults.enabled !== 'boolean') {
      throw new Error('hooks.enabled should be a boolean');
    }

    if (typeof hooksDefaults.pre !== 'object' || hooksDefaults.pre === null) {
      throw new Error('hooks.pre should be an object');
    }

    if (typeof hooksDefaults.post !== 'object' || hooksDefaults.post === null) {
      throw new Error('hooks.post should be an object');
    }
  });

  console.log(`\nConfiguration Defaults Tests: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('All configuration defaults tests passed!');
    process.exit(0);
  } else {
    console.log('Some configuration defaults tests failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
