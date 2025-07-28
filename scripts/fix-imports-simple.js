#!/usr/bin/env node

/**
 * Simple import path fixer for file moves during repository cleanup
 * Usage: node scripts/fix-imports-simple.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Path mappings for common file moves
const PATH_MAPPINGS = {
  // Configuration files moved to config/
  './jest.config.js': './config/jest.config.js',
  '../jest.config.js': '../config/jest.config.js',
  '../../jest.config.js': '../../config/jest.config.js',
  './babel.config.js': './config/babel.config.js',
  '../babel.config.js': '../config/babel.config.js',
  './tsconfig.json': './config/tsconfig.json',
  '../tsconfig.json': '../config/tsconfig.json',
  './docker-compose.yml': './config/docker-compose.yml',
  '../docker-compose.yml': '../config/docker-compose.yml',

  // Documentation files moved to docs/
  './USAGE.md': './docs/usage.md',
  '../USAGE.md': '../docs/usage.md',
  './CONTRIBUTING.md': './docs/contributing.md',
  '../CONTRIBUTING.md': '../docs/contributing.md',
  './API.md': './docs/api.md',
  '../API.md': '../docs/api.md',
};

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Fix all import/require statements
    for (const [oldPath, newPath] of Object.entries(PATH_MAPPINGS)) {
      const patterns = [
        // require() statements
        new RegExp(`require\\(['"\`]${escapeRegExp(oldPath)}['"\`]\\)`, 'g'),
        // import statements
        new RegExp(`from\\s+['"\`]${escapeRegExp(oldPath)}['"\`]`, 'g'),
        // dynamic imports
        new RegExp(`import\\(['"\`]${escapeRegExp(oldPath)}['"\`]\\)`, 'g'),
      ];

      patterns.forEach((pattern) => {
        if (pattern.test(content)) {
          content = content.replace(pattern, (match) => {
            console.log(`📝 Fixed: ${oldPath} → ${newPath} in ${filePath}`);
            hasChanges = true;
            return match.replace(oldPath, newPath);
          });
        }
      });
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fixAllImports() {
  console.log('🔧 Starting import path fixes...\n');

  // Find all JavaScript/TypeScript files
  const patterns = [
    'src/**/*.js',
    'test/**/*.js',
    'scripts/**/*.js',
    'src/**/*.ts',
    'test/**/*.ts',
  ];

  let totalFiles = 0;
  let fixedFiles = 0;

  patterns.forEach((pattern) => {
    const files = glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/coverage/**', '**/dist/**'],
    });

    files.forEach((file) => {
      totalFiles++;
      if (fixImportsInFile(file)) {
        fixedFiles++;
      }
    });
  });

  console.log(`\n✅ Import fixing complete:`);
  console.log(`   📁 Files processed: ${totalFiles}`);
  console.log(`   🔧 Files fixed: ${fixedFiles}`);

  if (fixedFiles > 0) {
    console.log('\n🧪 Running tests to verify fixes...');
    try {
      const { execSync } = require('child_process');
      execSync('npm run lint', { stdio: 'inherit' });
      console.log('✅ Linting passed after import fixes');
    } catch (error) {
      console.log('⚠️  Please run `npm run lint` to check for any remaining issues');
    }
  }
}

// Run if called directly
if (require.main === module) {
  fixAllImports();
}

module.exports = { fixImportsInFile, fixAllImports, PATH_MAPPINGS };
