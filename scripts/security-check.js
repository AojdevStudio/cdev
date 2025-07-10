#!/usr/bin/env node

/**
 * Security check script for CDEV package publication
 * Ensures no sensitive data is included in the published package
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class SecurityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.packageRoot = path.resolve(__dirname, '..');
  }

  log(message, type = 'info') {
    const prefix = {
      info: chalk.blue('ℹ'),
      success: chalk.green('✅'),
      warning: chalk.yellow('⚠️'),
      error: chalk.red('❌')
    }[type];
    console.log(`${prefix} ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  checkEnvironmentFiles() {
    this.log('Checking for environment files...');
    
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    
    for (const envFile of envFiles) {
      const filePath = path.join(this.packageRoot, envFile);
      if (fs.existsSync(filePath)) {
        this.addError(`Environment file ${envFile} found! This must not be published.`);
      }
    }

    // Check for .env.example
    const envExamplePath = path.join(this.packageRoot, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      this.log('.env.example found - this is good for documentation', 'success');
      
      // Check if .env.example contains real API keys
      const content = fs.readFileSync(envExamplePath, 'utf8');
      const suspiciousPatterns = [
        /sk-[a-zA-Z0-9]{48}/,  // OpenAI API key pattern
        /lin_api_[a-zA-Z0-9]{10,}/,  // Linear API key pattern (but not example X's)
        /pk_[a-zA-Z0-9]{10,}/,      // General API key pattern
      ];
      
      // Additional check for obviously fake keys
      const fakeKeyPatterns = [
        /X{10,}/,  // Multiple X's
        /your[-_].*[-_]key[-_]here/i,
        /example[-_]key/i,
        /test[-_]key/i,
      ];
      
      let foundSuspicious = false;
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          // Check if it's obviously fake
          let isFake = false;
          for (const fakePattern of fakeKeyPatterns) {
            if (fakePattern.test(content)) {
              isFake = true;
              break;
            }
          }
          if (!isFake) {
            this.addError('.env.example contains what appears to be a real API key!');
            foundSuspicious = true;
            break;
          }
        }
      }
    } else {
      this.addWarning('.env.example not found - consider adding for user guidance');
    }
  }

  checkSensitiveFiles() {
    this.log('Checking for sensitive files...');
    
    // Check if package.json has files field to control what gets published
    const packagePath = path.join(this.packageRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (pkg.files && pkg.files.length > 0) {
      this.log(`Using package.json files field to determine published files`, 'success');
      
      // Only check files that would actually be published
      const publishedDirs = pkg.files.filter(f => !f.includes('.'));
      
      for (const dir of publishedDirs) {
        const dirPath = path.join(this.packageRoot, dir);
        if (fs.existsSync(dirPath)) {
          this.checkDirectoryForSecrets(dirPath, dir);
        }
      }
    } else {
      // Fallback to checking common sensitive directories
      const sensitiveFiles = [
        '.linear-cache',
        'validation',
        'shared/coordination',
        'shared/deployment-plans',
        'workspaces',
        'logs'
      ];

      for (const file of sensitiveFiles) {
        const filePath = path.join(this.packageRoot, file);
        if (fs.existsSync(filePath)) {
          this.addError(`Sensitive directory/file ${file} found! This contains project-specific data.`);
        }
      }
    }
  }

  checkDirectoryForSecrets(dirPath, dirName) {
    // Check if published directories contain sensitive files
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile() && file.name.match(/\.(env|key|secret|token|credential)$/)) {
          this.addWarning(`Potentially sensitive file found in published directory: ${dirName}/${file.name}`);
        }
      }
    } catch (error) {
      // Directory might not be readable, skip
    }
  }

  checkPackageJson() {
    this.log('Checking package.json security settings...');
    
    const packagePath = path.join(this.packageRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Check for private flag
    if (pkg.private === true) {
      this.addError('package.json has "private": true - this will prevent publication');
    }

    // Check files field
    if (!pkg.files || pkg.files.length === 0) {
      this.addWarning('package.json missing "files" field - all files will be included');
    } else {
      this.log(`Files field found with ${pkg.files.length} entries`, 'success');
    }

    // Check for repository and bug URLs
    if (!pkg.repository) {
      this.addWarning('package.json missing repository field');
    }

    // Check version
    if (!pkg.version || pkg.version === '0.0.0') {
      this.addError('Invalid or missing version in package.json');
    }
  }

  checkNpmIgnore() {
    this.log('Checking .npmignore...');
    
    const npmIgnorePath = path.join(this.packageRoot, '.npmignore');
    if (!fs.existsSync(npmIgnorePath)) {
      this.addWarning('.npmignore not found - relying on .gitignore and package.json files field');
      return;
    }

    const content = fs.readFileSync(npmIgnorePath, 'utf8');
    const requiredPatterns = ['.env', 'logs/', '*secret*', '*key*'];
    
    for (const pattern of requiredPatterns) {
      if (!content.includes(pattern)) {
        this.addWarning(`Important pattern "${pattern}" missing from .npmignore`);
      }
    }

    this.log('.npmignore found with security patterns', 'success');
  }

  checkGitIgnore() {
    this.log('Checking .gitignore...');
    
    const gitIgnorePath = path.join(this.packageRoot, '.gitignore');
    if (!fs.existsSync(gitIgnorePath)) {
      this.addWarning('.gitignore not found');
      return;
    }

    const content = fs.readFileSync(gitIgnorePath, 'utf8');
    if (!content.includes('.env')) {
      this.addError('.gitignore does not exclude .env files!');
    }
  }

  checkForHardcodedSecrets() {
    this.log('Checking source files for hardcoded secrets...');
    
    const sourceFiles = [];
    const srcDir = path.join(this.packageRoot, 'src');
    const scriptsDir = path.join(this.packageRoot, 'scripts');
    
    if (fs.existsSync(srcDir)) {
      this.findJsFiles(srcDir, sourceFiles);
    }
    if (fs.existsSync(scriptsDir)) {
      this.findJsFiles(scriptsDir, sourceFiles);
    }

    const secretPatterns = [
      /sk-[a-zA-Z0-9]{48}/,  // OpenAI API key
      /lin_api_[a-zA-Z0-9]{32,}/,  // Linear API key
      /AIza[0-9A-Za-z-_]{35}/,  // Google API key
      /pk_[a-zA-Z0-9]{24,}/,  // Stripe-like keys
      /[\"\'](?:password|secret|key|token)[\"\']:\s*[\"\'][^\"\']{8,}[\"\']/, // JSON secrets
    ];

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          this.addError(`Potential hardcoded secret found in ${path.relative(this.packageRoot, file)}`);
          break;
        }
      }
    }
  }

  findJsFiles(dir, files) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this.findJsFiles(fullPath, files);
      } else if (entry.endsWith('.js') || entry.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  run() {
    console.log(chalk.bold.blue('\n🔒 CDEV Security Check\n'));
    
    this.checkEnvironmentFiles();
    this.checkSensitiveFiles();
    this.checkPackageJson();
    this.checkNpmIgnore();
    this.checkGitIgnore();
    this.checkForHardcodedSecrets();
    
    console.log('\n📊 Security Check Results:');
    console.log(`${chalk.green('✅')} Checks passed`);
    console.log(`${chalk.yellow('⚠️')} Warnings: ${this.warnings.length}`);
    console.log(`${chalk.red('❌')} Errors: ${this.errors.length}`);
    
    if (this.warnings.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      this.warnings.forEach(warning => console.log(`  ${chalk.yellow('⚠️')} ${warning}`));
    }
    
    if (this.errors.length > 0) {
      console.log(chalk.red('\nErrors that must be fixed:'));
      this.errors.forEach(error => console.log(`  ${chalk.red('❌')} ${error}`));
      console.log(chalk.red('\n🚫 Publication blocked due to security issues!'));
      process.exit(1);
    }
    
    console.log(chalk.green('\n🎉 Security check passed! Package is safe to publish.\n'));
  }
}

if (require.main === module) {
  const checker = new SecurityChecker();
  checker.run();
}

module.exports = { SecurityChecker };