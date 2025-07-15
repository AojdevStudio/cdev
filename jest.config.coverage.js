module.exports = {
  // Extend the main config
  ...require('./jest.config.js'),

  // Enable coverage collection
  collectCoverage: true,

  // Use v8 coverage provider for better performance
  coverageProvider: 'v8',

  // Coverage configuration
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Paths to ignore for coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/',
    '/shared/',
    '/templates/',
    '/ai_docs/',
    '/workspaces/',
    '/test/',
  ],

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'bin/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.{js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.test.js',
  ],

  // Run tests serially when collecting coverage
  maxWorkers: 1,
};
