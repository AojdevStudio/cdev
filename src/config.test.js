#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  ConfigManager,
  initialize,
  get,
  set,
  save,
  reset,
  validate,
  getConfigPath,
  getConfig,
} = require('./config.js');

// Test suite for configuration management
function runTests() {
  console.log('Running configuration management tests...');

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

  // Test 1: ConfigManager class exists
  test('ConfigManager class exists', () => {
    if (typeof ConfigManager !== 'function') {
      throw new Error('ConfigManager is not a constructor function');
    }
  });

  // Test 2: Can create ConfigManager instance
  test('Can create ConfigManager instance', () => {
    const configManager = new ConfigManager();
    if (!(configManager instanceof ConfigManager)) {
      throw new Error('Failed to create ConfigManager instance');
    }
  });

  // Test 3: Initialize function exists and works
  test('Initialize function exists and works', () => {
    if (typeof initialize !== 'function') {
      throw new Error('initialize is not a function');
    }

    const config = initialize();
    if (typeof config !== 'object' || config === null) {
      throw new Error('initialize should return a config object');
    }
  });

  // Test 4: Get function works with initialized config
  test('Get function works with initialized config', () => {
    initialize();

    if (typeof get !== 'function') {
      throw new Error('get is not a function');
    }

    const linearConfig = get('linear');
    if (typeof linearConfig !== 'object' || linearConfig === null) {
      throw new Error('get should return linear config object');
    }
  });

  // Test 5: Get function works with dot notation
  test('Get function works with dot notation', () => {
    initialize();

    const apiKey = get('linear.apiKey');
    if (apiKey !== null && typeof apiKey !== 'string') {
      throw new Error('get should return string or null for linear.apiKey');
    }
  });

  // Test 6: Get function returns default value for non-existent key
  test('Get function returns default value for non-existent key', () => {
    initialize();

    const defaultValue = 'test-default';
    const result = get('nonexistent.key', defaultValue);
    if (result !== defaultValue) {
      throw new Error('get should return default value for non-existent key');
    }
  });

  // Test 7: Set function works
  test('Set function works', () => {
    initialize();

    if (typeof set !== 'function') {
      throw new Error('set is not a function');
    }

    const testValue = 'test-value-123';
    set('test.key', testValue);

    const retrievedValue = get('test.key');
    if (retrievedValue !== testValue) {
      throw new Error('set/get should work together');
    }
  });

  // Test 8: Set function works with nested objects
  test('Set function works with nested objects', () => {
    initialize();

    set('test.nested.deep.key', 'deep-value');
    const retrievedValue = get('test.nested.deep.key');
    if (retrievedValue !== 'deep-value') {
      throw new Error('set/get should work with nested objects');
    }
  });

  // Test 9: Reset function works
  test('Reset function works', () => {
    initialize();

    if (typeof reset !== 'function') {
      throw new Error('reset is not a function');
    }

    set('test.key', 'test-value');
    const config = reset();

    if (typeof config !== 'object' || config === null) {
      throw new Error('reset should return config object');
    }

    const testValue = get('test.key');
    if (testValue !== undefined) {
      throw new Error('reset should remove custom values');
    }
  });

  // Test 10: Validate function works
  test('Validate function works', () => {
    initialize();

    if (typeof validate !== 'function') {
      throw new Error('validate is not a function');
    }

    const isValid = validate();
    if (typeof isValid !== 'boolean') {
      throw new Error('validate should return boolean');
    }
  });

  // Test 11: GetConfigPath function works
  test('GetConfigPath function works', () => {
    initialize();

    if (typeof getConfigPath !== 'function') {
      throw new Error('getConfigPath is not a function');
    }

    const configPath = getConfigPath();
    if (configPath !== null && typeof configPath !== 'string') {
      throw new Error('getConfigPath should return string or null');
    }
  });

  // Test 12: GetConfig function works
  test('GetConfig function works', () => {
    initialize();

    if (typeof getConfig !== 'function') {
      throw new Error('getConfig is not a function');
    }

    const config = getConfig();
    if (typeof config !== 'object' || config === null) {
      throw new Error('getConfig should return config object');
    }
  });

  // Test 13: Error handling for get without initialization
  test('Error handling for get without initialization', () => {
    const freshConfigManager = new ConfigManager();

    try {
      freshConfigManager.get('test.key');
      throw new Error('Should have thrown error for uninitialized config');
    } catch (error) {
      if (!error.message.includes('not initialized')) {
        throw new Error('Should throw specific initialization error');
      }
    }
  });

  // Test 14: Error handling for set without initialization
  test('Error handling for set without initialization', () => {
    const freshConfigManager = new ConfigManager();

    try {
      freshConfigManager.set('test.key', 'value');
      throw new Error('Should have thrown error for uninitialized config');
    } catch (error) {
      if (!error.message.includes('not initialized')) {
        throw new Error('Should throw specific initialization error');
      }
    }
  });

  // Test 15: Error handling for validate without initialization
  test('Error handling for validate without initialization', () => {
    const freshConfigManager = new ConfigManager();

    try {
      freshConfigManager.validate();
      throw new Error('Should have thrown error for uninitialized config');
    } catch (error) {
      if (!error.message.includes('not initialized')) {
        throw new Error('Should throw specific initialization error');
      }
    }
  });

  // Test 16: Config merging works correctly
  test('Config merging works correctly', () => {
    const configManager = new ConfigManager();

    const defaults = { a: 1, b: { c: 2, d: 3 } };
    const userConfig = { b: { c: 4 }, e: 5 };

    const merged = configManager.mergeConfigs(defaults, userConfig);

    if (merged.a !== 1 || merged.b.c !== 4 || merged.b.d !== 3 || merged.e !== 5) {
      throw new Error('Config merging should work correctly');
    }
  });

  console.log(`\nConfiguration Management Tests: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('All configuration management tests passed!');
    process.exit(0);
  } else {
    console.log('Some configuration management tests failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
