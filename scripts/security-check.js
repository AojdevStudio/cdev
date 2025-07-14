#!/usr/bin/env node
// Wrapper for security-check.js -> security-check.py
// This wrapper provides backward compatibility during migration

const { spawn } = require('child_process');
const path = require('path');

const scriptName = path.basename(__filename);
const scriptDir = path.dirname(__filename);
const pythonScript = path.join(scriptDir, 'python', 'security-check.py');

// Display deprecation notice
console.error(`⚠️  DEPRECATION WARNING: ${scriptName} is deprecated.`);
console.error(`   Please use: python ${pythonScript}`);
console.error(`   This wrapper will be removed in January 2026.`);
console.error(`   See docs/migration-announcement.md for details.`);
console.error('');

// Check if Python script exists
const fs = require('fs');
if (!fs.existsSync(pythonScript)) {
    console.error(`Error: Python script not found at ${pythonScript}`);
    process.exit(1);
}

// Forward to Python script
const python = spawn('python3', [pythonScript, ...process.argv.slice(2)], {
    stdio: 'inherit'
});

python.on('error', (err) => {
    console.error(`Error executing Python script: ${err.message}`);
    process.exit(1);
});

python.on('exit', (code) => {
    process.exit(code || 0);
});