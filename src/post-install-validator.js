/**
 * Post-installation validator
 * Validates that installation completed successfully
 */

const fs = require('fs');
const path = require('path');

const { pythonDetector } = require('./python-detector');
const { platformUtils } = require('./platform-utils');
const { ValidationErrorCollection } = require('./validation-errors');

class PostInstallValidator {
  constructor() {
    this.expectedFiles = {
      cli: ['claude-code-hooks'],
      config: ['.claude/hooks', '.claude/commands'],
      scripts: [
        'scripts/cache-linear-issue.sh',
        'scripts/decompose-parallel.cjs',
        'scripts/spawn-agents.sh',
      ],
      hooks: [
        '.claude/hooks/tier1/api-standards-checker.py',
        '.claude/hooks/tier1/code-quality-reporter.py',
        '.claude/hooks/tier2/typescript-validator.py',
      ],
    };
  }

  /**
   * Run all post-installation validations
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  async validate(options = {}) {
    const errors = new ValidationErrorCollection();
    const results = {
      cliCommand: await this.validateCliCommand(),
      projectStructure: await this.validateProjectStructure(options.projectPath),
      hooks: await this.validateHooks(options.projectPath),
      permissions: await this.validatePermissions(options.projectPath),
      configuration: await this.validateConfiguration(options.projectPath),
      pythonHooks: await this.validatePythonHooks(options.projectPath),
    };

    // Collect all errors
    for (const [category, result] of Object.entries(results)) {
      if (!result.valid) {
        errors.addError({
          field: category,
          message: result.message,
          code: `POST_INSTALL_${category.toUpperCase()}_ERROR`,
        });
      }
    }

    return {
      valid: !errors.hasErrors(),
      errors,
      details: results,
      successRate: this.calculateSuccessRate(results),
      recommendations: this.getRecommendations(results),
    };
  }

  /**
   * Validate CLI command is available
   * @returns {Object} Validation result
   */
  async validateCliCommand() {
    try {
      const commands = ['npx cdev', 'npx @aojdevstudio/cdev'];
      let commandFound = false;
      let workingCommand = null;

      for (const cmd of commands) {
        const result = platformUtils.executeCommand(`${cmd} --version`);
        if (result.success) {
          commandFound = true;
          workingCommand = cmd;
          break;
        }
      }

      return {
        valid: commandFound,
        command: workingCommand,
        message: commandFound
          ? `CLI command '${workingCommand}' is available`
          : 'CLI command not found in PATH',
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Failed to validate CLI command',
        error: error.message,
      };
    }
  }

  /**
   * Validate project structure
   * @param {string} projectPath - Project directory path
   * @returns {Object} Validation result
   */
  async validateProjectStructure(projectPath = process.cwd()) {
    const expectedDirs = ['.claude', '.claude/hooks', '.claude/commands', 'scripts', 'workspaces'];

    const missingDirs = [];

    for (const dir of expectedDirs) {
      const fullPath = path.join(projectPath, dir);
      if (!fs.existsSync(fullPath)) {
        missingDirs.push(dir);
      }
    }

    return {
      valid: missingDirs.length === 0,
      missingDirs,
      message:
        missingDirs.length === 0
          ? 'All required directories exist'
          : `Missing directories: ${missingDirs.join(', ')}`,
    };
  }

  /**
   * Validate hooks are properly installed
   * @param {string} projectPath - Project directory path
   * @returns {Object} Validation result
   */
  async validateHooks(projectPath = process.cwd()) {
    const hookFiles = [];
    const missingHooks = [];
    const invalidHooks = [];

    for (const hookPath of this.expectedFiles.hooks) {
      const fullPath = path.join(projectPath, hookPath);

      if (!fs.existsSync(fullPath)) {
        missingHooks.push(hookPath);
      } else {
        hookFiles.push(hookPath);

        // Check if hook is executable
        const permissions = platformUtils.getFilePermissions(fullPath);
        if (permissions && !permissions.executable && !platformUtils.isWindows) {
          invalidHooks.push({
            path: hookPath,
            issue: 'Not executable',
          });
        }

        // Check if Python hook has proper shebang
        if (hookPath.endsWith('.py')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (!content.startsWith('#!/usr/bin/env python')) {
            invalidHooks.push({
              path: hookPath,
              issue: 'Missing or incorrect shebang',
            });
          }
        }
      }
    }

    return {
      valid: missingHooks.length === 0 && invalidHooks.length === 0,
      foundHooks: hookFiles,
      missingHooks,
      invalidHooks,
      message:
        missingHooks.length === 0 && invalidHooks.length === 0
          ? `All ${this.expectedFiles.hooks.length} hooks are properly installed`
          : `Hook issues found: ${missingHooks.length} missing, ${invalidHooks.length} invalid`,
    };
  }

