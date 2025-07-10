#!/usr/bin/env node

/**
 * Prepublish script for Enhanced Claude Code Hooks distribution system
 * 
 * This script runs before publishing to NPM and performs:
 * - Validation of package.json
 * - Verification of required files
 * - Build process validation
 * - Distribution readiness checks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const REQUIRED_FILES = [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'CLAUDE.md'
];

const REQUIRED_SCRIPTS = [
  'scripts/cache-linear-issue.sh',
  'scripts/decompose-parallel.cjs',
  'scripts/spawn-agents.sh'
];

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function validatePackageJson() {
  log('Validating package.json...');
  
  const packagePath = path.join(PROJECT_ROOT, 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error('package.json not found');
  }

  const pkg = require(packagePath);
  
  // Check required fields
  const requiredFields = ['name', 'version', 'description', 'main', 'keywords', 'license'];
  for (const field of requiredFields) {
    if (!pkg[field]) {
      throw new Error(`Missing required field in package.json: ${field}`);
    }
  }

  // Validate version format
  if (!/^\d+\.\d+\.\d+/.test(pkg.version)) {
    throw new Error(`Invalid version format: ${pkg.version}`);
  }

  // Check if version is appropriate for distribution
  if (pkg.version === '1.0.0' && !process.env.FORCE_PUBLISH) {
    log('Publishing version 1.0.0 - ensure this is intentional', 'warn');
  }

  log(`Package: ${pkg.name}@${pkg.version}`);
  return pkg;
}

function validateRequiredFiles() {
  log('Validating required files...');
  
  const missing = [];
  
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }

  log(`All required files present: ${REQUIRED_FILES.join(', ')}`);
}

function validateScripts() {
  log('Validating distribution scripts...');
  
  const missing = [];
  
  for (const script of REQUIRED_SCRIPTS) {
    const scriptPath = path.join(PROJECT_ROOT, script);
    if (!fs.existsSync(scriptPath)) {
      missing.push(script);
    } else {
      // Check if shell scripts are executable
      if (script.endsWith('.sh')) {
        try {
          fs.accessSync(scriptPath, fs.constants.F_OK | fs.constants.X_OK);
        } catch (err) {
          log(`Making ${script} executable...`, 'warn');
          execSync(`chmod +x "${scriptPath}"`);
        }
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required scripts: ${missing.join(', ')}`);
  }

  log(`All distribution scripts present and executable`);
}

function validateBuildStatus() {
  log('Validating build status...');
  
  // Check if there are any uncommitted changes
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim() && !process.env.ALLOW_DIRTY) {
      throw new Error('Working directory has uncommitted changes. Use ALLOW_DIRTY=1 to override.');
    }
  } catch (err) {
    if (err.message.includes('not a git repository')) {
      log('Not a git repository - skipping git status check', 'warn');
    } else {
      throw err;
    }
  }

  log('Build status validated');
}

function generateDistributionManifest() {
  log('Generating distribution manifest...');
  
  const pkg = require(path.join(PROJECT_ROOT, 'package.json'));
  const manifest = {
    package: pkg.name,
    version: pkg.version,
    publishedAt: new Date().toISOString(),
    distribution: {
      type: 'global-npx-package',
      entryPoint: pkg.main,
      keywords: pkg.keywords,
      scripts: REQUIRED_SCRIPTS.map(script => ({
        name: path.basename(script),
        path: script,
        executable: script.endsWith('.sh')
      }))
    },
    validation: {
      filesValidated: REQUIRED_FILES.length,
      scriptsValidated: REQUIRED_SCRIPTS.length,
      buildClean: true
    }
  };

  const manifestPath = path.join(PROJECT_ROOT, 'dist-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  log(`Distribution manifest generated: ${manifestPath}`);
  return manifest;
}

function main() {
  try {
    log('🚀 Starting prepublish validation...');
    
    // Run all validation steps
    const pkg = validatePackageJson();
    validateRequiredFiles();
    validateScripts();
    validateBuildStatus();
    
    // Generate distribution manifest
    const manifest = generateDistributionManifest();
    
    log('✅ Prepublish validation completed successfully!');
    log(`Ready to publish: ${pkg.name}@${pkg.version}`);
    
    // Exit with success
    process.exit(0);
    
  } catch (error) {
    log(`Prepublish validation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  validatePackageJson,
  validateRequiredFiles,
  validateScripts,
  validateBuildStatus,
  generateDistributionManifest
};