#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  ConfigLoader,
  loadFromFile,
  loadFromEnvironment,
  loadFromMultipleSources,
  mergeConfigs,
  validateConfig,
  parseEnvironmentValue,
} = require('./config-loader.js');

// Test suite for configuration loader
function runTests() {
  console.log('Running configuration loader tests...');

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

  // Test 1: ConfigLoader class exists
  test('ConfigLoader class exists', () => {
    if (typeof ConfigLoader !== 'function') {
      throw new Error('ConfigLoader is not a constructor function');
    }
  });

  // Test 2: Can create ConfigLoader instance
  test('Can create ConfigLoader instance', () => {
    const loader = new ConfigLoader();
    if (!(loader instanceof ConfigLoader)) {
      throw new Error('Failed to create ConfigLoader instance');
    }
  });

  // Test 3: loadFromFile function exists
  test('loadFromFile function exists', () => {
    if (typeof loadFromFile !== 'function') {
      throw new Error('loadFromFile is not a function');
    }
  });

  // Test 4: loadFromFile throws error for non-existent file
  test('loadFromFile throws error for non-existent file', () => {
    try {
      loadFromFile('/nonexistent/file.json');
      throw new Error('Should have thrown error for non-existent file');
    } catch (error) {
      if (!error.message.includes('not found')) {
        throw new Error('Should throw file not found error');
      }
    }
  });

  // Test 5: loadFromFile throws error for null path
  test('loadFromFile throws error for null path', () => {
    try {
      loadFromFile(null);
      throw new Error('Should have thrown error for null path');
    } catch (error) {
      if (!error.message.includes('required')) {
        throw new Error('Should throw path required error');
      }
    }
  });

  // Test 6: parseEnvironmentValue function works
  test('parseEnvironmentValue function works', () => {
    if (typeof parseEnvironmentValue !== 'function') {
      throw new Error('parseEnvironmentValue is not a function');
    }

    if (parseEnvironmentValue('true') !== true) {
      throw new Error('Should parse "true" as boolean true');
    }

    if (parseEnvironmentValue('false') !== false) {
      throw new Error('Should parse "false" as boolean false');
    }

    if (parseEnvironmentValue('123') !== 123) {
      throw new Error('Should parse "123" as number 123');
    }

    if (parseEnvironmentValue('hello') !== 'hello') {
      throw new Error('Should parse "hello" as string "hello"');
    }
  });

  // Test 7: parseEnvironmentValue handles null and undefined
  test('parseEnvironmentValue handles null and undefined', () => {
    if (parseEnvironmentValue('null') !== null) {
      throw new Error('Should parse "null" as null');
    }

    if (parseEnvironmentValue('undefined') !== undefined) {
      throw new Error('Should parse "undefined" as undefined');
    }
  });

  // Test 8: parseEnvironmentValue handles JSON strings
  test('parseEnvironmentValue handles JSON strings', () => {
    const jsonString = '{"key": "value"}';
    const result = parseEnvironmentValue(jsonString);

    if (typeof result !== 'object' || result.key !== 'value') {
      throw new Error('Should parse JSON strings correctly');
    }
  });

  // Test 9: loadFromEnvironment function works
  test('loadFromEnvironment function works', () => {
    if (typeof loadFromEnvironment !== 'function') {
      throw new Error('loadFromEnvironment is not a function');
    }

    // Set test environment variables
    process.env.TEST_PREFIX_KEY1 = 'value1';
    process.env.TEST_PREFIX_KEY2 = 'true';
    process.env.TEST_PREFIX_NESTED_KEY = 'nested-value';

    const config = loadFromEnvironment('TEST_PREFIX');

    if (config.key1 !== 'value1') {
      throw new Error('Should load key1 from environment');
    }

    if (config.key2 !== true) {
      throw new Error('Should parse boolean values from environment');
    }

    if (config['nested.key'] !== 'nested-value') {
      throw new Error('Should handle nested keys from environment');
    }

    // Clean up
    delete process.env.TEST_PREFIX_KEY1;
    delete process.env.TEST_PREFIX_KEY2;
    delete process.env.TEST_PREFIX_NESTED_KEY;
  });

  // Test 10: mergeConfigs function works
  test('mergeConfigs function works', () => {
    if (typeof mergeConfigs !== 'function') {
      throw new Error('mergeConfigs is not a function');
    }

    const target = { a: 1, b: { c: 2, d: 3 } };
    const source = { b: { c: 4 }, e: 5 };

    const merged = mergeConfigs(target, source);

    if (merged.a !== 1 || merged.b.c !== 4 || merged.b.d !== 3 || merged.e !== 5) {
      throw new Error('mergeConfigs should merge objects correctly');
    }
  });

  // Test 11: mergeConfigs handles arrays correctly
  test('mergeConfigs handles arrays correctly', () => {
    const target = { arr: [1, 2, 3] };
    const source = { arr: [4, 5] };

    const merged = mergeConfigs(target, source);

    if (!Array.isArray(merged.arr) || merged.arr.length !== 2 || merged.arr[0] !== 4) {
      throw new Error('mergeConfigs should replace arrays, not merge them');
    }
  });

  // Test 12: validateConfig function works
  test('validateConfig function works', () => {
    if (typeof validateConfig !== 'function') {
      throw new Error('validateConfig is not a function');
    }

    const config = { key1: 'value1', key2: 42 };
    const schema = {
      key1: { type: 'string', required: true },
      key2: { type: 'number', required: true },
    };

    const result = validateConfig(config, schema);

    if (!result.valid || result.errors.length !== 0) {
      throw new Error('validateConfig should validate correct config');
    }
  });

  // Test 13: validateConfig detects missing required fields
  test('validateConfig detects missing required fields', () => {
    const config = { key1: 'value1' };
    const schema = {
      key1: { type: 'string', required: true },
      key2: { type: 'number', required: true },
    };

    const result = validateConfig(config, schema);

    if (result.valid || result.errors.length === 0) {
      throw new Error('validateConfig should detect missing required fields');
    }
  });

  // Test 14: validateConfig detects type mismatches
  test('validateConfig detects type mismatches', () => {
    const config = { key1: 'value1', key2: 'not-a-number' };
    const schema = {
      key1: { type: 'string', required: true },
      key2: { type: 'number', required: true },
    };

    const result = validateConfig(config, schema);

    if (result.valid || result.errors.length === 0) {
      throw new Error('validateConfig should detect type mismatches');
    }
  });

  // Test 15: validateConfig works with custom validators
  test('validateConfig works with custom validators', () => {
    const config = { key1: 'short' };
    const schema = {
      key1: {
        type: 'string',
        required: true,
        validate: (value) => (value.length >= 10 ? true : 'Must be at least 10 characters'),
      },
    };

    const result = validateConfig(config, schema);

    if (result.valid || result.errors.length === 0) {
      throw new Error('validateConfig should run custom validators');
    }
  });

  // Test 16: loadFromMultipleSources function works
  test('loadFromMultipleSources function works', () => {
    if (typeof loadFromMultipleSources !== 'function') {
      throw new Error('loadFromMultipleSources is not a function');
    }

    const sources = [
      { type: 'object', data: { key1: 'value1', key2: 'value2' } },
      { type: 'object', data: { key2: 'override', key3: 'value3' } },
    ];

    const result = loadFromMultipleSources(sources);

    if (result.key1 !== 'value1' || result.key2 !== 'override' || result.key3 !== 'value3') {
      throw new Error('loadFromMultipleSources should merge sources correctly');
    }
  });

  // Test 17: loadFromMultipleSources handles required sources
  test('loadFromMultipleSources handles required sources', () => {
    const sources = [{ type: 'file', path: '/nonexistent/file.json', required: true }];

    try {
      loadFromMultipleSources(sources);
      throw new Error('Should have thrown error for missing required source');
    } catch (error) {
      if (!error.message.includes('not found')) {
        throw new Error('Should throw file not found error for required source');
      }
    }
  });

  // Test 18: loadFromMultipleSources handles optional sources
  test('loadFromMultipleSources handles optional sources', () => {
    const sources = [
      { type: 'object', data: { key1: 'value1' } },
      { type: 'file', path: '/nonexistent/file.json', required: false },
    ];

    const result = loadFromMultipleSources(sources);

    if (result.key1 !== 'value1') {
      throw new Error('loadFromMultipleSources should handle optional sources gracefully');
    }
  });

  console.log(`\nConfiguration Loader Tests: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('All configuration loader tests passed!');
    process.exit(0);
  } else {
    console.log('Some configuration loader tests failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
