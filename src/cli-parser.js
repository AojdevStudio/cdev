/**
 * CLI argument parser for parallel development workflow
 */

function parseArgs(args) {
  const parsed = {
    command: null,
    options: {},
    positional: []
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      // Long option
      const [key, value] = arg.substring(2).split('=');
      if (value !== undefined) {
        parsed.options[key] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed.options[key] = args[i + 1];
        i++;
      } else {
        parsed.options[key] = true;
      }
    } else if (arg.startsWith('-')) {
      // Short option
      const key = arg.substring(1);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed.options[key] = args[i + 1];
        i++;
      } else {
        parsed.options[key] = true;
      }
    } else {
      // Positional argument or command
      if (parsed.command === null) {
        parsed.command = arg;
      } else {
        parsed.positional.push(arg);
      }
    }
    i++;
  }

  return parsed;
}

function showHelp() {
  console.log(`
Parallel Development CLI - Transform Linear issues into parallel agents

Usage: npx parallel-development-claude [command] [options]

Commands:
  cache <issue-id>          Cache a Linear issue locally
  decompose <issue-id>      Decompose issue into parallel agents
  spawn <plan-file>         Spawn all agents from deployment plan
  status [filter]           Check status of all agent worktrees
  commit [workspace] [msg]  Commit and merge agent work
  help                      Show this help message

Options:
  --help, -h               Show help
  --version, -v            Show version
  --verbose                Enable verbose output
  --force                  Force operation without confirmation

Examples:
  npx parallel-development-claude cache PROJ-123
  npx parallel-development-claude decompose PROJ-123
  npx parallel-development-claude spawn shared/deployment-plans/proj-123.json
  npx parallel-development-claude status ready
  npx parallel-development-claude commit backend_agent "implement auth system"
`);
}

module.exports = {
  parseArgs,
  showHelp
};