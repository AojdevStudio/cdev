#!/usr/bin/env node

/**
 * JSCodeshift transform to fix import paths after file moves
 * Usage: jscodeshift -t scripts/fix-imports.js src/ test/
 */

const path = require('path');

// Common file moves that need import fixing
const PATH_MAPPINGS = {
  './jest.config.js': './config/jest.config.js',
  '../jest.config.js': '../config/jest.config.js',
  '../../jest.config.js': '../../config/jest.config.js',
  './jest.config': './config/jest.config',
  '../jest.config': '../config/jest.config',

  // Add more mappings as needed
  './babel.config.js': './config/babel.config.js',
  '../babel.config.js': '../config/babel.config.js',
  './tsconfig.json': './config/tsconfig.json',
  '../tsconfig.json': '../config/tsconfig.json',

  // Documentation moves
  './USAGE.md': './docs/usage.md',
  '../USAGE.md': '../docs/usage.md',
};

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasChanges = false;

  // Fix require() calls
  root
    .find(j.CallExpression, {
      callee: { name: 'require' },
      arguments: [{ type: 'Literal' }],
    })
    .forEach((path) => {
      const originalPath = path.value.arguments[0].value;
      const newPath = PATH_MAPPINGS[originalPath];

      if (newPath) {
        path.value.arguments[0].value = newPath;
        hasChanges = true;
        console.log(`Fixed require: ${originalPath} → ${newPath} in ${fileInfo.path}`);
      }
    });

  // Fix import statements
  root.find(j.ImportDeclaration).forEach((path) => {
    const originalPath = path.value.source.value;
    const newPath = PATH_MAPPINGS[originalPath];

    if (newPath) {
      path.value.source.value = newPath;
      hasChanges = true;
      console.log(`Fixed import: ${originalPath} → ${newPath} in ${fileInfo.path}`);
    }
  });

  // Fix dynamic imports
  root
    .find(j.CallExpression, {
      callee: { type: 'Import' },
      arguments: [{ type: 'Literal' }],
    })
    .forEach((path) => {
      const originalPath = path.value.arguments[0].value;
      const newPath = PATH_MAPPINGS[originalPath];

      if (newPath) {
        path.value.arguments[0].value = newPath;
        hasChanges = true;
        console.log(`Fixed dynamic import: ${originalPath} → ${newPath} in ${fileInfo.path}`);
      }
    });

  return hasChanges ? root.toSource() : null;
};

module.exports.parser = 'babel';
