module.exports = {
  // Test environment for pure Node.js tests (faster, less memory)
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '..',

  // Test file patterns - only unit tests
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/bin/**/*.test.js',
    '<rootDir>/scripts/**/*.test.js',
  ],

  // Exclude integration tests and DOM tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test/integration/',
    'hook-selector.test.js', // This uses DOM
    'config.test.js', // Not a test file
    'cli-parser.test.js', // Empty test suite
    'cli-commands.test.js', // Empty test suite
    'bin/cli.test.js', // Empty test suite
  ],

  // Transform files using babel-jest
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.js'],

  // Coverage configuration
  collectCoverage: false, // Disabled by default for speed

  // Performance optimizations
  maxWorkers: '50%',

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Test timeout (30 seconds for unit tests)
  testTimeout: 30000,

  // Module directories to search for modules
  moduleDirectories: ['node_modules', '<rootDir>'],
};
