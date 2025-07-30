const { execSync } = require('child_process');
const path = require('path');

describe('CLI', () => {
  const cliPath = path.join(__dirname, '..', 'bin', 'cli.js');

  test('should show help when no arguments provided', () => {
    try {
      const result = execSync(`node ${cliPath} help`, {
        encoding: 'utf8',
        timeout: 5000,
      });
      expect(result).toContain('Usage:');
    } catch (error) {
      // Help command might exit with status 0, which is expected
      if (error.status === 0 && error.stdout) {
        expect(error.stdout).toContain('Usage:');
      } else {
        throw error;
      }
    }
  });

  test('should show version with --version flag', () => {
    try {
      const result = execSync(`node ${cliPath} --version`, {
        encoding: 'utf8',
        timeout: 5000,
      });
      expect(result).toMatch(/\d+\.\d+\.\d+/); // Version pattern
    } catch (error) {
      // Version command might exit with status 0, which is expected
      if (error.status === 0 && error.stdout) {
        expect(error.stdout).toMatch(/\d+\.\d+\.\d+/);
      } else {
        throw error;
      }
    }
  });

  test('should handle unknown commands gracefully', () => {
    try {
      execSync(`node ${cliPath} unknown-command`, {
        encoding: 'utf8',
        timeout: 5000,
      });
    } catch (error) {
      // Should exit with non-zero status for unknown commands
      expect(error.status).not.toBe(0);
      expect(error.stderr || error.stdout).toMatch(/unknown|invalid|error/i);
    }
  });
});
