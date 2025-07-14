/**
 * Tests for validator.js and related validation modules
 */

const { validator, Validator } = require('../src/validator');
const { preInstallValidator } = require('../src/pre-install-validator');
const { postInstallValidator } = require('../src/post-install-validator');
const { validationReporter } = require('../src/validation-reporter');
const { ValidationErrorCollection } = require('../src/validation-errors');

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('../src/platform-utils', () => ({
  platformUtils: {
    isWindows: false,
    isMacOS: false,
    isLinux: true,
    getSystemInfo: () => ({
      platform: 'linux',
      arch: 'x64',
      npmVersion: '8.0.0',
    }),
    executeCommand: jest.fn(),
    getFilePermissions: jest.fn(),
    getNpmVersion: () => '8.0.0',
  },
}));

jest.mock('../src/python-detector', () => ({
  pythonDetector: {
    getBestPython: jest.fn(),
  },
}));

const { platformUtils } = require('../src/platform-utils');
const { pythonDetector } = require('../src/python-detector');

const fs = require('fs');
const { execSync } = require('child_process');

describe('Validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('schema validation', () => {
    test('validates simple schema', () => {
      const schema = {
        name: ['required', 'string'],
        age: ['required', 'number', { rule: 'min', min: 0 }],
        email: ['required', 'email'],
      };

      validator.defineSchema('user', schema);

      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = validator.validate(validData, 'user');
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    test('catches validation errors', () => {
      const schema = {
        name: ['required', 'string'],
        age: ['required', 'number'],
        email: ['required', 'email'],
      };

      validator.defineSchema('user', schema);

      const invalidData = {
        name: '',
        age: 'not a number',
        email: 'invalid-email',
      };

      const result = validator.validate(invalidData, 'user');
      expect(result.isValid).toBe(false);
      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.errorMessages).toContain("Field 'name' is required");
    });

    test('validates nested objects', () => {
      const schema = {
        'user.name': ['required', 'string'],
        'user.contact.email': ['required', 'email'],
        'user.contact.phone': ['string', { rule: 'pattern', pattern: /^\d{3}-\d{3}-\d{4}$/ }],
      };

      validator.defineSchema('profile', schema);

      const validData = {
        user: {
          name: 'John Doe',
          contact: {
            email: 'john@example.com',
            phone: '123-456-7890',
          },
        },
      };

      const result = validator.validate(validData, 'profile');
      expect(result.isValid).toBe(true);
    });
  });

  describe('quick validation methods', () => {
    test('isValid method works correctly', () => {
      expect(validator.isValid('test@example.com', 'email')).toBe(true);
      expect(validator.isValid('invalid-email', 'email')).toBe(false);
      expect(validator.isValid(123, 'number')).toBe(true);
      expect(validator.isValid('123', 'number')).toBe(false);
    });

    test('validateRequired method works correctly', () => {
      const data = {
        name: 'John',
        age: 30,
        email: '',
      };

      const result = validator.validateRequired(data, ['name', 'age', 'email']);
      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain("Field 'email' is required");
    });
  });
});

