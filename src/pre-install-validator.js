/**
 * Pre-installation validator
 * Validates system requirements before installation
 */

const fs = require('fs');
const path = require('path');

const { pythonDetector } = require('./python-detector');
const { platformUtils } = require('./platform-utils');
const { ValidationErrorCollection } = require('./validation-errors');
const { pathResolver } = require('./path-resolver');

class PreInstallValidator {
  constructor() {
    this.requirements = {
      node: {
        minVersion: '16.0.0',
        required: true,
      },
      npm: {
        minVersion: '7.0.0',
        required: true,
      },
      python: {
        minVersion: '3.6.0',
        required: false,
        message: 'Python is required for hooks functionality',
      },
      git: {
        minVersion: '2.0.0',
        required: true,
      },
      diskSpace: {
        minMB: 100,
        required: true,
      },
    };
  }

  /**
   * Run all pre-installation validations
   * @returns {Object} Validation result
   */
  async validate() {
    const errors = new ValidationErrorCollection();
    const results = {
      system: await this.validateSystem(),
      node: await this.validateNode(),
      npm: await this.validateNpm(),
      python: await this.validatePython(),
      git: await this.validateGit(),
      permissions: await this.validatePermissions(),
      diskSpace: await this.validateDiskSpace(),
      network: await this.validateNetwork(),
    };

    // Collect all errors
    for (const [category, result] of Object.entries(results)) {
      if (!result.valid && result.required !== false) {
        errors.addError({
          field: category,
          message: result.message,
          code: `PRE_INSTALL_${category.toUpperCase()}_ERROR`,
        });
      }
    }

    return {
      valid: !errors.hasErrors(),
      errors,
      details: results,
      canProceed: this.canProceedWithInstallation(results),
      warnings: this.getWarnings(results),
    };
  }

  /**
   * Validate system compatibility
   * @returns {Object} Validation result
   */
  async validateSystem() {
    const systemInfo = platformUtils.getSystemInfo();
    const supportedPlatforms = ['win32', 'darwin', 'linux'];

    const valid = supportedPlatforms.includes(systemInfo.platform);

    return {
      valid,
      required: true,
      platform: systemInfo.platform,
      arch: systemInfo.arch,
      message: valid ? 'System is supported' : `Unsupported platform: ${systemInfo.platform}`,
    };
  }

  /**
   * Validate Node.js installation
   * @returns {Object} Validation result
   */
  async validateNode() {
    try {
      const nodeVersion = process.version.substring(1); // Remove 'v' prefix
      const meetsRequirement =
        this.compareVersions(nodeVersion, this.requirements.node.minVersion) >= 0;

      return {
        valid: meetsRequirement,
        required: this.requirements.node.required,
        version: nodeVersion,
        minVersion: this.requirements.node.minVersion,
        message: meetsRequirement
          ? `Node.js ${nodeVersion} meets requirement`
          : `Node.js ${nodeVersion} is below minimum required version ${this.requirements.node.minVersion}`,
      };
    } catch (error) {
      return {
        valid: false,
        required: this.requirements.node.required,
        message: 'Failed to detect Node.js version',
        error: error.message,
      };
    }
  }

  /**
   * Validate NPM installation
   * @returns {Object} Validation result
   */
  async validateNpm() {
    try {
      const npmVersion = platformUtils.getNpmVersion();
      if (!npmVersion) {
        return {
          valid: false,
          required: this.requirements.npm.required,
          message: 'NPM is not installed or not in PATH',
        };
      }

      const meetsRequirement =
        this.compareVersions(npmVersion, this.requirements.npm.minVersion) >= 0;

      return {
        valid: meetsRequirement,
        required: this.requirements.npm.required,
        version: npmVersion,
        minVersion: this.requirements.npm.minVersion,
        message: meetsRequirement
          ? `NPM ${npmVersion} meets requirement`
          : `NPM ${npmVersion} is below minimum required version ${this.requirements.npm.minVersion}`,
      };
    } catch (error) {
      return {
        valid: false,
        required: this.requirements.npm.required,
        message: 'Failed to detect NPM version',
        error: error.message,
      };
    }
  }

