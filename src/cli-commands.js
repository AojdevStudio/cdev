const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { showHelp } = require('./cli-parser');

/**
 * Execute CLI commands for parallel development workflow
 */

async function executeCommand(args) {
  const { command, options, positional } = args;

  // Handle help and version
  if (options.help || options.h || command === 'help') {
    showHelp();
    return;
  }

  if (options.version || options.v) {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`v${packageData.version}`);
    return;
  }

  // Handle commands
  switch (command) {
    case 'cache':
      await cacheCommand(positional, options);
      break;
    case 'decompose':
      await decomposeCommand(positional, options);
      break;
    case 'spawn':
      await spawnCommand(positional, options);
      break;
    case 'status':
      await statusCommand(positional, options);
      break;
    case 'commit':
      await commitCommand(positional, options);
      break;
    default:
      console.error(`Unknown command: ${command || 'none'}`);
      showHelp();
      process.exit(1);
  }
}

async function cacheCommand(args, options) {
  const issueId = args[0];
  if (!issueId) {
    console.error('Error: Issue ID is required');
    console.log('Usage: cache <issue-id>');
    process.exit(1);
  }

  console.log(`Caching Linear issue: ${issueId}`);
  
  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'cache-linear-issue.sh');
    execSync(`bash "${scriptPath}" ${issueId}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('Failed to cache issue:', error.message);
    process.exit(1);
  }
}

async function decomposeCommand(args, options) {
  const issueId = args[0];
  if (!issueId) {
    console.error('Error: Issue ID is required');
    console.log('Usage: decompose <issue-id>');
    process.exit(1);
  }

  console.log(`Decomposing issue into parallel agents: ${issueId}`);
  
  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'decompose-parallel.cjs');
    execSync(`node "${scriptPath}" ${issueId}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('Failed to decompose issue:', error.message);
    process.exit(1);
  }
}

async function spawnCommand(args, options) {
  const planFile = args[0];
  if (!planFile) {
    console.error('Error: Deployment plan file is required');
    console.log('Usage: spawn <plan-file>');
    process.exit(1);
  }

  console.log(`Spawning agents from plan: ${planFile}`);
  
  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'spawn-agents.sh');
    execSync(`bash "${scriptPath}" "${planFile}"`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('Failed to spawn agents:', error.message);
    process.exit(1);
  }
}

async function statusCommand(args, options) {
  const filter = args[0];
  
  console.log('Checking agent status...');
  
  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'monitor-agents.sh');
    const command = filter ? `bash "${scriptPath}" ${filter}` : `bash "${scriptPath}"`;
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('Failed to check status:', error.message);
    process.exit(1);
  }
}

async function commitCommand(args, options) {
  const workspace = args[0];
  const customMessage = args[1];
  
  console.log(`Committing agent work${workspace ? ` for ${workspace}` : ''}...`);
  
  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'agent-commit-enhanced.sh');
    let command = `bash "${scriptPath}"`;
    
    if (workspace) {
      command += ` "${workspace}"`;
    }
    if (customMessage) {
      command += ` "${customMessage}"`;
    }
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('Failed to commit work:', error.message);
    process.exit(1);
  }
}

module.exports = {
  executeCommand,
  cacheCommand,
  decomposeCommand,
  spawnCommand,
  statusCommand,
  commitCommand
};