describe('PreInstallValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mocks
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.unlinkSync.mockImplementation(() => {});
  });

  describe('validate', () => {
    test('passes all validations when requirements are met', async () => {
      // Mock successful conditions
      pythonDetector.getBestPython.mockReturnValue({
        version: '3.9.0',
        path: '/usr/bin/python3',
        hasPip: true,
      });

      platformUtils.executeCommand.mockImplementation((cmd) => {
        if (cmd.includes('git --version')) {
          return { success: true, output: 'git version 2.30.0' };
        }
        return { success: true, output: '' };
      });

      execSync.mockImplementation((cmd) => {
        if (cmd.includes('df -BM')) {
          return '   1000M';
        }
        return '';
      });

      const result = await preInstallValidator.validate();

      expect(result.valid).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.details.node.valid).toBe(true);
      expect(result.details.python.valid).toBe(true);
      expect(result.details.git.valid).toBe(true);
    });

    test('fails validation when requirements not met', async () => {
      // Mock Node version below requirement
      Object.defineProperty(process, 'version', { value: 'v14.0.0', configurable: true });

      // Mock missing Python
      pythonDetector.getBestPython.mockReturnValue(null);

      // Mock missing Git
      platformUtils.executeCommand.mockImplementation((cmd) => {
        if (cmd.includes('git')) {
          return { success: false, output: '', error: 'command not found' };
        }
        return { success: true, output: '' };
      });

      const result = await preInstallValidator.validate();

      expect(result.valid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.errors.hasErrors()).toBe(true);
    });

    test('generates warnings for optional components', async () => {
      // Python is optional but missing
      pythonDetector.getBestPython.mockReturnValue(null);

      platformUtils.executeCommand.mockImplementation((cmd) => {
        if (cmd.includes('git --version')) {
          return { success: true, output: 'git version 2.30.0' };
        }
        return { success: true, output: '' };
      });

      const result = await preInstallValidator.validate();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Python');
    });
  });

  describe('getReport', () => {
    test('generates readable report', async () => {
      pythonDetector.getBestPython.mockReturnValue({
        version: '3.9.0',
        path: '/usr/bin/python3',
        hasPip: true,
      });

      platformUtils.executeCommand.mockReturnValue({
        success: true,
        output: 'git version 2.30.0',
      });

      const result = await preInstallValidator.validate();
      const report = preInstallValidator.getReport(result);

      expect(report).toContain('Pre-Installation Validation Report');
      expect(report).toContain('Overall Status');
      expect(report).toContain('Component Checks');
    });
  });
});