  /**
   * Validate Python installation
   * @returns {Object} Validation result
   */
  async validatePython() {
    try {
      const pythonInfo = pythonDetector.getBestPython();

      if (!pythonInfo) {
        return {
          valid: false,
          required: this.requirements.python.required,
          message: this.requirements.python.message || 'Python is not installed',
        };
      }

      const meetsRequirement =
        this.compareVersions(pythonInfo.version, this.requirements.python.minVersion) >= 0;

      return {
        valid: meetsRequirement,
        required: this.requirements.python.required,
        version: pythonInfo.version,
        path: pythonInfo.path,
        hasPip: pythonInfo.hasPip,
        minVersion: this.requirements.python.minVersion,
        message: meetsRequirement
          ? `Python ${pythonInfo.version} meets requirement`
          : `Python ${pythonInfo.version} is below minimum required version ${this.requirements.python.minVersion}`,
      };
    } catch (error) {
      return {
        valid: false,
        required: this.requirements.python.required,
        message: 'Failed to detect Python installation',
        error: error.message,
      };
    }
  }

  /**
   * Validate Git installation
   * @returns {Object} Validation result
   */
  async validateGit() {
    try {
      const gitResult = platformUtils.executeCommand('git --version');

      if (!gitResult.success) {
        return {
          valid: false,
          required: this.requirements.git.required,
          message: 'Git is not installed or not in PATH',
        };
      }

      const versionMatch = gitResult.output.match(/git version (\d+\.\d+\.\d+)/);
      if (!versionMatch) {
        return {
          valid: false,
          required: this.requirements.git.required,
          message: 'Failed to parse Git version',
        };
      }

      const gitVersion = versionMatch[1];
      const meetsRequirement =
        this.compareVersions(gitVersion, this.requirements.git.minVersion) >= 0;

      return {
        valid: meetsRequirement,
        required: this.requirements.git.required,
        version: gitVersion,
        minVersion: this.requirements.git.minVersion,
        message: meetsRequirement
          ? `Git ${gitVersion} meets requirement`
          : `Git ${gitVersion} is below minimum required version ${this.requirements.git.minVersion}`,
      };
    } catch (error) {
      return {
        valid: false,
        required: this.requirements.git.required,
        message: 'Failed to detect Git installation',
        error: error.message,
      };
    }
  }

  /**
   * Validate file system permissions
   * @returns {Object} Validation result
   */
  async validatePermissions() {
    const testPaths = [
      process.cwd(),
      pathResolver.getConfigDir('claude-code-hooks'),
      pathResolver.getDataDir('claude-code-hooks'),
    ];

    const issues = [];

    for (const testPath of testPaths) {
      try {
        // Ensure directory exists
        pathResolver.ensureDir(testPath);

        // Test write permission
        const testFile = path.join(testPath, '.permission-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        issues.push({
          path: testPath,
          error: error.message,
        });
      }
    }

