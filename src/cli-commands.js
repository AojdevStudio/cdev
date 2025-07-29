const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { showHelp } = require('./cli-parser');
const InteractiveInstaller = require('./interactive-installer');

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
    case 'install':
      await installCommand(positional, options);
      break;
    case 'get':
    case 'cache': // backward compatibility
      await cacheCommand(positional, options);
      break;
    case 'split':
    case 'decompose': // backward compatibility
      await decomposeCommand(positional, options);
      break;
    case 'run':
    case 'spawn': // backward compatibility
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

async function installCommand(args, options) {
  const targetDir = args[0] || '.';

  const installer = new InteractiveInstaller();
  await installer.install(targetDir, options);
}

async function cacheCommand(args, _options) {
  const issueId = args[0];
  if (!issueId) {
    console.error('Error: Issue ID is required');
    console.log('Usage: get <issue-id>');
    process.exit(1);
  }

  console.log(`Caching Linear issue: ${issueId}`);

  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'python', 'cache-linear-issue.py');
    execSync(`"${scriptPath}" ${issueId}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('Failed to cache issue:', error.message);
    process.exit(1);
  }
}

async function decomposeCommand(args, _options) {
  const issueId = args[0];
  if (!issueId) {
    console.error('Error: Issue ID is required');
    console.log('Usage: split <issue-id>');
    process.exit(1);
  }

  console.log(`Decomposing issue into parallel agents: ${issueId}`);

  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'python', 'decompose-parallel.py');
    execSync(`"${scriptPath}" ${issueId}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('Failed to decompose issue:', error.message);
    process.exit(1);
  }
}

async function spawnCommand(args, _options) {
  const planFile = args[0];
  if (!planFile) {
    console.error('Error: Deployment plan file is required');
    console.log('Usage: run <plan-file>');
    process.exit(1);
  }

  console.log(`Spawning agents from plan: ${planFile}`);

  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'python', 'spawn-agents.py');
    execSync(`"${scriptPath}" "${planFile}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('Failed to spawn agents:', error.message);
    process.exit(1);
  }
}

async function statusCommand(args, _options) {
  const filter = args[0];

  console.log('Checking agent status...');

  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'python', 'monitor-agents.py');
    const command = filter ? `"${scriptPath}" ${filter}` : `"${scriptPath}"`;
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('Failed to check status:', error.message);
    process.exit(1);
  }
}

async function commitCommand(args, _options) {
  const workspace = args[0];
  const customMessage = args[1];

  console.log(`Committing agent work${workspace ? ` for ${workspace}` : ''}...`);

  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'python', 'agent-commit.py');
    let command = `"${scriptPath}"`;

    if (workspace) {
      command += ` "${workspace}"`;
    }
    if (customMessage) {
      command += ` "${customMessage}"`;
    }

    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('Failed to commit work:', error.message);
    process.exit(1);
  }
}

module.exports = {
  executeCommand,
  installCommand,
  cacheCommand,
  decomposeCommand,
  spawnCommand,
  statusCommand,
  commitCommand,
};
