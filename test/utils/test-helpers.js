/**
 * Test Helper Utilities
 * Common testing utilities and assertion helpers
 */

const path = require('path');
const fs = require('fs');

/**
 * Creates a temporary test directory
 * @param {string} prefix - Directory prefix
 * @returns {Object} Directory info and cleanup function
 */
function createTempDir(prefix = 'test-') {
  const tempDir = path.join(__dirname, '../../temp', `${prefix}${Date.now()}`);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return {
    path: tempDir,
    cleanup: () => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  };
}

/**
 * Waits for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Maximum wait time in ms
 * @param {number} interval - Check interval in ms
 * @returns {Promise<void>}
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * Creates test data generators
 */
const testData = {
  /**
   * Generates a valid package.json structure
   * @param {Object} overrides - Custom values to override defaults
   * @returns {Object} Package.json object
   */
  packageJson: (overrides = {}) => ({
    name: 'test-project',
    version: '1.0.0',
    description: 'Test project',
    main: 'index.js',
    scripts: {
      test: 'jest',
      start: 'node index.js'
    },
    dependencies: {},
    devDependencies: {
      jest: '^29.0.0'
    },
    ...overrides
  }),
  
  /**
   * Generates a valid tsconfig.json structure
   * @param {Object} overrides - Custom values to override defaults
   * @returns {Object} tsconfig.json object
   */
  tsConfig: (overrides = {}) => ({
    compilerOptions: {
      target: 'es2020',
      module: 'commonjs',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: './dist',
      rootDir: './src'
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
    ...overrides
  }),
  
  /**
   * Generates a valid .env structure
   * @param {Object} vars - Environment variables
   * @returns {string} .env file content
   */
  envFile: (vars = {}) => {
    const defaults = {
      NODE_ENV: 'test',
      PORT: '3000',
      DATABASE_URL: 'postgresql://localhost:5432/test'
    };
    
    const merged = { ...defaults, ...vars };
    
    return Object.entries(merged)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  },
  
  /**
   * Generates a valid Linear issue
   * @param {Object} overrides - Custom values
   * @returns {Object} Linear issue object
   */
  linearIssue: (overrides = {}) => ({
    id: 'TEST-123',
    title: 'Test Issue',
    description: 'This is a test issue',
    state: 'Todo',
    priority: 3,
    assignee: null,
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),
  
  /**
   * Generates hook configuration
   * @param {string} type - Hook type
   * @param {Object} config - Hook config
   * @returns {Object} Hook configuration
   */
  hookConfig: (type = 'pre_tool_use', config = {}) => ({
    type,
    enabled: true,
    priority: 100,
    script: path.join('.claude', 'hooks', type, 'hook.py'),
    ...config
  })
};

/**
 * Custom Jest matchers
 */
const customMatchers = {
  /**
   * Checks if a file exists at the given path
   */
  toExistAsFile(received) {
    const pass = fs.existsSync(received) && fs.statSync(received).isFile();
    
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to exist as a file`
        : `expected ${received} to exist as a file`
    };
  },
  
  /**
   * Checks if a directory exists at the given path
   */
  toExistAsDirectory(received) {
    const pass = fs.existsSync(received) && fs.statSync(received).isDirectory();
    
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to exist as a directory`
        : `expected ${received} to exist as a directory`
    };
  },
  
  /**
   * Checks if a value is within a range
   */
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be within range ${floor} - ${ceiling}`
        : `expected ${received} to be within range ${floor} - ${ceiling}`
    };
  },
  
  /**
   * Checks if an array contains an object matching partial properties
   */
  toContainObjectMatching(received, expected) {
    const pass = received.some(item => {
      return Object.keys(expected).every(key => item[key] === expected[key]);
    });
    
    return {
      pass,
      message: () => pass
        ? `expected array not to contain object matching ${JSON.stringify(expected)}`
        : `expected array to contain object matching ${JSON.stringify(expected)}`
    };
  }
};

/**
 * Assertion helpers
 */
const assert = {
  /**
   * Asserts that a promise rejects with a specific error
   * @param {Promise} promise - Promise to test
   * @param {string|RegExp} error - Expected error message
   */
  async rejects(promise, error) {
    try {
      await promise;
      throw new Error('Expected promise to reject');
    } catch (err) {
      if (error instanceof RegExp) {
        expect(err.message).toMatch(error);
      } else {
        expect(err.message).toBe(error);
      }
    }
  },
  
  /**
   * Asserts that a function throws with a specific error
   * @param {Function} fn - Function to test
   * @param {string|RegExp} error - Expected error message
   */
  throws(fn, error) {
    expect(() => fn()).toThrow(error);
  },
  
  /**
   * Asserts file content matches
   * @param {string} filePath - File path
   * @param {string|RegExp} expected - Expected content
   */
  fileContent(filePath, expected) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (expected instanceof RegExp) {
      expect(content).toMatch(expected);
    } else {
      expect(content).toBe(expected);
    }
  },
  
  /**
   * Asserts JSON file content matches
   * @param {string} filePath - File path
   * @param {Object} expected - Expected JSON object
   */
  jsonFileContent(filePath, expected) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(content).toEqual(expected);
  }
};

/**
 * Test lifecycle helpers
 */
const lifecycle = {
  /**
   * Setup test environment
   * @param {Object} options - Setup options
   */
  async setup(options = {}) {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset modules if needed
    if (options.resetModules) {
      jest.resetModules();
    }
    
    // Clear module cache for specific modules
    if (options.clearCache) {
      const modules = Array.isArray(options.clearCache) ? options.clearCache : [options.clearCache];
      modules.forEach(mod => {
        delete require.cache[require.resolve(mod)];
      });
    }
  },
  
  /**
   * Cleanup test environment
   * @param {Object} options - Cleanup options
   */
  async cleanup(options = {}) {
    // Restore all mocks
    jest.restoreAllMocks();
    
    // Clear timers
    if (options.clearTimers) {
      jest.clearAllTimers();
    }
    
    // Use real timers
    if (options.useRealTimers) {
      jest.useRealTimers();
    }
  }
};

/**
 * Spy helpers
 */
const spyHelpers = {
  /**
   * Creates a spy that tracks calls with formatted output
   * @param {Object} obj - Object to spy on
   * @param {string} method - Method name
   * @returns {Object} Spy with helpers
   */
  trackCalls(obj, method) {
    const spy = jest.spyOn(obj, method);
    
    return {
      spy,
      calls: () => spy.mock.calls,
      callCount: () => spy.mock.calls.length,
      lastCall: () => spy.mock.calls[spy.mock.calls.length - 1],
      nthCall: (n) => spy.mock.calls[n - 1],
      calledWith: (...args) => spy.mock.calls.some(call => 
        JSON.stringify(call) === JSON.stringify(args)
      ),
      clear: () => spy.mockClear(),
      restore: () => spy.mockRestore()
    };
  }
};

// Setup custom matchers
if (typeof expect !== 'undefined') {
  expect.extend(customMatchers);
}

module.exports = {
  createTempDir,
  waitFor,
  testData,
  customMatchers,
  assert,
  lifecycle,
  spyHelpers
};