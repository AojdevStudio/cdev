/**
 * Jest setup file for global test configurations
 */

// Increase timeout for all tests to prevent timeout issues
jest.setTimeout(60000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep these methods for debugging
  error: jest.fn(console.error),
  warn: jest.fn(console.warn),
  // Silence these during tests
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  toBeValidPath(received) {
    const pass = typeof received === 'string' && received.length > 0;
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid path`
        : `expected ${received} to be a valid path`
    };
  },
  
  // Custom matcher to compare strings ignoring whitespace differences
  toEqualIgnoringWhitespace(received, expected) {
    const normalize = str => str.replace(/\s+/g, ' ').trim();
    const normalizedReceived = normalize(received);
    const normalizedExpected = normalize(expected);
    const pass = normalizedReceived === normalizedExpected;
    
    if (pass) {
      return {
        message: () =>
          `expected "${received}" not to equal "${expected}" (ignoring whitespace)`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected "${received}" to equal "${expected}" (ignoring whitespace)`,
        pass: false,
      };
    }
  },
  
  // Custom matcher for multiline strings with flexible whitespace
  toContainIgnoringWhitespace(received, expected) {
    // Only normalize consecutive spaces, not other whitespace like newlines
    const normalize = str => str.replace(/[ ]+/g, ' ').trim();
    const normalizedReceived = normalize(received);
    const normalizedExpected = normalize(expected);
    const pass = normalizedReceived.includes(normalizedExpected);
    
    if (pass) {
      return {
        message: () =>
          `expected "${received}" not to contain "${expected}" (ignoring whitespace)`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected "${received}" to contain "${expected}" (ignoring whitespace)`,
        pass: false,
      };
    }
  },
  
  // Custom matcher for exact line matching with flexible indentation
  toContainLineIgnoringIndent(received, expected) {
    const lines = received.split('\n');
    const expectedTrimmed = expected.trim();
    const pass = lines.some(line => line.trim() === expectedTrimmed);
    
    if (pass) {
      return {
        message: () =>
          `expected output not to contain line "${expected}" (ignoring indentation)`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected output to contain line "${expected}" (ignoring indentation)`,
        pass: false,
      };
    }
  }
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to flush promises
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
  
  // Helper to create mock file system
  createMockFs: () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    readdirSync: jest.fn(),
    statSync: jest.fn(),
    unlinkSync: jest.fn(),
    copyFileSync: jest.fn(),
  })
};