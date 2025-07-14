/**
 * Tests for PostInstallValidator
 */

const fs = require('fs');
const path = require('path');

const { PostInstallValidator, postInstallValidator } = require('./post-install-validator');
const { pathResolver } = require('./path-resolver');
const { pythonDetector } = require('./python-detector');
const { platformUtils } = require('./platform-utils');
const { ValidationErrorCollection } = require('./validation-errors');

// Mock dependencies
jest.mock('./path-resolver');
jest.mock('./python-detector');
jest.mock('./platform-utils');
jest.mock('fs');

describe('PostInstallValidator', () => {
  let validator;
  const testProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    platformUtils.isWindows = false;
    platformUtils.executeCommand.mockReturnValue({ success: true, output: 'command output' });
    platformUtils.getFilePermissions.mockReturnValue({ executable: true });

    pythonDetector.getBestPython.mockReturnValue({
      version: '3.9.0',
      path: '/usr/bin/python3',
      hasPip: true,
    });

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('#!/usr/bin/env python\nprint("test")');
    fs.writeFileSync.mockImplementation();
    fs.unlinkSync.mockImplementation();

    validator = new PostInstallValidator();
  });

  describe('constructor', () => {
    test('sets expected files correctly', () => {
      expect(validator.expectedFiles).toMatchObject({
        cli: ['claude-code-hooks'],
        config: ['.claude/hooks', '.claude/commands'],
        scripts: expect.arrayContaining([
          'scripts/cache-linear-issue.sh',
          'scripts/decompose-parallel.cjs',
          'scripts/spawn-agents.sh',
        ]),
        hooks: expect.arrayContaining([
          '.claude/hooks/api-standards-checker.py',
          '.claude/hooks/code-quality-reporter.py',
          '.claude/hooks/typescript-validator.py',
        ]),
      });
    });
  });

  describe('validate', () => {
    test('returns valid result when all checks pass', async () => {
      // Setup all valid mocks
      platformUtils.executeCommand.mockImplementation((cmd) => {
        if (cmd.includes('--version')) {
          return { success: true, output: 'claude-code-hooks version 1.0.0' };
        }
        if (cmd.includes('npm list')) {
          return { success: true, output: 'claude-code-hooks@1.0.0' };
        }
        if (cmd.includes('--help')) {
          return { success: true, output: 'Usage: ...' };
        }
        return { success: true, output: '' };
      });

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return JSON.stringify({ name: 'test', version: '1.0.0' });
        }
        if (filePath.includes('.py')) {
          return '#!/usr/bin/env python\nprint("test")';
        }
        if (filePath.includes('decompose-parallel.cjs')) {
          return 'parallelAgents code here';
        }
        return 'test content';
      });

      const result = await validator.validate({ projectPath: testProjectPath });

      expect(result.valid).toBe(true);
      expect(result.successRate).toBe(100);
      expect(result.errors.hasErrors()).toBe(false);
      expect(result.recommendations).toEqual([]);
    });

    test('returns invalid result when checks fail', async () => {
      platformUtils.executeCommand.mockReturnValue({ success: false });
      fs.existsSync.mockReturnValue(false);

      const result = await validator.validate({ projectPath: testProjectPath });

      expect(result.valid).toBe(false);
      expect(result.successRate).toBeLessThan(100);
      expect(result.errors.hasErrors()).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('uses current directory when no project path provided', async () => {
      await validator.validate();

      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining(process.cwd()));
    });
  });

  describe('validateCliCommand', () => {
    test('validates available CLI command', async () => {
      platformUtils.executeCommand.mockImplementation((cmd) => {
        if (cmd.includes('claude-code-hooks --version')) {
          return { success: true, output: '1.0.0' };
        }
        return { success: false };
      });

      const result = await validator.validateCliCommand();

      expect(result.valid).toBe(true);
      expect(result.command).toBe('claude-code-hooks');
      expect(result.message).toBe("CLI command 'claude-code-hooks' is available");
    });

    test('falls back to npx when direct command fails', async () => {
      platformUtils.executeCommand.mockImplementation((cmd) => {
        if (cmd.includes('npx claude-code-hooks --version')) {
          return { success: true, output: '1.0.0' };
        }
        return { success: false };
      });

      const result = await validator.validateCliCommand();

      expect(result.valid).toBe(true);
      expect(result.command).toBe('npx claude-code-hooks');
    });

    test('reports failure when no command works', async () => {
      platformUtils.executeCommand.mockReturnValue({ success: false });

      const result = await validator.validateCliCommand();

      expect(result.valid).toBe(false);
      expect(result.message).toBe('CLI command not found in PATH');
    });

    test('handles command check errors', async () => {
      platformUtils.executeCommand.mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = await validator.validateCliCommand();

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Failed to validate CLI command');
      expect(result.error).toBe('Command failed');
    });
  });

  describe('validateGlobalPackage', () => {
    test('validates installed global package', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: true,
        output: '└── claude-code-hooks@1.2.3',
      });

      const result = await validator.validateGlobalPackage();

      expect(result.valid).toBe(true);
      expect(result.version).toBe('1.2.3');
      expect(result.message).toBe('Global package installed (version: 1.2.3)');
    });

    test('detects missing global package', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: false,
        output: 'npm ERR! not found',
      });

      const result = await validator.validateGlobalPackage();

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Global package not found');
    });

    test('handles version parsing errors', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: true,
        output: 'claude-code-hooks without version',
      });

      const result = await validator.validateGlobalPackage();

      expect(result.valid).toBe(true);
      expect(result.version).toBe('unknown');
    });

    test('handles package check errors', async () => {
      platformUtils.executeCommand.mockImplementation(() => {
        throw new Error('NPM error');
      });

      const result = await validator.validateGlobalPackage();

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Failed to check global package');
      expect(result.error).toBe('NPM error');
    });
  });

  describe('validateProjectStructure', () => {
    test('validates all directories exist', async () => {
      fs.existsSync.mockReturnValue(true);

      const result = await validator.validateProjectStructure(testProjectPath);

      expect(result.valid).toBe(true);
      expect(result.missingDirs).toEqual([]);
      expect(result.message).toBe('All required directories exist');
    });

    test('detects missing directories', async () => {
      fs.existsSync.mockImplementation(
        (path) => !path.includes('scripts') && !path.includes('workspaces'),
      );

      const result = await validator.validateProjectStructure(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.missingDirs).toContain('scripts');
      expect(result.missingDirs).toContain('workspaces');
      expect(result.message).toContain('Missing directories: scripts, workspaces');
    });
  });

  describe('validateHooks', () => {
    test('validates all hooks exist and are valid', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('#!/usr/bin/env python\nimport sys');
      platformUtils.getFilePermissions.mockReturnValue({ executable: true });

      const result = await validator.validateHooks(testProjectPath);

      expect(result.valid).toBe(true);
      expect(result.missingHooks).toEqual([]);
      expect(result.invalidHooks).toEqual([]);
      expect(result.message).toContain('All 3 hooks are properly installed');
    });

    test('detects missing hooks', async () => {
      fs.existsSync.mockImplementation((path) => !path.includes('api-standards-checker.py'));

      const result = await validator.validateHooks(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.missingHooks).toContain('.claude/hooks/api-standards-checker.py');
    });

    test('detects non-executable hooks on Unix', async () => {
      platformUtils.isWindows = false;
      platformUtils.getFilePermissions.mockReturnValue({ executable: false });

      const result = await validator.validateHooks(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.invalidHooks).toHaveLength(3);
      expect(result.invalidHooks[0]).toMatchObject({
        issue: 'Not executable',
      });
    });

    test('ignores executable check on Windows', async () => {
      platformUtils.isWindows = true;
      platformUtils.getFilePermissions.mockReturnValue({ executable: false });

      const result = await validator.validateHooks(testProjectPath);

      expect(result.valid).toBe(true);
    });

    test('detects missing shebang in Python hooks', async () => {
      fs.readFileSync.mockReturnValue('import sys\nprint("no shebang")');

      const result = await validator.validateHooks(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.invalidHooks[0]).toMatchObject({
        issue: 'Missing or incorrect shebang',
      });
    });
  });

  describe('validatePermissions', () => {
    test('validates correct permissions', async () => {
      fs.existsSync.mockReturnValue(true);
      platformUtils.getFilePermissions.mockReturnValue({ executable: true });

      const result = await validator.validatePermissions(testProjectPath);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.message).toBe('All file permissions are correct');
    });

    test('detects non-executable scripts on Unix', async () => {
      platformUtils.isWindows = false;
      platformUtils.getFilePermissions.mockReturnValue({ executable: false });

      const result = await validator.validatePermissions(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toMatchObject({
        issue: 'Not executable',
        fix: expect.stringContaining('chmod +x'),
      });
    });

    test('detects non-writable directories', async () => {
      fs.writeFileSync.mockImplementation((path) => {
        if (path.includes('.claude')) {
          throw new Error('Permission denied');
        }
      });

      const result = await validator.validatePermissions(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          path: '.claude',
          issue: 'Not writable',
        }),
      );
    });

    test('ignores executable check on Windows', async () => {
      platformUtils.isWindows = true;
      platformUtils.getFilePermissions.mockReturnValue({ executable: false });

      const result = await validator.validatePermissions(testProjectPath);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateConfiguration', () => {
    test('validates correct configuration files', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('package.json')) {
          return JSON.stringify({ name: 'test-project', version: '1.0.0' });
        }
        if (path.includes('CLAUDE.md')) {
          return '# Claude instructions';
        }
        if (path.includes('decompose-parallel.cjs')) {
          return 'module.exports = { parallelAgents: [] }';
        }
        return 'test content';
      });

      const result = await validator.validateConfiguration(testProjectPath);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.validConfigs).toContain('package.json');
    });

    test('detects missing required files', async () => {
      fs.existsSync.mockImplementation((path) => !path.includes('package.json'));

      const result = await validator.validateConfiguration(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          path: 'package.json',
          issue: 'Missing required file',
        }),
      );
    });

    test('detects invalid package.json', async () => {
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('package.json')) {
          return '{}'; // Missing name and version
        }
        return 'test';
      });

      const result = await validator.validateConfiguration(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          path: 'package.json',
          issue: 'Invalid content or format',
        }),
      );
    });

    test('handles file read errors', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = await validator.validateConfiguration(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toMatchObject({
        issue: 'Read error: Read error',
      });
    });
  });

  describe('validatePythonHooks', () => {
    test('validates working Python hooks', async () => {
      pythonDetector.getBestPython.mockReturnValue({
        version: '3.9.0',
        path: '/usr/bin/python3',
      });
      platformUtils.executeCommand.mockReturnValue({
        success: true,
        output: 'Usage: api-standards-checker.py [options]',
      });

      const result = await validator.validatePythonHooks(testProjectPath);

      expect(result.valid).toBe(true);
      expect(result.pythonVersion).toBe('3.9.0');
      expect(result.message).toBe('Python hooks functional with Python 3.9.0');
    });

    test('reports missing Python', async () => {
      pythonDetector.getBestPython.mockReturnValue(null);

      const result = await validator.validatePythonHooks(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Python not available for hooks');
    });

    test('reports missing test hook', async () => {
      fs.existsSync.mockImplementation((path) => !path.includes('api-standards-checker.py'));

      const result = await validator.validatePythonHooks(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Test hook not found');
    });

    test('reports hook execution failure', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: false,
        output: 'Python error',
      });

      const result = await validator.validatePythonHooks(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Python hooks failed to execute');
    });

    test('handles hook test errors', async () => {
      platformUtils.executeCommand.mockImplementation(() => {
        throw new Error('Execution failed');
      });

      const result = await validator.validatePythonHooks(testProjectPath);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Failed to test Python hooks');
      expect(result.error).toBe('Execution failed');
    });
  });

  describe('calculateSuccessRate', () => {
    test('calculates correct success rate', () => {
      const results = {
        test1: { valid: true },
        test2: { valid: true },
        test3: { valid: false },
        test4: { valid: true },
      };

      const rate = validator.calculateSuccessRate(results);
      expect(rate).toBe(75); // 3 out of 4 = 75%
    });

    test('returns 0 for all failures', () => {
      const results = {
        test1: { valid: false },
        test2: { valid: false },
      };

      const rate = validator.calculateSuccessRate(results);
      expect(rate).toBe(0);
    });

    test('returns 100 for all successes', () => {
      const results = {
        test1: { valid: true },
        test2: { valid: true },
      };

      const rate = validator.calculateSuccessRate(results);
      expect(rate).toBe(100);
    });
  });

  describe('getRecommendations', () => {
    test('provides CLI installation recommendation', () => {
      const results = {
        cliCommand: { valid: false },
        projectStructure: { valid: true },
        hooks: { valid: true, missingHooks: [] },
        permissions: { valid: true, issues: [] },
        pythonHooks: { valid: true },
      };

      const recommendations = validator.getRecommendations(results);

      expect(recommendations).toContain(
        'Run "npm install -g claude-code-hooks" to install the CLI globally',
      );
    });

    test('provides structure initialization recommendation', () => {
      const results = {
        cliCommand: { valid: true },
        projectStructure: { valid: false },
        hooks: { valid: true, missingHooks: [] },
        permissions: { valid: true, issues: [] },
        pythonHooks: { valid: true },
      };

      const recommendations = validator.getRecommendations(results);

      expect(recommendations).toContain(
        'Run "claude-code-hooks init" to create missing directories',
      );
    });

    test('provides hook restoration recommendation', () => {
      const results = {
        cliCommand: { valid: true },
        projectStructure: { valid: true },
        hooks: { valid: false, missingHooks: ['hook1.py'] },
        permissions: { valid: true, issues: [] },
        pythonHooks: { valid: true },
      };

      const recommendations = validator.getRecommendations(results);

      expect(recommendations).toContain('Re-run installation to restore missing hooks');
    });

    test('provides permission fix recommendations for Unix', () => {
      platformUtils.isWindows = false;
      const results = {
        cliCommand: { valid: true },
        projectStructure: { valid: true },
        hooks: { valid: true, missingHooks: [] },
        permissions: {
          valid: false,
          issues: [{ path: 'script.sh', fix: 'chmod +x script.sh' }],
        },
        pythonHooks: { valid: true },
      };

      const recommendations = validator.getRecommendations(results);

      expect(recommendations).toContain('Fix permissions: chmod +x script.sh');
    });

    test('provides permission recommendation for Windows', () => {
      platformUtils.isWindows = true;
      const results = {
        cliCommand: { valid: true },
        projectStructure: { valid: true },
        hooks: { valid: true, missingHooks: [] },
        permissions: {
          valid: false,
          issues: [{ path: 'file.txt' }],
        },
        pythonHooks: { valid: true },
      };

      const recommendations = validator.getRecommendations(results);

      expect(recommendations).toContain('Check file permissions in Windows Security settings');
    });

    test('provides Python installation recommendation', () => {
      const results = {
        cliCommand: { valid: true },
        projectStructure: { valid: true },
        hooks: { valid: true, missingHooks: [] },
        permissions: { valid: true, issues: [] },
        pythonHooks: { valid: false },
      };

      const recommendations = validator.getRecommendations(results);

      expect(recommendations).toContain('Install Python 3.6+ to enable hook functionality');
    });

    test('returns empty array when all valid', () => {
      const results = {
        cliCommand: { valid: true },
        projectStructure: { valid: true },
        hooks: { valid: true, missingHooks: [] },
        permissions: { valid: true, issues: [] },
        pythonHooks: { valid: true },
      };

      const recommendations = validator.getRecommendations(results);

      expect(recommendations).toEqual([]);
    });
  });

  describe('getReport', () => {
    test('generates comprehensive report', async () => {
      const validationResult = await validator.validate({ projectPath: testProjectPath });
      const report = validator.getReport(validationResult);

      expect(report).toContain('Post-Installation Validation Report');
      expect(report).toContain('Overall Status:');
      expect(report).toContain('Success Rate:');
      expect(report).toContain('Component Status:');
    });

    test('includes recommendations in report', async () => {
      platformUtils.executeCommand.mockReturnValue({ success: false });

      const validationResult = await validator.validate({ projectPath: testProjectPath });
      const report = validator.getReport(validationResult);

      expect(report).toContain('Recommendations:');
      expect(report).toMatch(/\d+\./); // Numbered recommendations
    });

    test('includes errors in report', async () => {
      fs.existsSync.mockReturnValue(false);

      const validationResult = await validator.validate({ projectPath: testProjectPath });
      const report = validator.getReport(validationResult);

      expect(report).toContain('Errors:');
      expect(report).toContain('✗');
    });
  });

  describe('quickCheck', () => {
    test('returns true when basic checks pass', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: true,
        output: 'claude-code-hooks version 1.0.0',
      });
      fs.existsSync.mockReturnValue(true);

      const result = await validator.quickCheck();

      expect(result).toBe(true);
    });

    test('returns false when CLI check fails', async () => {
      platformUtils.executeCommand.mockReturnValue({ success: false });
      fs.existsSync.mockReturnValue(true);

      const result = await validator.quickCheck();

      expect(result).toBe(false);
    });

    test('returns false when structure check fails', async () => {
      platformUtils.executeCommand.mockReturnValue({ success: true });
      fs.existsSync.mockReturnValue(false);

      const result = await validator.quickCheck();

      expect(result).toBe(false);
    });
  });

  describe('singleton export', () => {
    test('exports singleton instance', () => {
      expect(postInstallValidator).toBeInstanceOf(PostInstallValidator);
    });
  });
});
