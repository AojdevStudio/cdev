module.exports = {
  // Test environment for integration tests
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '.',

  // Test file patterns - only integration tests
  testMatch: ['<rootDir>/test/integration/**/*.test.js'],

  // Transform files using babel-jest
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.js'],

  // Coverage configuration
  collectCoverage: false, // Disabled by default for speed

  // Performance optimizations - fewer workers for I/O heavy tests
  maxWorkers: 2,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Test timeout (90 seconds for integration tests)
  testTimeout: 90000,

  // Module directories to search for modules
  moduleDirectories: ['node_modules', '<rootDir>'],
};