describe('PostInstallValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mock content');
  });

  describe('validate', () => {
    test('validates successful installation', async () => {
      // Mock successful CLI command
      platformUtils.executeCommand.mockImplementation((cmd) => {
        if (cmd.includes('claude-code-hooks --version')) {
          return { success: true, output: '1.0.0' };
        }
        if (cmd.includes('npm list -g')) {
          return { success: true, output: 'claude-code-hooks@1.0.0' };
        }
        if (cmd.includes('python') && cmd.includes('--help')) {
          return { success: true, output: 'usage: hook' };
        }
        return { success: true, output: '' };
      });

      // Mock file permissions
      platformUtils.getFilePermissions.mockReturnValue({
        readable: true,
        writable: true,
        executable: true,
      });

      pythonDetector.getBestPython.mockReturnValue({
        version: '3.9.0',
        path: '/usr/bin/python3',
      });

      const result = await postInstallValidator.validate();

      expect(result.valid).toBe(true);
      expect(result.successRate).toBe(100);
      expect(result.details.cliCommand.valid).toBe(true);
      expect(result.details.globalPackage.valid).toBe(true);
    });

    test('detects missing components', async () => {
      // Mock missing CLI
      platformUtils.executeCommand.mockImplementation((cmd) => {
        if (cmd.includes('claude-code-hooks')) {
          return { success: false, error: 'command not found' };
        }
        return { success: true, output: '' };
      });

      // Mock missing directories
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('.claude')) {
          return false;
        }
        return true;
      });

      const result = await postInstallValidator.validate();

      expect(result.valid).toBe(false);
      expect(result.details.cliCommand.valid).toBe(false);
      expect(result.details.projectStructure.valid).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('validates hook functionality', async () => {
      pythonDetector.getBestPython.mockReturnValue({
        version: '3.9.0',
        path: '/usr/bin/python3',
      });

      platformUtils.executeCommand.mockImplementation((cmd) => {
        if (cmd.includes('python') && cmd.includes('.py')) {
          return { success: true, output: 'Hook help text' };
        }
        return { success: true, output: '' };
      });

      fs.readFileSync.mockImplementation((path) => {
        if (path.endsWith('.py')) {
          return '#!/usr/bin/env python\n# Hook script';
        }
        return 'content';
      });

      const result = await postInstallValidator.validate();

      expect(result.details.pythonHooks.valid).toBe(true);
    });
  });

  describe('quickCheck', () => {
    test('performs quick validation check', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: true,
        output: '1.0.0',
      });

      const result = await postInstallValidator.quickCheck();
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('ValidationReporter', () => {
  describe('formatting methods', () => {
    test('formats success messages', () => {
      const message = validationReporter.success('Installation complete');
      expect(message).toContain('Installation complete');
      expect(message).toContain(validationReporter.symbols.success);
    });

    test('formats error messages', () => {
      const message = validationReporter.error('Installation failed');
      expect(message).toContain('Installation failed');
      expect(message).toContain(validationReporter.symbols.error);
    });

    test('formats warning messages', () => {
      const message = validationReporter.warning('Python not found');
      expect(message).toContain('Python not found');
      expect(message).toContain(validationReporter.symbols.warning);
    });

    test('formats info messages', () => {
      const message = validationReporter.info('Checking dependencies');
      expect(message).toContain('Checking dependencies');
      expect(message).toContain(validationReporter.symbols.info);
    });
  });

  describe('progress reporting', () => {
    test('generates progress report', () => {
      const progress = validationReporter.progressReport(
        'Installation',
        50,
        100,
        'Installing hooks',
      );
      expect(progress).toContain('Installation');
      expect(progress).toContain('50%');
      expect(progress).toContain('Installing hooks');
    });
  });

  describe('table formatting', () => {
    test('formats data as table', () => {
      const data = [
        { component: 'Node.js', status: 'OK', version: '16.0.0' },
        { component: 'Python', status: 'OK', version: '3.9.0' },
      ];
      const headers = ['component', 'status', 'version'];

      const table = validationReporter.table(data, headers);
      expect(table).toContain('Node.js');
      expect(table).toContain('Python');
      expect(table).toContain('16.0.0');
      expect(table).toContain('3.9.0');
    });

    test('handles empty data', () => {
      const table = validationReporter.table([], ['header1', 'header2']);
      expect(table).toBe('');
    });
  });

  describe('box formatting', () => {
    test('creates formatted box', () => {
      const box = validationReporter.box('Summary', ['All tests passed', 'Ready to use']);

      expect(box).toContain('Summary');
      expect(box).toContain('All tests passed');
      expect(box).toContain('Ready to use');
    });
  });

  describe('report generation', () => {
    test('generates pre-install report', async () => {
      const validationResult = {
        valid: true,
        canProceed: true,
        details: {
          system: { valid: true, platform: 'linux', arch: 'x64' },
          node: { valid: true, version: '16.0.0', minVersion: '16.0.0', required: true },
          npm: { valid: true, version: '8.0.0', required: true },
          python: { valid: true, version: '3.9.0', required: false },
          git: { valid: true, version: '2.30.0', required: true },
          permissions: { valid: true, required: true },
          diskSpace: { valid: true, availableMB: 500, required: true },
          network: { valid: true, required: false },
        },
        warnings: [],
        errors: new ValidationErrorCollection(),
      };

      const report = validationReporter.preInstallReport(validationResult);
      expect(report).toContain('Pre-Installation Validation Report');
      expect(report).toContain('READY TO INSTALL');
    });

    test('generates post-install report', async () => {
      const validationResult = {
        valid: true,
        successRate: 100,
        details: {
          cliCommand: { valid: true, command: 'claude-code-hooks' },
          globalPackage: { valid: true, version: '1.0.0' },
          projectStructure: { valid: true },
          hooks: { valid: true },
          permissions: { valid: true },
          configuration: { valid: true },
          pythonHooks: { valid: true },
        },
        recommendations: [],
        errors: new ValidationErrorCollection(),
      };

      const report = validationReporter.postInstallReport(validationResult);
      expect(report).toContain('Post-Installation Validation Report');
      expect(report).toContain('100% Complete');
    });
  });
});
