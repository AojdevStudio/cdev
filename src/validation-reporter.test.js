/**
 * Tests for ValidationReporter
 */

const { ValidationReporter, validationReporter } = require('./validation-reporter');
const { platformUtils } = require('./platform-utils');

// Mock dependencies
jest.mock('./platform-utils', () => ({
  platformUtils: {
    isWindows: false,
  },
}));

// Mock chalk before requiring the module
jest.mock('chalk', () => ({
  green: jest.fn((s) => `[GREEN]${s}[/GREEN]`),
  red: jest.fn((s) => `[RED]${s}[/RED]`),
  yellow: jest.fn((s) => `[YELLOW]${s}[/YELLOW]`),
  blue: jest.fn((s) => `[BLUE]${s}[/BLUE]`),
  dim: jest.fn((s) => `[DIM]${s}[/DIM]`),
  bold: jest.fn((s) => `[BOLD]${s}[/BOLD]`),
}));

describe('ValidationReporter', () => {
  let reporter;
  let originalStdoutIsTTY;
  let originalNoColor;
  let stdoutWriteSpy;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Save original values
    originalStdoutIsTTY = process.stdout.isTTY;
    originalNoColor = process.env.NO_COLOR;

    // Mock stdout
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Default to TTY with color support
    process.stdout.isTTY = true;
    delete process.env.NO_COLOR;

    // Clear module cache to ensure fresh instances
    jest.resetModules();
  });

  afterEach(() => {
    process.stdout.isTTY = originalStdoutIsTTY;
    process.env.NO_COLOR = originalNoColor;
    stdoutWriteSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    test('enables colors when TTY and chalk available', () => {
      reporter = new ValidationReporter();

      expect(reporter.supportsColor).toBe(true);
      expect(reporter.colors.success('test')).toBe('[GREEN]test[/GREEN]');
    });

    test('disables colors when NO_COLOR is set', () => {
      process.env.NO_COLOR = '1';
      const { ValidationReporter } = require('./validation-reporter');
      reporter = new ValidationReporter();

      expect(reporter.supportsColor).toBe(false);
      expect(reporter.colors.success('test')).toBe('test');
    });

    test('disables colors when not TTY', () => {
      process.stdout.isTTY = false;
      const { ValidationReporter } = require('./validation-reporter');
      reporter = new ValidationReporter();

      expect(reporter.supportsColor).toBe(false);
      expect(reporter.colors.success('test')).toBe('test');
    });

    test('handles missing chalk gracefully', () => {
      jest.doMock('chalk', () => {
        throw new Error('Cannot find module');
      });

      const { ValidationReporter } = require('./validation-reporter');
      reporter = new ValidationReporter();

      expect(reporter.supportsColor).toBe(false);
      expect(reporter.colors.success('test')).toBe('test');
    });

    test('uses Windows-specific symbols on Windows', () => {
      platformUtils.isWindows = true;
      reporter = new ValidationReporter();

      expect(reporter.symbols.success).toBe('√');
      expect(reporter.symbols.error).toBe('×');
      expect(reporter.symbols.warning).toBe('!');
      expect(reporter.symbols.info).toBe('i');
      expect(reporter.symbols.arrow).toBe('->');
      expect(reporter.symbols.bullet).toBe('*');
    });

    test('uses Unicode symbols on non-Windows', () => {
      platformUtils.isWindows = false;
      reporter = new ValidationReporter();

      expect(reporter.symbols.success).toBe('✓');
      expect(reporter.symbols.error).toBe('✗');
      expect(reporter.symbols.warning).toBe('⚠');
      expect(reporter.symbols.info).toBe('ℹ');
      expect(reporter.symbols.arrow).toBe('→');
      expect(reporter.symbols.bullet).toBe('•');
    });
  });

  describe('preInstallReport', () => {
    let reporter;

    beforeEach(() => {
      reporter = new ValidationReporter();
    });

    test('generates report for valid installation', () => {
      const validationResult = {
        valid: true,
        canProceed: true,
        details: {
          system: { platform: 'darwin', arch: 'x64' },
          node: { valid: true, version: '18.0.0', required: true },
          npm: { valid: true, version: '9.0.0', required: true },
          python: { valid: true, version: '3.9.0', required: false },
          git: { valid: true, version: '2.30.0', required: true },
          permissions: { valid: true, required: true },
          diskSpace: { valid: true, required: true },
          network: { valid: true, required: false },
        },
        warnings: [],
        errors: null,
      };

      const report = reporter.preInstallReport(validationResult);

      // Debug: Log the actual report to see the formatting
      // console.log('ACTUAL REPORT:\n', report);

      expect(report).toContain('Pre-Installation Validation Report');
      expect(report).toContain('[GREEN]✓ Overall Status: READY TO INSTALL[/GREEN]');
      expect(report).toContain('Platform: darwin (x64)');
      // The actual output has extra spaces before the checkmark
      expect(report).toContain('[GREEN]  ✓ Node.js (required)[/GREEN]');
      expect(report).toContain('Version: 18.0.0');
      expect(report).toContain('Run "npm install -g claude-code-hooks" to install');
    });

    test('generates report for failed installation', () => {
      const mockErrors = {
        hasErrors: () => true,
        getErrorMessages: () => ['Node.js version too old', 'Git not found'],
      };

      const validationResult = {
        valid: false,
        canProceed: false,
        details: {
          system: { platform: 'linux', arch: 'x64' },
          node: {
            valid: false,
            version: '14.0.0',
            minVersion: '16.0.0',
            required: true,
            message: 'Version 14.0.0 is below minimum required 16.0.0',
          },
          npm: { valid: true, version: '7.0.0', required: true },
          python: { valid: false, version: null, required: false, message: 'Python not found' },
          git: { valid: false, version: null, required: true, message: 'Git not found' },
          permissions: { valid: true, required: true },
          diskSpace: { valid: true, required: true },
          network: { valid: true, required: false },
        },
        warnings: ['Python not found but is optional'],
        errors: mockErrors,
      };

      const report = reporter.preInstallReport(validationResult);

      expect(report).toContain('[RED]✗ Overall Status: CANNOT INSTALL[/RED]');
      expect(report).toContain('[RED]✗ Installation blocked due to missing requirements[/RED]');
      expect(report).toContain('[RED]  ✗ Node.js (required)[/RED]');
      expect(report).toContain('Required: 16.0.0 or higher');
      expect(report).toContain('[RED]  ✗ Git (required)[/RED]');
      expect(report).toContain('Warnings:');
      expect(report).toContain('[YELLOW]  ⚠ Python not found but is optional[/YELLOW]');
      expect(report).toContain('Errors:');
      expect(report).toContain('[RED]  ✗ Node.js version too old[/RED]');
      expect(report).toContain('Fix the errors above before installing');
      expect(report).toContain('Install Node.js 16.0.0+ from https://nodejs.org');
      expect(report).toContain('Install Git from https://git-scm.com');
    });

    test('handles missing warnings and errors gracefully', () => {
      const validationResult = {
        valid: true,
        canProceed: true,
        details: {
          system: { platform: 'win32', arch: 'x64' },
          node: { valid: true, version: '18.0.0', required: true },
          npm: { valid: true, version: '9.0.0', required: true },
          python: { valid: true, version: '3.9.0', required: false },
          git: { valid: true, version: '2.30.0', required: true },
          permissions: { valid: true, required: true },
          diskSpace: { valid: true, required: true },
          network: { valid: true, required: false },
        },
      };

      const report = reporter.preInstallReport(validationResult);

      expect(report).not.toContain('Warnings:');
      expect(report).not.toContain('Errors:');
    });
  });

  describe('postInstallReport', () => {
    let reporter;

    beforeEach(() => {
      reporter = new ValidationReporter();
    });

    test('generates report for successful installation', () => {
      const validationResult = {
        valid: true,
        successRate: 100,
        details: {
          cliCommand: { valid: true, version: '1.0.0' },
          globalPackage: { valid: true },
          projectStructure: { valid: true },
          hooks: { valid: true },
          permissions: { valid: true },
          configuration: { valid: true },
          pythonHooks: { valid: true },
        },
        recommendations: [],
      };

      const report = reporter.postInstallReport(validationResult);

      expect(report).toContain('Post-Installation Validation Report');
      expect(report).toContain('[GREEN]✓ Installation Status: 100% Complete[/GREEN]');
      expect(report).toContain('[GREEN]  ✓ CLI Command[/GREEN]');
      expect(report).toContain('Version: 1.0.0');
      expect(report).toContain('Quick Start:');
      expect(report).toContain('Run "claude-code-hooks --help"');
      expect(report).toContain('Run "claude-code-hooks init"');
      expect(report).toContain('Run "claude-code-hooks linear TASK-123"');
    });

    test('generates report for partial installation', () => {
      const validationResult = {
        valid: false,
        successRate: 75,
        details: {
          cliCommand: { valid: true },
          globalPackage: { valid: true },
          projectStructure: {
            valid: false,
            message: 'Some directories are missing',
            missingDirs: ['.claude/hooks', '.claude/commands'],
          },
          hooks: {
            valid: false,
            message: 'Some hooks are missing',
            missingHooks: ['pre-bash-validator.py', 'typescript-validator.py'],
          },
          permissions: { valid: true },
          configuration: { valid: true },
          pythonHooks: { valid: false, message: 'Python hooks not executable' },
        },
        recommendations: [
          'Run "claude-code-hooks repair" to fix missing components',
          'Check file permissions for Python hooks',
        ],
      };

      const report = reporter.postInstallReport(validationResult);

      expect(report).toContain('[RED]✗ Installation Status: 75% Complete[/RED]');
      expect(report).toContain('[RED]  ✗ Project Structure[/RED]');
      expect(report).toContain('Missing: .claude/hooks, .claude/commands');
      expect(report).toContain('[RED]  ✗ Hooks[/RED]');
      expect(report).toContain('Missing: pre-bash-validator.py, typescript-validator.py');
      expect(report).toContain('Recommendations:');
      expect(report).toContain('1. Run "claude-code-hooks repair"');
      expect(report).toContain('2. Check file permissions');
      expect(report).not.toContain('Quick Start:'); // Not shown for invalid installation
    });
  });

  describe('progressReport', () => {
    let reporter;

    beforeEach(() => {
      reporter = new ValidationReporter();
    });

    test('generates progress bar at different percentages', () => {
      let progress;

      // 0%
      progress = reporter.progressReport('Installing', 0, 10, 'Starting...');
      expect(progress).toContain('[DIM]░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░[/DIM]');
      expect(progress).toContain('0% - Starting...');

      // 50%
      progress = reporter.progressReport('Installing', 5, 10, 'Halfway there');
      expect(progress).toContain('[GREEN]███████████████[/GREEN]');
      expect(progress).toContain('[DIM]░░░░░░░░░░░░░░░[/DIM]');
      expect(progress).toContain('50% - Halfway there');

      // 100%
      progress = reporter.progressReport('Installing', 10, 10, 'Complete!');
      expect(progress).toContain('[GREEN]██████████████████████████████[/GREEN]');
      expect(progress).toContain('100% - Complete!');
    });
  });

  describe('simple message methods', () => {
    let reporter;

    beforeEach(() => {
      reporter = new ValidationReporter();
    });

    test('success message', () => {
      const msg = reporter.success('Operation completed');
      expect(msg).toBe('[GREEN]✓ Operation completed[/GREEN]');
    });

    test('error message', () => {
      const msg = reporter.error('Operation failed');
      expect(msg).toBe('[RED]✗ Operation failed[/RED]');
    });

    test('warning message', () => {
      const msg = reporter.warning('Proceed with caution');
      expect(msg).toBe('[YELLOW]⚠ Proceed with caution[/YELLOW]');
    });

    test('info message', () => {
      const msg = reporter.info('For your information');
      expect(msg).toBe('[BLUE]ℹ For your information[/BLUE]');
    });
  });

  describe('table', () => {
    let reporter;

    beforeEach(() => {
      reporter = new ValidationReporter();
    });

    test('generates table with data', () => {
      const data = [
        { name: 'Node.js', version: '18.0.0', status: 'OK' },
        { name: 'NPM', version: '9.0.0', status: 'OK' },
        { name: 'Git', version: '2.30.0', status: 'OK' },
      ];
      const headers = ['name', 'version', 'status'];

      const table = reporter.table(data, headers);

      expect(table).toContain('[BOLD]name');
      expect(table).toContain('version');
      expect(table).toContain('status[/BOLD]');
      expect(table).toContain('[DIM]');
      expect(table).toContain('───');
      expect(table).toContain('Node.js');
      expect(table).toContain('18.0.0');
      expect(table).toContain('NPM');
      expect(table).toContain('9.0.0');
      expect(table).toContain('Git');
      expect(table).toContain('2.30.0');
    });

    test('handles empty data', () => {
      const table = reporter.table([], ['col1', 'col2']);
      expect(table).toBe('');
    });

    test('handles missing values', () => {
      const data = [{ name: 'Test', version: null }, { name: 'Test2' }];
      const headers = ['name', 'version'];

      const table = reporter.table(data, headers);

      expect(table).toContain('Test  │');
      expect(table).toContain('Test2 │');
    });
  });

  describe('box', () => {
    let reporter;

    beforeEach(() => {
      reporter = new ValidationReporter();
    });

    test('generates box with title and items', () => {
      const box = reporter.box('Summary', ['3 tests passed', '0 tests failed', 'Coverage: 95%']);

      expect(box).toContain('[DIM]┌');
      expect(box).toContain('[DIM]│[/DIM][BOLD] Summary');
      expect(box).toContain('[/BOLD][DIM]│[/DIM]');
      expect(box).toContain('[DIM]├');
      expect(box).toContain('3 tests passed');
      expect(box).toContain('0 tests failed');
      expect(box).toContain('Coverage: 95%');
      expect(box).toContain('[DIM]└');
    });

    test('adjusts width to longest content', () => {
      const box = reporter.box('Test', [
        'This is a very long line that should expand the box width',
      ]);

      expect(box).toContain('[DIM]┌');
      expect(box).toContain('────────────────────────────────────────────────────────');
      expect(box).toContain('This is a very long line that should expand the box width');
    });
  });

  describe('output methods', () => {
    let reporter;

    beforeEach(() => {
      reporter = new ValidationReporter();
    });

    test('clear clears console on TTY', () => {
      process.stdout.isTTY = true;
      reporter.clear();

      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1Bc');
    });

    test('clear does nothing on non-TTY', () => {
      process.stdout.isTTY = false;
      reporter.clear();

      expect(stdoutWriteSpy).not.toHaveBeenCalled();
    });

    test('write outputs text without newline', () => {
      reporter.write('Hello');

      expect(stdoutWriteSpy).toHaveBeenCalledWith('Hello');
    });

    test('writeLine outputs text with newline', () => {
      reporter.writeLine('Hello');

      expect(consoleLogSpy).toHaveBeenCalledWith('Hello');
    });

    test('writeLine outputs empty line when no text', () => {
      reporter.writeLine();

      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });
  });

  describe('singleton export', () => {
    test('exports singleton instance', () => {
      expect(validationReporter).toBeInstanceOf(ValidationReporter);
    });
  });
});
