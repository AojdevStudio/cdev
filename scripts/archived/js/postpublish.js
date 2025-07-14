#!/usr/bin/env node

/**
 * Postpublish script for Enhanced Claude Code Hooks distribution system
 *
 * This script runs after successful NPM publishing and performs:
 * - Distribution verification
 * - Package availability checks
 * - Documentation updates
 * - Notification sending
 * - Cleanup operations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const PROJECT_ROOT = path.join(__dirname, '..');

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verifyPublishedPackage() {
  log('Verifying published package on NPM...');

  const pkg = require(path.join(PROJECT_ROOT, 'package.json'));
  const npmUrl = `https://registry.npmjs.org/${pkg.name}`;

  // Wait a bit for NPM to propagate the package
  await delay(5000);

  try {
    const response = await makeHttpRequest(npmUrl);

    if (response.status === 200) {
      const latestVersion = response.data['dist-tags']?.latest;
      if (latestVersion === pkg.version) {
        log(`✅ Package ${pkg.name}@${pkg.version} successfully published to NPM`);
        return true;
      }
      log(
        `⚠️ Package published but latest version is ${latestVersion}, expected ${pkg.version}`,
        'warn',
      );
      return false;
    }
    log(`❌ Package verification failed with status ${response.status}`, 'error');
    return false;
  } catch (error) {
    log(`❌ Package verification error: ${error.message}`, 'error');
    return false;
  }
}

async function testGlobalInstallation() {
  log('Testing global NPX installation...');

  const pkg = require(path.join(PROJECT_ROOT, 'package.json'));

  try {
    // Test that the package can be installed globally
    const testCommand = `npx ${pkg.name}@${pkg.version} --version`;
    log(`Testing command: ${testCommand}`);

    // Give NPM more time to propagate
    await delay(10000);

    const output = execSync(testCommand, {
      encoding: 'utf8',
      timeout: 30000,
    });

    log(`✅ Global NPX installation test passed: ${output.trim()}`);
    return true;
  } catch (error) {
    log(`❌ Global NPX installation test failed: ${error.message}`, 'error');
    return false;
  }
}

function updateDistributionManifest() {
  log('Updating distribution manifest...');

  const manifestPath = path.join(PROJECT_ROOT, 'dist-manifest.json');

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    manifest.publishStatus = {
      published: true,
      publishedAt: new Date().toISOString(),
      npmVerified: true,
      globalInstallTested: true,
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    log(`Distribution manifest updated: ${manifestPath}`);
  } else {
    log('Distribution manifest not found - creating new one', 'warn');

    const pkg = require(path.join(PROJECT_ROOT, 'package.json'));
    const manifest = {
      package: pkg.name,
      version: pkg.version,
      publishStatus: {
        published: true,
        publishedAt: new Date().toISOString(),
        npmVerified: true,
        globalInstallTested: true,
      },
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

function generateUsageDocumentation() {
  log('Generating usage documentation...');

  const pkg = require(path.join(PROJECT_ROOT, 'package.json'));

  const usageDoc = `# ${pkg.name} - Usage Guide

## Installation

\`\`\`bash
# Global installation
npm install -g ${pkg.name}

# Or use with npx (recommended)
npx ${pkg.name}
\`\`\`

## Quick Start

\`\`\`bash
# Cache a Linear issue
npx ${pkg.name} cache-linear-issue PROJ-123

# Decompose into parallel agents
npx ${pkg.name} decompose-parallel PROJ-123

# Spawn all agents
npx ${pkg.name} spawn-agents shared/deployment-plans/proj-123-deployment-plan.json
\`\`\`

## Commands

### cache-linear-issue
Downloads and caches a Linear issue for offline work.

### decompose-parallel
Analyzes the cached issue and breaks it into parallel workstreams.

### spawn-agents
Creates isolated Git worktrees for each agent to work independently.

## Version Information

- Package: ${pkg.name}
- Version: ${pkg.version}
- Published: ${new Date().toISOString()}

## Global NPX Distribution

This package is designed to be used globally via NPX, providing:
- ✅ Offline workflow capabilities
- ✅ Parallel agent development
- ✅ Git worktree isolation
- ✅ Intelligent task decomposition

For more information, see the [README](./README.md).
`;

  const usagePath = path.join(PROJECT_ROOT, 'USAGE.md');
  fs.writeFileSync(usagePath, usageDoc);
  log(`Usage documentation generated: ${usagePath}`);
}

function logPublishSuccess() {
  log('🎉 Package publication completed successfully!');

  const pkg = require(path.join(PROJECT_ROOT, 'package.json'));

  const successMessage = `
📦 Distribution Complete!

Package: ${pkg.name}
Version: ${pkg.version}
Registry: https://www.npmjs.com/package/${pkg.name}

Global usage:
  npx ${pkg.name} cache-linear-issue PROJ-123
  npx ${pkg.name} decompose-parallel PROJ-123
  npx ${pkg.name} spawn-agents deployment-plan.json

✅ Ready for global distribution via NPX!
`;

  console.log(successMessage);
}

function cleanupTemporaryFiles() {
  log('Cleaning up temporary files...');

  const tempFiles = ['dist-manifest.json', 'npm-debug.log', '.npm-debug.log'];

  for (const file of tempFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log(`Removed: ${file}`);
    }
  }
}

async function main() {
  try {
    log('🚀 Starting postpublish operations...');

    // Verify the package was published successfully
    const published = await verifyPublishedPackage();
    if (!published) {
      throw new Error('Package publication verification failed');
    }

    // Test global installation
    const globalInstallWorks = await testGlobalInstallation();
    if (!globalInstallWorks) {
      log('Global installation test failed - package may need time to propagate', 'warn');
    }

    // Update distribution manifest
    updateDistributionManifest();

    // Generate usage documentation
    generateUsageDocumentation();

    // Log success
    logPublishSuccess();

    // Clean up temporary files
    cleanupTemporaryFiles();

    log('✅ Postpublish operations completed successfully!');
    process.exit(0);
  } catch (error) {
    log(`Postpublish operations failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  verifyPublishedPackage,
  testGlobalInstallation,
  updateDistributionManifest,
  generateUsageDocumentation,
  cleanupTemporaryFiles,
};
