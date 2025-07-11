/**
 * Tests for PreInstallValidator
 */

const { PreInstallValidator, preInstallValidator } = require('./pre-install-validator');
const { pathResolver } = require('./path-resolver');
const { pythonDetector } = require('./python-detector');
const { platformUtils } = require('./platform-utils');
const { ValidationErrorCollection } = require('./validation-errors');
const fs = require('fs');
const dns = require('dns');
const childProcess = require('child_process');

// Mock dependencies
jest.mock('./path-resolver');
jest.mock('./python-detector');
jest.mock('./platform-utils');
jest.mock('fs');
jest.mock('dns', () => ({
  promises: {
    resolve4: jest.fn()
  }
}));
jest.mock('child_process');

describe('PreInstallValidator', () => {
  let validator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    platformUtils.getSystemInfo.mockReturnValue({ platform: 'darwin', arch: 'x64' });
    platformUtils.isWindows = false;
    platformUtils.getNpmVersion.mockReturnValue('9.0.0');
    platformUtils.executeCommand.mockReturnValue({ success: true, output: 'git version 2.30.0' });
    
    pythonDetector.getBestPython.mockReturnValue({
      version: '3.9.0',
      path: '/usr/bin/python3',
      hasPip: true
    });
    
    pathResolver.getConfigDir.mockReturnValue('/home/user/.config/claude-code-hooks');
    pathResolver.getDataDir.mockReturnValue('/home/user/.local/share/claude-code-hooks');
    pathResolver.ensureDir.mockImplementation();
    
    fs.writeFileSync.mockImplementation();
    fs.unlinkSync.mockImplementation();
    
    childProcess.execSync.mockReturnValue('1000M');
    
    dns.promises.resolve4.mockResolvedValue(['104.16.0.0']);
    
    validator = new PreInstallValidator();
  });

  describe('constructor', () => {
    test('sets default requirements', () => {
      expect(validator.requirements).toMatchObject({
        node: { minVersion: '16.0.0', required: true },
        npm: { minVersion: '7.0.0', required: true },
        python: { minVersion: '3.6.0', required: false },
        git: { minVersion: '2.0.0', required: true },
        diskSpace: { minMB: 100, required: true }
      });
    });
  });

  describe('validate', () => {
    test('returns valid result when all requirements are met', async () => {
      const result = await validator.validate();
      
      expect(result.valid).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.warnings).toEqual([]);
      expect(result.errors.hasErrors()).toBe(false);
      
      expect(result.details).toMatchObject({
        system: { valid: true },
        node: { valid: true },
        npm: { valid: true },
        python: { valid: true },
        git: { valid: true },
        permissions: { valid: true },
        diskSpace: { valid: true },
        network: { valid: true }
      });
    });

    test('returns invalid result when required components fail', async () => {
      platformUtils.getNpmVersion.mockReturnValue('6.0.0'); // Below minimum
      platformUtils.executeCommand.mockReturnValue({ success: false }); // Git not found
      
      const result = await validator.validate();
      
      expect(result.valid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.errors.hasErrors()).toBe(true);
      
      const errorMessages = result.errors.getErrorMessages();
      expect(errorMessages).toContain('NPM 6.0.0 is below minimum required version 7.0.0');
      expect(errorMessages).toContain('Git is not installed or not in PATH');
    });

    test('allows installation when optional components fail', async () => {
      pythonDetector.getBestPython.mockReturnValue(null); // Python not found
      dns.promises.resolve4.mockRejectedValue(new Error('Network error')); // Network fails
      
      const result = await validator.validate();
      
      expect(result.valid).toBe(true); // Still valid because Python and network are optional
      expect(result.canProceed).toBe(true);
      expect(result.warnings).toContain(
        'Python is not installed or doesn\'t meet requirements. Hook functionality will be limited.'
      );
      expect(result.warnings).toContain(
        'Network connectivity issues detected. Installation may fail if packages need to be downloaded.'
      );
    });
  });

  describe('validateSystem', () => {
    test('validates supported platforms', async () => {
      const supportedPlatforms = ['win32', 'darwin', 'linux'];
      
      for (const platform of supportedPlatforms) {
        platformUtils.getSystemInfo.mockReturnValue({ platform, arch: 'x64' });
        const result = await validator.validateSystem();
        
        expect(result.valid).toBe(true);
        expect(result.platform).toBe(platform);
      }
    });

    test('rejects unsupported platforms', async () => {
      platformUtils.getSystemInfo.mockReturnValue({ platform: 'freebsd', arch: 'x64' });
      
      const result = await validator.validateSystem();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Unsupported platform: freebsd');
    });
  });

  describe('validateNode', () => {
    test('validates Node.js version', async () => {
      Object.defineProperty(process, 'version', {
        value: 'v18.0.0',
        writable: true
      });
      
      const result = await validator.validateNode();
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe('18.0.0');
      expect(result.message).toBe('Node.js 18.0.0 meets requirement');
    });

    test('rejects old Node.js version', async () => {
      Object.defineProperty(process, 'version', {
        value: 'v14.0.0',
        writable: true
      });
      
      const result = await validator.validateNode();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Node.js 14.0.0 is below minimum required version 16.0.0');
    });

    test('handles Node.js detection error', async () => {
      Object.defineProperty(process, 'version', {
        get() { throw new Error('Cannot read version'); }
      });
      
      const result = await validator.validateNode();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Failed to detect Node.js version');
      expect(result.error).toBe('Cannot read version');
    });
  });

  describe('validateNpm', () => {
    test('validates NPM version', async () => {
      platformUtils.getNpmVersion.mockReturnValue('9.0.0');
      
      const result = await validator.validateNpm();
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe('9.0.0');
      expect(result.message).toBe('NPM 9.0.0 meets requirement');
    });

    test('rejects old NPM version', async () => {
      platformUtils.getNpmVersion.mockReturnValue('6.0.0');
      
      const result = await validator.validateNpm();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('NPM 6.0.0 is below minimum required version 7.0.0');
    });

    test('handles missing NPM', async () => {
      platformUtils.getNpmVersion.mockReturnValue(null);
      
      const result = await validator.validateNpm();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('NPM is not installed or not in PATH');
    });

    test('handles NPM detection error', async () => {
      platformUtils.getNpmVersion.mockImplementation(() => {
        throw new Error('Command failed');
      });
      
      const result = await validator.validateNpm();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Failed to detect NPM version');
      expect(result.error).toBe('Command failed');
    });
  });

  describe('validatePython', () => {
    test('validates Python installation', async () => {
      pythonDetector.getBestPython.mockReturnValue({
        version: '3.9.0',
        path: '/usr/bin/python3',
        hasPip: true
      });
      
      const result = await validator.validatePython();
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe('3.9.0');
      expect(result.path).toBe('/usr/bin/python3');
      expect(result.hasPip).toBe(true);
      expect(result.message).toBe('Python 3.9.0 meets requirement');
    });

    test('rejects old Python version', async () => {
      pythonDetector.getBestPython.mockReturnValue({
        version: '3.5.0',
        path: '/usr/bin/python3',
        hasPip: true
      });
      
      const result = await validator.validatePython();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Python 3.5.0 is below minimum required version 3.6.0');
    });

    test('handles missing Python', async () => {
      pythonDetector.getBestPython.mockReturnValue(null);
      
      const result = await validator.validatePython();
      
      expect(result.valid).toBe(false);
      expect(result.required).toBe(false); // Python is optional
      expect(result.message).toBe('Python is required for hooks functionality');
    });

    test('handles Python detection error', async () => {
      pythonDetector.getBestPython.mockImplementation(() => {
        throw new Error('Detection failed');
      });
      
      const result = await validator.validatePython();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Failed to detect Python installation');
      expect(result.error).toBe('Detection failed');
    });
  });

  describe('validateGit', () => {
    test('validates Git installation', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: true,
        output: 'git version 2.30.0'
      });
      
      const result = await validator.validateGit();
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe('2.30.0');
      expect(result.message).toBe('Git 2.30.0 meets requirement');
    });

    test('rejects old Git version', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: true,
        output: 'git version 1.9.0'
      });
      
      const result = await validator.validateGit();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Git 1.9.0 is below minimum required version 2.0.0');
    });

    test('handles missing Git', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: false,
        output: '',
        error: 'command not found'
      });
      
      const result = await validator.validateGit();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Git is not installed or not in PATH');
    });

    test('handles unparseable Git version', async () => {
      platformUtils.executeCommand.mockReturnValue({
        success: true,
        output: 'git version unknown'
      });
      
      const result = await validator.validateGit();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Failed to parse Git version');
    });

    test('handles Git detection error', async () => {
      platformUtils.executeCommand.mockImplementation(() => {
        throw new Error('Command error');
      });
      
      const result = await validator.validateGit();
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Failed to detect Git installation');
      expect(result.error).toBe('Command error');
    });
  });

  describe('validatePermissions', () => {
    test('validates writable directories', async () => {
      const result = await validator.validatePermissions();
      
      expect(result.valid).toBe(true);
      expect(result.message).toBe('All required directories are writable');
      expect(pathResolver.ensureDir).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    test('detects permission issues', async () => {
      fs.writeFileSync.mockImplementation((path) => {
        if (path.includes('config')) {
          throw new Error('Permission denied');
        }
      });
      
      const result = await validator.validatePermissions();
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Permission issues found');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        path: expect.stringContaining('config'),
        error: 'Permission denied'
      });
    });
  });

  describe('validateDiskSpace', () => {
    test('validates sufficient disk space on Unix', async () => {
      platformUtils.isWindows = false;
      childProcess.execSync.mockReturnValue('/dev/sda1    100000M   50000M    1000M  50% /');
      
      const result = await validator.validateDiskSpace();
      
      expect(result.valid).toBe(true);
      expect(result.availableMB).toBe(1000);
      expect(result.message).toBe('1000MB available disk space');
    });

    test('validates sufficient disk space on Windows', async () => {
      platformUtils.isWindows = true;
      childProcess.execSync.mockReturnValue('FreeSpace\n1073741824\n');
      
      const result = await validator.validateDiskSpace();
      
      expect(result.valid).toBe(true);
      expect(result.availableMB).toBe(1024);
      expect(result.message).toBe('1024MB available disk space');
    });

    test('detects insufficient disk space', async () => {
      platformUtils.isWindows = false;
      childProcess.execSync.mockReturnValue('/dev/sda1    100000M   99950M    50M  99% /');
      
      const result = await validator.validateDiskSpace();
      
      expect(result.valid).toBe(false);
      expect(result.availableMB).toBe(50);
      expect(result.message).toBe('Insufficient disk space: 50MB available, 100MB required');
    });

    test('handles disk space check error gracefully', async () => {
      childProcess.execSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      
      const result = await validator.validateDiskSpace();
      
      expect(result.valid).toBe(true); // Don't fail if can't check
      expect(result.required).toBe(false);
      expect(result.message).toBe('Unable to verify disk space');
      expect(result.error).toBe('Command failed');
    });
  });

  describe('validateNetwork', () => {
    test('validates network connectivity', async () => {
      dns.promises.resolve4.mockResolvedValue(['104.16.0.0']);
      
      const result = await validator.validateNetwork();
      
      expect(result.valid).toBe(true);
      expect(result.message).toBe('Network connectivity verified');
    });

    test('detects network issues', async () => {
      dns.promises.resolve4.mockRejectedValue(new Error('ENOTFOUND'));
      
      const result = await validator.validateNetwork();
      
      expect(result.valid).toBe(false);
      expect(result.required).toBe(false); // Network is optional
      expect(result.message).toContain('Unable to reach npm registry');
      expect(result.error).toBe('ENOTFOUND');
    });
  });

  describe('compareVersions', () => {
    test('compares versions correctly', () => {
      expect(validator.compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(validator.compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(validator.compareVersions('1.0.0', '1.0.0')).toBe(0);
      
      expect(validator.compareVersions('1.0', '1.0.0')).toBe(0);
      expect(validator.compareVersions('1.0.1', '1.0')).toBe(1);
      
      expect(validator.compareVersions('16.14.0', '16.0.0')).toBe(1);
      expect(validator.compareVersions('16.0.0', '16.14.0')).toBe(-1);
    });
  });

  describe('canProceedWithInstallation', () => {
    test('allows installation when all required components pass', () => {
      const results = {
        node: { valid: true, required: true },
        npm: { valid: true, required: true },
        python: { valid: false, required: false }, // Optional, can fail
        git: { valid: true, required: true }
      };
      
      expect(validator.canProceedWithInstallation(results)).toBe(true);
    });

    test('blocks installation when required component fails', () => {
      const results = {
        node: { valid: true, required: true },
        npm: { valid: false, required: true }, // Required, must pass
        python: { valid: false, required: false },
        git: { valid: true, required: true }
      };
      
      expect(validator.canProceedWithInstallation(results)).toBe(false);
    });
  });

  describe('getWarnings', () => {
    test('generates appropriate warnings', () => {
      const results = {
        python: { valid: false, required: false },
        network: { valid: false },
        diskSpace: { valid: true, availableMB: 150 }
      };
      
      const warnings = validator.getWarnings(results);
      
      expect(warnings).toContain(
        'Python is not installed or doesn\'t meet requirements. Hook functionality will be limited.'
      );
      expect(warnings).toContain(
        'Network connectivity issues detected. Installation may fail if packages need to be downloaded.'
      );
      expect(warnings).toContain('Low disk space: only 150MB available.');
    });

    test('returns empty array when no warnings', () => {
      const results = {
        python: { valid: true },
        network: { valid: true },
        diskSpace: { valid: true, availableMB: 500 }
      };
      
      const warnings = validator.getWarnings(results);
      
      expect(warnings).toEqual([]);
    });
  });

  describe('getReport', () => {
    test('generates comprehensive report', async () => {
      const validationResult = await validator.validate();
      const report = validator.getReport(validationResult);
      
      expect(report).toContain('Pre-Installation Validation Report');
      expect(report).toContain('Overall Status: ✓ PASS');
      expect(report).toContain('Can Proceed: Yes');
      expect(report).toContain('Component Checks:');
      expect(report).toContain('✓ system (required)');
      expect(report).toContain('✓ node (required)');
      expect(report).toContain('Version:');
    });

    test('includes errors and warnings in report', async () => {
      platformUtils.getNpmVersion.mockReturnValue('6.0.0');
      pythonDetector.getBestPython.mockReturnValue(null);
      
      const validationResult = await validator.validate();
      const report = validator.getReport(validationResult);
      
      expect(report).toContain('Overall Status: ✗ FAIL');
      expect(report).toContain('Can Proceed: No');
      expect(report).toContain('✗ npm (required)');
      expect(report).toContain('Warnings:');
      expect(report).toContain('⚠ Python');
      expect(report).toContain('Errors:');
      expect(report).toContain('✗ NPM');
    });
  });

  describe('singleton export', () => {
    test('exports singleton instance', () => {
      expect(preInstallValidator).toBeInstanceOf(PreInstallValidator);
    });
  });
});