  /**
   * Validate file permissions
   * @param {string} projectPath - Project directory path
   * @returns {Object} Validation result
   */
  async validatePermissions(projectPath = process.cwd()) {
    const issues = [];

    // Check script files are executable
    const scriptFiles = [...this.expectedFiles.scripts, 'bin/claude-code-hooks'];

    for (const scriptPath of scriptFiles) {
      const fullPath = path.join(projectPath, scriptPath);

      if (fs.existsSync(fullPath)) {
        const permissions = platformUtils.getFilePermissions(fullPath);

        if (permissions && !permissions.executable && !platformUtils.isWindows) {
          issues.push({
            path: scriptPath,
            issue: 'Not executable',
            fix: `chmod +x ${scriptPath}`,
          });
        }
      }
    }

    // Check directories are writable
    const writableDirs = ['.claude', 'workspaces', 'shared'];

    for (const dir of writableDirs) {
      const fullPath = path.join(projectPath, dir);

      if (fs.existsSync(fullPath)) {
        try {
          const testFile = path.join(fullPath, '.write-test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
        } catch (error) {
          issues.push({
            path: dir,
            issue: 'Not writable',
            fix: `Check directory permissions for ${dir}`,
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      message:
        issues.length === 0
          ? 'All file permissions are correct'
          : `Permission issues found on ${issues.length} files/directories`,
    };
  }

  /**
   * Validate configuration files
   * @param {string} projectPath - Project directory path
   * @returns {Object} Validation result
   */
  async validateConfiguration(projectPath = process.cwd()) {
    const configFiles = {
      'package.json': {
        required: true,
        validate: (content) => {
          const pkg = JSON.parse(content);
          return pkg.name && pkg.version;
        },
      },
      'scripts/decompose-parallel.cjs': {
        required: true,
        validate: (content) => content.includes('parallelAgents'),
      },
    };

    const issues = [];
    const validConfigs = [];

    for (const [configPath, config] of Object.entries(configFiles)) {
      const fullPath = path.join(projectPath, configPath);

      if (!fs.existsSync(fullPath)) {
        if (config.required) {
          issues.push({
            path: configPath,
            issue: 'Missing required file',
          });
        }
      } else {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (!config.validate(content)) {
            issues.push({
              path: configPath,
              issue: 'Invalid content or format',
            });
          } else {
            validConfigs.push(configPath);
          }
        } catch (error) {
          issues.push({
            path: configPath,
            issue: `Read error: ${error.message}`,
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      validConfigs,
      issues,
      message:
        issues.length === 0
          ? 'All configuration files are valid'
          : `Configuration issues found in ${issues.length} files`,
    };
  }

  /**
   * Validate Python hooks can run
   * @param {string} projectPath - Project directory path
   * @returns {Object} Validation result
   */
  async validatePythonHooks(projectPath = process.cwd()) {
    const pythonInfo = pythonDetector.getBestPython();

    if (!pythonInfo) {
      return {
        valid: false,
        message: 'Python not available for hooks',
      };
    }

    const testHook = path.join(projectPath, '.claude/hooks/api-standards-checker.py');

    if (!fs.existsSync(testHook)) {
      return {
        valid: false,
        message: 'Test hook not found',
      };
    }

    try {
      // Try to run the hook with --help
      const result = platformUtils.executeCommand(`"${pythonInfo.path}" "${testHook}" --help`);

      return {
        valid: result.success,
        pythonVersion: pythonInfo.version,
        message: result.success
          ? `Python hooks functional with Python ${pythonInfo.version}`
          : 'Python hooks failed to execute',
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Failed to test Python hooks',
        error: error.message,
      };
    }
  }

  /**
   * Calculate overall success rate
   * @param {Object} results - Validation results
   * @returns {number} Success percentage
   */
  calculateSuccessRate(results) {
    const total = Object.keys(results).length;
    const successful = Object.values(results).filter((r) => r.valid).length;
    return Math.round((successful / total) * 100);
  }

  /**
   * Get recommendations based on validation results
   * @param {Object} results - Validation results
   * @returns {Array<string>} Recommendations
   */
  getRecommendations(results) {
    const recommendations = [];

    if (!results.cliCommand.valid) {
      recommendations.push(
        'Run "npm install --save-dev @aojdevstudio/cdev" to install CDEV in your project',
      );
    }

    if (!results.projectStructure.valid) {
      recommendations.push('Run "npx cdev install" to create missing directories');
    }

    if (results.hooks.missingHooks.length > 0) {
      recommendations.push('Re-run installation to restore missing hooks');
    }

    if (results.permissions.issues.length > 0) {
      if (platformUtils.isWindows) {
        recommendations.push('Check file permissions in Windows Security settings');
      } else {
        const fixes = results.permissions.issues.filter((i) => i.fix).map((i) => i.fix);
        if (fixes.length > 0) {
          recommendations.push(`Fix permissions: ${fixes.join('; ')}`);
        }
      }
    }

    if (!results.pythonHooks.valid) {
      recommendations.push('Install Python 3.6+ to enable hook functionality');
    }

    return recommendations;
  }

  /**
   * Get a summary report of validation
   * @param {Object} validationResult - Full validation result
   * @returns {string} Formatted report
   */
  getReport(validationResult) {
    const lines = ['Post-Installation Validation Report', '='.repeat(40)];

    // Overall status
    lines.push(`Overall Status: ${validationResult.valid ? '✓ PASS' : '✗ FAIL'}`);
    lines.push(`Success Rate: ${validationResult.successRate}%`);
    lines.push('');

    // Component status
    lines.push('Component Status:');
    for (const [component, result] of Object.entries(validationResult.details)) {
      const status = result.valid ? '✓' : '✗';
      lines.push(`  ${status} ${component}: ${result.message}`);
    }

    // Recommendations
    if (validationResult.recommendations.length > 0) {
      lines.push('');
      lines.push('Recommendations:');
      validationResult.recommendations.forEach((rec, i) => {
        lines.push(`  ${i + 1}. ${rec}`);
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

  /**
   * Run quick validation check
   * @returns {boolean} True if basic validation passes
   */
  async quickCheck() {
    const cliCheck = await this.validateCliCommand();
    const structureCheck = await this.validateProjectStructure();

    return cliCheck.valid && structureCheck.valid;
  }
}

// Export singleton instance
const postInstallValidator = new PostInstallValidator();

module.exports = {
  PostInstallValidator,
  postInstallValidator,
};
