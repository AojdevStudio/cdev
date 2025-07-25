#!/usr/bin/env node

/**
 * /enforce-structure - Root Folder Structure Enforcement
 *
 * Validates and enforces clean root directory structure by:
 * - Checking for forbidden files in root
 * - Moving misplaced files to correct locations
 * - Providing detailed violation reports
 *
 * Usage: /enforce-structure [--fix] [--dry-run] [--strict]
 */

const path = require('path');

const fs = require('fs-extra');
const chalk = require('chalk');

class StructureEnforcer {
  constructor(options = {}) {
    this.options = {
      fix: options.fix || false,
      dryRun: options.dryRun || false,
      strict: options.strict || false,
      ...options,
    };

    // Define allowed and forbidden patterns
    this.rules = {
      allowedMdFiles: new Set([
        'README.md',
        'CHANGELOG.md',
        'CLAUDE.md',
        'ROADMAP.md',
        'SECURITY.md',
        'LICENSE.md',
      ]),

      forbiddenPatterns: [
        // Test configs
        {
          pattern: /^jest\.config.*\.js$/,
          location: 'config/',
          description: 'Jest configuration files',
        },
        { pattern: /^babel\.config\.js$/, location: 'config/', description: 'Babel configuration' },
        { pattern: /^\.babelrc/, location: 'config/', description: 'Babel configuration' },

        // Build/Deploy configs
        {
          pattern: /^webpack\.config.*\.js$/,
          location: 'config/',
          description: 'Webpack configuration',
        },
        { pattern: /^vite\.config.*\.js$/, location: 'config/', description: 'Vite configuration' },
        {
          pattern: /^rollup\.config.*\.js$/,
          location: 'config/',
          description: 'Rollup configuration',
        },
        {
          pattern: /^tsconfig.*\.json$/,
          location: 'config/',
          description: 'TypeScript configuration',
        },
        {
          pattern: /^docker-compose\.ya?ml$/,
          location: 'config/',
          description: 'Docker Compose files',
        },
        { pattern: /^Dockerfile/, location: 'config/', description: 'Docker files' },

        // Scripts
        { pattern: /^.*\.sh$/, location: 'scripts/', description: 'Shell scripts' },
        { pattern: /^build\.js$/, location: 'scripts/', description: 'Build scripts' },
        { pattern: /^deploy\.js$/, location: 'scripts/', description: 'Deployment scripts' },
        {
          pattern: /^publish\.js$/,
          location: 'scripts/deployment/',
          description: 'Publishing scripts',
        },

        // Temporary/Debug files
        { pattern: /^debug-.*\.js$/, location: 'archive/', description: 'Debug scripts' },
        { pattern: /^test-.*\.js$/, location: 'archive/', description: 'Test utility scripts' },
        { pattern: /^temp-.*/, location: 'archive/', description: 'Temporary files' },
        { pattern: /.*-report\.md$/, location: 'docs/', description: 'Report documents' },
        { pattern: /.*-plan\.md$/, location: 'docs/', description: 'Planning documents' },

        // Documentation that should be in docs/
        { pattern: /^USAGE\.md$/, location: 'docs/', description: 'Usage documentation' },
        {
          pattern: /^CONTRIBUTING\.md$/,
          location: 'docs/',
          description: 'Contributing guidelines',
        },
        {
          pattern: /^ARCHITECTURE\.md$/,
          location: 'docs/',
          description: 'Architecture documentation',
        },
        { pattern: /^API\.md$/, location: 'docs/', description: 'API documentation' },
      ],

      // Files and directories that should always stay in root
      essentialRootFiles: new Set([
        'package.json',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '.gitignore',
        '.gitattributes',
        '.npmignore',
        '.npmrc',
        '.editorconfig',
        '.prettierrc.json',
        '.prettierignore',
        '.eslintrc.json',
        '.eslintignore',
        'LICENSE',
        'jest.config.js', // Main jest config can stay
      ]),

      // Essential framework directories that must stay in root
      essentialRootDirectories: new Set([
        'ai-docs', // Framework AI documentation
        'src', // Source code
        'test', // Test files
        'bin', // Binary/executable files
        'lib', // Library files
        'node_modules', // Dependencies
        '.git', // Git repository
        '.claude', // Claude configuration
      ]),
    };
  }

