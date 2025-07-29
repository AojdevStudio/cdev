module.exports = {
  // Test environment for Node.js and browser compatibility
  testEnvironment: 'jsdom',

  // Root directory for tests
  rootDir: '..',

  // Test file patterns
  testMatch: ['**/__tests__/**/*.(js|jsx|ts|tsx)', '**/*.(test|spec).(js|jsx|ts|tsx)'],

  // File extensions to consider
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Transform files using babel-jest for JS/JSX and ts-jest for TS/TSX
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(ts|tsx)$': ['ts-jest', { isolatedModules: true }],
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
  collectCoverage: true,
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
  ],

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.{js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],

  // Test timeout (60 seconds for slower tests)
  testTimeout: 60000,

  // Performance optimizations
  maxWorkers: '50%',

  // Memory optimization - limit worker memory to prevent crashes
  workerIdleMemoryLimit: '512MB',

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Fail fast on first test failure
  bail: false,

  // Module directories to search for modules
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Additional test environment options
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
};
