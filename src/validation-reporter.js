/**
 * Validation reporter for clear and actionable validation reports
 * Provides formatted output for validation results
 */

const { platformUtils } = require('./platform-utils');

// Try to load chalk if available
let chalk;
try {
  chalk = require('chalk');
} catch {
  // Chalk not available, use fallback
  chalk = null;
}

class ValidationReporter {
  constructor() {
    // Check if terminal supports colors
    this.supportsColor = process.stdout.isTTY && !process.env.NO_COLOR && chalk !== null;
    
    // Define color scheme with fallbacks
    this.colors = {
      success: this.supportsColor ? chalk.green : (s) => s,
      error: this.supportsColor ? chalk.red : (s) => s,
      warning: this.supportsColor ? chalk.yellow : (s) => s,
      info: this.supportsColor ? chalk.blue : (s) => s,
      dim: this.supportsColor ? chalk.dim : (s) => s,
      bold: this.supportsColor ? chalk.bold : (s) => s
    };

    // Define symbols
    this.symbols = {
      success: platformUtils.isWindows ? '√' : '✓',
      error: platformUtils.isWindows ? '×' : '✗',
      warning: platformUtils.isWindows ? '!' : '⚠',
      info: platformUtils.isWindows ? 'i' : 'ℹ',
      arrow: platformUtils.isWindows ? '->' : '→',
      bullet: platformUtils.isWindows ? '*' : '•'
    };
  }

  /**
   * Generate a pre-installation validation report
   * @param {Object} validationResult - Pre-install validation result
   * @returns {string} Formatted report
   */
  preInstallReport(validationResult) {
    const lines = [];
    
    // Header
    lines.push(this.colors.bold('\nPre-Installation Validation Report'));
    lines.push(this.colors.dim('─'.repeat(50)));
    lines.push('');

    // Overall status
    const statusIcon = validationResult.valid ? this.symbols.success : this.symbols.error;
    const statusColor = validationResult.valid ? this.colors.success : this.colors.error;
    const statusText = validationResult.valid ? 'READY TO INSTALL' : 'CANNOT INSTALL';
    
    lines.push(statusColor(`${statusIcon} Overall Status: ${statusText}`));
    
    if (!validationResult.canProceed) {
      lines.push(this.colors.error(`${this.symbols.error} Installation blocked due to missing requirements`));
    }
    lines.push('');

    // System Information
    lines.push(this.colors.bold('System Information:'));
    const systemInfo = validationResult.details.system;
    lines.push(`  ${this.symbols.bullet} Platform: ${systemInfo.platform} (${systemInfo.arch})`);
    lines.push('');

    // Component Checks
    lines.push(this.colors.bold('Component Checks:'));
    
    const components = [
      { name: 'Node.js', key: 'node' },
      { name: 'NPM', key: 'npm' },
      { name: 'Python', key: 'python' },
      { name: 'Git', key: 'git' },
      { name: 'Permissions', key: 'permissions' },
      { name: 'Disk Space', key: 'diskSpace' },
      { name: 'Network', key: 'network' }
    ];

    for (const comp of components) {
      const result = validationResult.details[comp.key];
      const icon = result.valid ? this.symbols.success : this.symbols.error;
      const color = result.valid ? this.colors.success : this.colors.error;
      const required = result.required ? ' (required)' : ' (optional)';
      
      lines.push(color(`  ${icon} ${comp.name}${required}`));
      
      if (result.version) {
        lines.push(this.colors.dim(`     Version: ${result.version}`));
        if (result.minVersion && !result.valid) {
          lines.push(this.colors.dim(`     Required: ${result.minVersion} or higher`));
        }
      }
      
      if (!result.valid) {
        lines.push(this.colors.dim(`     ${result.message}`));
      }
    }

    // Warnings
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      lines.push('');
      lines.push(this.colors.bold('Warnings:'));
      for (const warning of validationResult.warnings) {
        lines.push(this.colors.warning(`  ${this.symbols.warning} ${warning}`));
      }
    }