    return {
      valid: issues.length === 0,
      required: true,
      issues,
      message:
        issues.length === 0
          ? 'All required directories are writable'
          : `Permission issues found in ${issues.length} location(s)`,
    };
  }

  /**
   * Validate available disk space
   * @returns {Object} Validation result
   */
  async validateDiskSpace() {
    try {
      const { execSync } = require('child_process');
      let availableMB = 0;

      if (platformUtils.isWindows) {
        // Windows: Use wmic command
        const drive = process.cwd().substring(0, 2);
        const output = execSync(`wmic logicaldisk where caption="${drive}" get freespace`, {
          encoding: 'utf8',
        });
        const freeBytes = parseInt(output.split('\n')[1].trim());
        availableMB = Math.floor(freeBytes / (1024 * 1024));
      } else {
        // Unix-like: Use df command
        const output = execSync(`df -BM "${process.cwd()}" | tail -1`, { encoding: 'utf8' });
        const parts = output.split(/\s+/);
        availableMB = parseInt(parts[3].replace('M', ''));
      }

      const hasEnoughSpace = availableMB >= this.requirements.diskSpace.minMB;

      return {
        valid: hasEnoughSpace,
        required: this.requirements.diskSpace.required,
        availableMB,
        requiredMB: this.requirements.diskSpace.minMB,
        message: hasEnoughSpace
          ? `${availableMB}MB available disk space`
          : `Insufficient disk space: ${availableMB}MB available, ${this.requirements.diskSpace.minMB}MB required`,
      };
    } catch (error) {
      return {
        valid: true, // Don't fail if we can't check
        required: false,
        message: 'Unable to verify disk space',
        error: error.message,
      };
    }
  }

  /**
   * Validate network connectivity
   * @returns {Object} Validation result
   */
  async validateNetwork() {
    try {
      // Try to resolve npm registry
      const dns = require('dns').promises;
      await dns.resolve4('registry.npmjs.org');

      return {
        valid: true,
        required: false,
        message: 'Network connectivity verified',
      };
    } catch (error) {
      return {
        valid: false,
        required: false,
        message:
          'Unable to reach npm registry. Installation may fail if packages need to be downloaded.',
        error: error.message,
      };
    }
  }

  /**
   * Compare version strings
   * @param {string} v1 - First version
   * @param {string} v2 - Second version
   * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) {
        return -1;
      }
      if (part1 > part2) {
        return 1;
      }
    }

    return 0;
  }

  /**
   * Determine if installation can proceed
   * @param {Object} results - Validation results
   * @returns {boolean} True if can proceed
   */
  canProceedWithInstallation(results) {
    for (const [, result] of Object.entries(results)) {
      if (!result.valid && result.required) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get warnings from validation results
   * @param {Object} results - Validation results
   * @returns {Array<string>} Warning messages
   */
  getWarnings(results) {
    const warnings = [];

    // Python warning
    if (!results.python.valid && !results.python.required) {
      warnings.push(
        `Python is not installed or doesn't meet requirements. Hook functionality will be limited.`,
      );
    }

    // Network warning
    if (!results.network.valid) {
      warnings.push(
        'Network connectivity issues detected. Installation may fail if packages need to be downloaded.',
      );
    }

    // Disk space warning
    if (results.diskSpace.valid && results.diskSpace.availableMB < 200) {
      warnings.push(`Low disk space: only ${results.diskSpace.availableMB}MB available.`);
    }

    return warnings;
  }

  /**
   * Get a summary report of validation
   * @param {Object} validationResult - Full validation result
   * @returns {string} Formatted report
   */
  getReport(validationResult) {
    const lines = ['Pre-Installation Validation Report', '='.repeat(40)];

    // Overall status
    lines.push(`Overall Status: ${validationResult.valid ? '✓ PASS' : '✗ FAIL'}`);
    lines.push(`Can Proceed: ${validationResult.canProceed ? 'Yes' : 'No'}`);
    lines.push('');

    // Detailed results
    lines.push('Component Checks:');
    for (const [component, result] of Object.entries(validationResult.details)) {
      const status = result.valid ? '✓' : '✗';
      const required = result.required ? ' (required)' : ' (optional)';
      lines.push(`  ${status} ${component}${required}: ${result.message}`);

      if (result.version) {
        lines.push(`    Version: ${result.version}`);
      }
    }

    // Warnings
    if (validationResult.warnings.length > 0) {
      lines.push('');
      lines.push('Warnings:');
      validationResult.warnings.forEach((warning) => {
        lines.push(`  ⚠ ${warning}`);
      });
    }

    // Errors
    if (validationResult.errors.hasErrors()) {
      lines.push('');
      lines.push('Errors:');
      validationResult.errors.getErrorMessages().forEach((error) => {
        lines.push(`  ✗ ${error}`);
      });
    }

    return lines.join('\n');
  }
}

// Export singleton instance
const preInstallValidator = new PreInstallValidator();

module.exports = {
  PreInstallValidator,
  preInstallValidator,
};
