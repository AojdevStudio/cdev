#!/usr/bin/env node

const path = require('path');
const { parseArgs } = require('../src/cli-parser');
const { executeCommand } = require('../src/cli-commands');

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    await executeCommand(args);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