    // Errors
    if (validationResult.errors && validationResult.errors.hasErrors()) {
      lines.push('');
      lines.push(this.colors.bold('Errors:'));
      for (const error of validationResult.errors.getErrorMessages()) {
        lines.push(this.colors.error(`  ${this.symbols.error} ${error}`));
      }
    }

    // Next Steps
    lines.push('');
    lines.push(this.colors.bold('Next Steps:'));
    
    if (validationResult.valid) {
      lines.push(this.colors.success(`  ${this.symbols.arrow} Run "npm install -g claude-code-hooks" to install`));
    } else {
      lines.push(this.colors.error(`  ${this.symbols.arrow} Fix the errors above before installing`));
      
      // Specific remediation steps
      if (!validationResult.details.node.valid) {
        lines.push(this.colors.info(`  ${this.symbols.arrow} Install Node.js ${validationResult.details.node.minVersion}+ from https://nodejs.org`));
      }
      if (!validationResult.details.git.valid) {
        lines.push(this.colors.info(`  ${this.symbols.arrow} Install Git from https://git-scm.com`));
      }
      if (!validationResult.details.python.valid && validationResult.details.python.required) {
        lines.push(this.colors.info(`  ${this.symbols.arrow} Install Python ${validationResult.details.python.minVersion}+ from https://python.org`));
      }
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Generate a post-installation validation report
   * @param {Object} validationResult - Post-install validation result
   * @returns {string} Formatted report
   */
  postInstallReport(validationResult) {
    const lines = [];
    
    // Header
    lines.push(this.colors.bold('\nPost-Installation Validation Report'));
    lines.push(this.colors.dim('─'.repeat(50)));
    lines.push('');

    // Overall status
    const statusIcon = validationResult.valid ? this.symbols.success : this.symbols.error;
    const statusColor = validationResult.valid ? this.colors.success : this.colors.error;
    
    lines.push(statusColor(`${statusIcon} Installation Status: ${validationResult.successRate}% Complete`));
    lines.push('');

    // Component Status
    lines.push(this.colors.bold('Component Status:'));
    
    const components = [
      { name: 'CLI Command', key: 'cliCommand', icon: '🔧' },
      { name: 'Global Package', key: 'globalPackage', icon: '📦' },
      { name: 'Project Structure', key: 'projectStructure', icon: '📁' },
      { name: 'Hooks', key: 'hooks', icon: '🎣' },
      { name: 'Permissions', key: 'permissions', icon: '🔐' },
      { name: 'Configuration', key: 'configuration', icon: '⚙️' },
      { name: 'Python Hooks', key: 'pythonHooks', icon: '🐍' }
    ];

    for (const comp of components) {
      const result = validationResult.details[comp.key];
      const icon = result.valid ? this.symbols.success : this.symbols.error;
      const color = result.valid ? this.colors.success : this.colors.error;
      
      lines.push(color(`  ${icon} ${comp.name}`));
      
      if (!result.valid) {
        lines.push(this.colors.dim(`     ${result.message}`));
        
        // Specific details for failures
        if (comp.key === 'hooks' && result.missingHooks && result.missingHooks.length > 0) {
          lines.push(this.colors.dim(`     Missing: ${result.missingHooks.join(', ')}`));
        }
        if (comp.key === 'projectStructure' && result.missingDirs && result.missingDirs.length > 0) {
          lines.push(this.colors.dim(`     Missing: ${result.missingDirs.join(', ')}`));
        }
      } else if (result.version) {
        lines.push(this.colors.dim(`     Version: ${result.version}`));
      }
    }

    // Recommendations
    if (validationResult.recommendations && validationResult.recommendations.length > 0) {
      lines.push('');
      lines.push(this.colors.bold('Recommendations:'));
      validationResult.recommendations.forEach((rec, index) => {
        lines.push(this.colors.info(`  ${index + 1}. ${rec}`));
      });
    }

    // Quick Start
    if (validationResult.valid) {
      lines.push('');
      lines.push(this.colors.bold('Quick Start:'));
      lines.push(this.colors.success(`  ${this.symbols.arrow} Run "claude-code-hooks --help" to see available commands`));
      lines.push(this.colors.success(`  ${this.symbols.arrow} Run "claude-code-hooks init" in your project directory`));
      lines.push(this.colors.success(`  ${this.symbols.arrow} Run "claude-code-hooks linear TASK-123" to process a Linear issue`));
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Generate a progress report for ongoing operations
   * @param {string} operation - Operation name
   * @param {number} current - Current step
   * @param {number} total - Total steps
   * @param {string} message - Progress message
   * @returns {string} Formatted progress
   */
  progressReport(operation, current, total, message) {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    
    const bar = this.colors.success('█'.repeat(filled)) + this.colors.dim('░'.repeat(empty));
    
    return `${operation}: [${bar}] ${percentage}% - ${message}`;
  }

  /**
   * Generate a simple success message
   * @param {string} message - Success message
   * @returns {string} Formatted message
   */
  success(message) {
    return this.colors.success(`${this.symbols.success} ${message}`);
  }

  /**
   * Generate a simple error message
   * @param {string} message - Error message
   * @returns {string} Formatted message
   */
  error(message) {
    return this.colors.error(`${this.symbols.error} ${message}`);
  }

  /**
   * Generate a simple warning message
   * @param {string} message - Warning message
   * @returns {string} Formatted message
   */
  warning(message) {
    return this.colors.warning(`${this.symbols.warning} ${message}`);
  }

  /**
   * Generate a simple info message
   * @param {string} message - Info message
   * @returns {string} Formatted message
   */
  info(message) {
    return this.colors.info(`${this.symbols.info} ${message}`);
  }

  /**
   * Generate a table format report
   * @param {Array<Object>} data - Table data
   * @param {Array<string>} headers - Column headers
   * @returns {string} Formatted table
   */
  table(data, headers) {
    if (!data || data.length === 0) return '';

    // Calculate column widths
    const widths = {};
    headers.forEach(header => {
      widths[header] = header.length;
    });

    data.forEach(row => {
      headers.forEach(header => {
        const value = String(row[header] || '');
        widths[header] = Math.max(widths[header], value.length);
      });
    });

    const lines = [];

    // Header
    const headerRow = headers.map(h => h.padEnd(widths[h])).join(' │ ');
    lines.push(this.colors.bold(headerRow));
    lines.push(this.colors.dim(headers.map(h => '─'.repeat(widths[h])).join('─┼─')));

    // Data rows
    data.forEach(row => {
      const dataRow = headers.map(h => {
        const value = String(row[h] || '');
        return value.padEnd(widths[h]);
      }).join(' │ ');
      lines.push(dataRow);
    });

    return lines.join('\n');
  }

  /**
   * Generate a summary box
   * @param {string} title - Box title
   * @param {Array<string>} items - Box items
   * @returns {string} Formatted box
   */
  box(title, items) {
    const lines = [];
    const maxLength = Math.max(title.length, ...items.map(i => i.length)) + 4;
    
    // Top border
    lines.push(this.colors.dim('┌' + '─'.repeat(maxLength) + '┐'));
    
    // Title
    const paddedTitle = ` ${title} `.padEnd(maxLength);
    lines.push(this.colors.dim('│') + this.colors.bold(paddedTitle) + this.colors.dim('│'));
    
    // Separator
    lines.push(this.colors.dim('├' + '─'.repeat(maxLength) + '┤'));
    
    // Items
    items.forEach(item => {
      const paddedItem = `  ${item}  `.padEnd(maxLength);
      lines.push(this.colors.dim('│') + paddedItem + this.colors.dim('│'));
    });
    
    // Bottom border
    lines.push(this.colors.dim('└' + '─'.repeat(maxLength) + '┘'));
    
    return lines.join('\n');
  }

  /**
   * Clear the console
   */
  clear() {
    if (process.stdout.isTTY) {
      process.stdout.write('\x1Bc');
    }
  }

  /**
   * Write to stdout without newline
   * @param {string} text - Text to write
   */
  write(text) {
    process.stdout.write(text);
  }

  /**
   * Write line to stdout
   * @param {string} text - Text to write
   */
  writeLine(text = '') {
    console.log(text);
  }
}

// Export singleton instance
const validationReporter = new ValidationReporter();

module.exports = {
  ValidationReporter,
  validationReporter
};