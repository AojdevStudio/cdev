module.exports = {
  // Test environment for tests that need DOM
  testEnvironment: 'jsdom',

  // Root directory for tests
  rootDir: '.',

  // Test file patterns - only DOM-related tests
  testMatch: ['<rootDir>/src/hook-selector.test.js'],

  // Transform files using babel-jest
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Module name mapping for CSS modules and static assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'jest-transform-stub',
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.js', '<rootDir>/test/jest-setup.js'],

  // Coverage configuration
  collectCoverage: false, // Disabled by default for speed

  // Performance optimizations - fewer workers for DOM tests
  maxWorkers: 2,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Test timeout (30 seconds for DOM tests)
  testTimeout: 30000,

  // Module directories to search for modules
  moduleDirectories: ['node_modules', '<rootDir>'],
};
