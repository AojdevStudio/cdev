/**
 * Mock Factory Utilities for Testing
 * Provides consistent mock creation for common testing scenarios
 */

const path = require('path');

/**
 * Creates a mock file system structure
 * @param {Object} structure - Object representing file structure
 * @returns {Object} Mock fs module
 */
function createMockFileSystem(structure = {}) {
  const mockFs = {
    existsSync: jest.fn((filePath) => {
      const normalizedPath = path.normalize(filePath);
      return Object.prototype.hasOwnProperty.call(structure, normalizedPath);
    }),

    readFileSync: jest.fn((filePath, encoding) => {
      const normalizedPath = path.normalize(filePath);
      if (!structure[normalizedPath]) {
        throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      }
      return structure[normalizedPath];
    }),

    writeFileSync: jest.fn((filePath, content, options) => {
      const normalizedPath = path.normalize(filePath);
      structure[normalizedPath] = content;
    }),

    mkdirSync: jest.fn((dirPath, options) => {
      const normalizedPath = path.normalize(dirPath);
      structure[normalizedPath] = '[directory]';
    }),

    readdirSync: jest.fn((dirPath) => {
      const normalizedPath = path.normalize(dirPath);
      const entries = [];
      const prefix = normalizedPath.endsWith(path.sep) ? normalizedPath : normalizedPath + path.sep;

      for (const key of Object.keys(structure)) {
        if (key.startsWith(prefix)) {
          const relativePath = key.slice(prefix.length);
          const firstPart = relativePath.split(path.sep)[0];
          if (firstPart && !entries.includes(firstPart)) {
            entries.push(firstPart);
          }
        }
      }

      return entries;
    }),

    statSync: jest.fn((filePath) => {
      const normalizedPath = path.normalize(filePath);
      if (!structure[normalizedPath]) {
        throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`);
      }

      return {
        isFile: () => structure[normalizedPath] !== '[directory]',
        isDirectory: () => structure[normalizedPath] === '[directory]',
        mode: 0o755,
        size: structure[normalizedPath] === '[directory]' ? 0 : structure[normalizedPath].length,
      };
    }),

    chmodSync: jest.fn(),
    unlinkSync: jest.fn((filePath) => {
      const normalizedPath = path.normalize(filePath);
      delete structure[normalizedPath];
    }),
    copyFileSync: jest.fn((src, dest) => {
      const normalizedSrc = path.normalize(src);
      const normalizedDest = path.normalize(dest);
      structure[normalizedDest] = structure[normalizedSrc];
    }),
  };

  return mockFs;
}

/**
 * Creates a mock child_process module
 * @param {Object} responses - Command responses mapping
 * @returns {Object} Mock child_process module
 */
function createMockChildProcess(responses = {}) {
  return {
    execSync: jest.fn((command, options) => {
      // Check for exact match first
      if (responses[command]) {
        return responses[command];
      }

      // Check for partial matches
      for (const [key, value] of Object.entries(responses)) {
        if (command.includes(key)) {
          return value;
        }
      }

      // Default response
      return '';
    }),

    exec: jest.fn((command, options, callback) => {
      const cb = callback || options;

      if (responses[command]) {
        process.nextTick(() => cb(null, responses[command], ''));
      } else {
        process.nextTick(() => cb(new Error(`Command failed: ${command}`), '', 'Error'));
      }
    }),

    spawn: jest.fn((command, args, options) => {
      const mockProcess = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data' && responses[command]) {
              process.nextTick(() => callback(Buffer.from(responses[command])));
            }
          }),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            process.nextTick(() => callback(0));
          }
        }),
        kill: jest.fn(),
      };

      return mockProcess;
    }),
  };
}

/**
 * Creates a mock inquirer module
 * @param {Object} answers - Predefined answers for prompts
 * @returns {Object} Mock inquirer module
 */
function createMockInquirer(answers = {}) {
  return {
    prompt: jest.fn(async (questions) => {
      const result = {};

      const questionArray = Array.isArray(questions) ? questions : [questions];

      for (const question of questionArray) {
        if (answers[question.name] !== undefined) {
          result[question.name] = answers[question.name];
        } else if (question.default !== undefined) {
          result[question.name] = question.default;
        } else {
          result[question.name] = null;
        }
      }

      return result;
    }),
  };
}

/**
 * Creates a mock platform with specified characteristics
 * @param {string} platform - Platform name (win32, darwin, linux)
 * @returns {Object} Mock platform utilities
 */
function createMockPlatform(platform = 'linux') {
  const originalPlatform = process.platform;

  return {
    setup: () => {
      Object.defineProperty(process, 'platform', {
        value: platform,
        writable: true,
        configurable: true,
      });
    },

    restore: () => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
        configurable: true,
      });
    },

    mockOs: {
      platform: jest.fn(() => platform),
      homedir: jest.fn(() => (platform === 'win32' ? 'C:\\Users\\test' : '/home/test')),
      userInfo: jest.fn(() => ({
        username: 'testuser',
        homedir: platform === 'win32' ? 'C:\\Users\\test' : '/home/test',
      })),
      type: jest.fn(() => {
        switch (platform) {
          case 'win32':
            return 'Windows_NT';
          case 'darwin':
            return 'Darwin';
          default:
            return 'Linux';
        }
      }),
      release: jest.fn(() => '10.0.0'),
      arch: jest.fn(() => 'x64'),
      cpus: jest.fn(() => [{ model: 'Test CPU' }]),
      totalmem: jest.fn(() => 8 * 1024 * 1024 * 1024),
      freemem: jest.fn(() => 4 * 1024 * 1024 * 1024),
    },
  };
}

/**
 * Creates a mock logger
 * @returns {Object} Mock logger with jest spies
 */
function createMockLogger() {
  return {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    debug: jest.fn(),
  };
}

/**
 * Creates mock environment variables
 * @param {Object} vars - Environment variables to set
 * @returns {Object} Mock env handler
 */
function createMockEnv(vars = {}) {
  const originalEnv = { ...process.env };

  return {
    setup: () => {
      process.env = { ...originalEnv, ...vars };
    },

    restore: () => {
      process.env = originalEnv;
    },

    get: (key) => process.env[key],

    set: (key, value) => {
      process.env[key] = value;
    },
  };
}

/**
 * Creates a mock HTTP client
 * @param {Object} responses - URL to response mapping
 * @returns {Object} Mock HTTP client
 */
function createMockHttpClient(responses = {}) {
  return {
    get: jest.fn((url) => {
      if (responses[url]) {
        return Promise.resolve({
          data: responses[url],
          status: 200,
          statusText: 'OK',
        });
      }

      return Promise.reject(new Error(`404: Not Found - ${url}`));
    }),

    post: jest.fn((url, data) => {
      if (responses[url]) {
        return Promise.resolve({
          data: responses[url],
          status: 201,
          statusText: 'Created',
        });
      }

      return Promise.reject(new Error(`404: Not Found - ${url}`));
    }),
  };
}

/**
 * Creates a mock timer controller
 * @returns {Object} Timer control methods
 */
function createMockTimers() {
  jest.useFakeTimers();

  return {
    advance: (ms) => jest.advanceTimersByTime(ms),
    runAll: () => jest.runAllTimers(),
    runPending: () => jest.runOnlyPendingTimers(),
    clear: () => jest.clearAllTimers(),
    restore: () => jest.useRealTimers(),
  };
}

module.exports = {
  createMockFileSystem,
  createMockChildProcess,
  createMockInquirer,
  createMockPlatform,
  createMockLogger,
  createMockEnv,
  createMockHttpClient,
  createMockTimers,
};
