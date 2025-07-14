// Jest setup file for global test configuration
// This file is run before all tests to configure the testing environment

// Import testing-library/jest-dom for custom matchers
require('@testing-library/jest-dom');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Global test utilities
// Store original console methods
const originalConsole = { ...console };

// Create mock console methods
global.console = {
  ...originalConsole,
  // Suppress expected console.log during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for API testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  }),
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Note: window.location is provided by JSDOM and cannot be overridden
// Tests that need to mock location behavior should use jest.spyOn or other approaches
// For example: jest.spyOn(window.location, 'assign').mockImplementation(() => {})

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for components that use it
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock File and FileList for file upload tests
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileList = class MockFileList {
  constructor(files) {
    this.files = files;
    this.length = files.length;

    // Make it iterable
    files.forEach((file, index) => {
      this[index] = file;
    });
  }

  item(index) {
    return this.files[index] || null;
  }
};

// Mock URL.createObjectURL and URL.revokeObjectURL for file handling
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Custom test utilities
global.waitForNextTick = () => new Promise((resolve) => process.nextTick(resolve));

// Global test configuration
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset fetch mock
  fetch.mockClear();

  // Reset localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Reset console mocks
  if (console.log.mockClear) {
    console.log.mockClear();
  }
  if (console.error.mockClear) {
    console.error.mockClear();
  }
  if (console.warn.mockClear) {
    console.warn.mockClear();
  }
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// Suppress specific warnings during tests
const originalError = originalConsole.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render is deprecated')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