  async enforce(projectPath = process.cwd()) {
    console.log(chalk.blue('🔍 Analyzing root directory structure...'));

    const violations = await this.analyzeViolations(projectPath);

    if (violations.length === 0) {
      console.log(chalk.green('✅ Root directory structure is compliant!'));
      return { compliant: true, violations: [] };
    }

    console.log(chalk.yellow(`⚠️  Found ${violations.length} structure violations:`));

    // Report violations
    violations.forEach((violation, index) => {
      console.log(chalk.red(`${index + 1}. ${violation.file}`));
      console.log(chalk.gray(`   → ${violation.reason}`));
      console.log(chalk.cyan(`   → Should be moved to: ${violation.suggestedLocation}`));
    });

    if (this.options.fix && !this.options.dryRun) {
      console.log(chalk.blue('\\n🔧 Fixing violations...'));
      await this.fixViolations(projectPath, violations);
    } else if (this.options.dryRun) {
      console.log(chalk.blue('\\n🔍 Dry run - no changes made'));
    } else {
      console.log(chalk.yellow('\\n💡 Run with --fix to automatically resolve violations'));
    }

    return { compliant: false, violations };
  }

  async analyzeViolations(projectPath) {
    const violations = [];
    const rootFiles = await fs.readdir(projectPath);

    for (const file of rootFiles) {
      const filePath = path.join(projectPath, file);
      const stats = await fs.stat(filePath);

      // Skip directories
      if (stats.isDirectory()) {
        continue;
      }

      // Skip essential root files
      if (this.rules.essentialRootFiles.has(file)) {
        continue;
      }

      // Check .md files
      if (file.endsWith('.md')) {
        if (!this.rules.allowedMdFiles.has(file)) {
          violations.push({
            file,
            reason: 'Unauthorized .md file in root directory',
            suggestedLocation: 'docs/',
            type: 'forbidden_md',
          });
        }
        continue;
      }

      // Check against forbidden patterns
      for (const rule of this.rules.forbiddenPatterns) {
        if (rule.pattern.test(file)) {
          violations.push({
            file,
            reason: `${rule.description} should not be in root`,
            suggestedLocation: rule.location,
            type: 'forbidden_pattern',
          });
          break;
        }
      }
    }

    return violations;
  }

  async fixViolations(projectPath, violations) {
    let fixed = 0;

    for (const violation of violations) {
      try {
        const sourcePath = path.join(projectPath, violation.file);
        const targetDir = path.join(projectPath, violation.suggestedLocation);
        const targetPath = path.join(targetDir, violation.file);

        // Ensure target directory exists
        await fs.ensureDir(targetDir);

        // Move the file
        await fs.move(sourcePath, targetPath, { overwrite: false });

        console.log(chalk.green(`✅ Moved ${violation.file} → ${violation.suggestedLocation}`));
        fixed++;
      } catch (error) {
        console.log(chalk.red(`❌ Failed to move ${violation.file}: ${error.message}`));
      }
    }

    console.log(chalk.green(`\\n🎉 Fixed ${fixed}/${violations.length} violations`));

    if (fixed > 0) {
      console.log(chalk.yellow('\\n⚠️  Note: You may need to update file references in:'));
      console.log(chalk.gray('   • package.json scripts'));
      console.log(chalk.gray('   • Configuration files'));
      console.log(chalk.gray('   • Import statements'));
    }
  }

  // Generate enforcement report
  async generateReport(projectPath = process.cwd()) {
    const result = await this.enforce(projectPath);

    const report = {
      timestamp: new Date().toISOString(),
      projectPath,
      compliant: result.compliant,
      violationCount: result.violations.length,
      violations: result.violations,
      rules: {
        allowedMdFiles: Array.from(this.rules.allowedMdFiles),
        forbiddenPatternCount: this.rules.forbiddenPatterns.length,
      },
    };

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    fix: args.includes('--fix'),
    dryRun: args.includes('--dry-run'),
    strict: args.includes('--strict'),
    report: args.includes('--report'),
  };

  const enforcer = new StructureEnforcer(options);

  try {
    if (options.report) {
      const report = await enforcer.generateReport();
      console.log(JSON.stringify(report, null, 2));
    } else {
      await enforcer.enforce();
    }
  } catch (error) {
    console.error(chalk.red('Error enforcing structure:'), error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { StructureEnforcer };

// Run if called directly
if (require.main === module) {
  main();
}
