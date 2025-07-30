/**
 * Command Line Interface Argument Parser
 *
 * Provides robust parsing of command line arguments for the CDEV CLI system.
 * Handles commands, options (both long and short forms), and positional arguments
 * with proper value assignment and boolean flag detection.
 *
 * Supported Argument Types:
 * - Commands: First non-option argument (e.g., 'init', 'get', 'split')
 * - Long options: --option=value or --option value format
 * - Short options: -o value format
 * - Boolean flags: --flag or -f (no value assigned)
 * - Positional arguments: Additional non-option arguments after command
 *
 * Parser Features:
 * - Handles both explicit value assignment (--key=value) and space-separated values
 * - Automatically detects boolean flags when no value is provided
 * - Preserves argument order for positional parameters
 * - Supports mixed argument types in any order
 */

/**
 * Parse Command Line Arguments
 *
 * Processes an array of command line arguments and returns a structured object
 * containing the parsed command, options, and positional arguments. The parser
 * is designed to handle various argument formats commonly used in CLI tools.
 *
 * Parsing Logic:
 * 1. Long options (--key): Look for value assignment or space-separated value
 * 2. Short options (-k): Look for space-separated value
 * 3. Boolean flags: Options without values are set to true
 * 4. Command identification: First non-option argument becomes the command
 * 5. Positional arguments: Remaining non-option arguments after command
 *
 * @param {Array<string>} args - Array of command line arguments (typically process.argv.slice(2))
 * @returns {object} Parsed arguments object
 * @returns {string|null} returns.command - Primary command to execute
 * @returns {object} returns.options - Key-value pairs of parsed options and flags
 * @returns {Array<string>} returns.positional - Additional positional arguments
 *
 * Examples:
 * parseArgs(['init', '--verbose', '--type=node', 'myproject'])
 * // Returns: { command: 'init', options: { verbose: true, type: 'node' }, positional: ['myproject'] }
 *
 * parseArgs(['get', 'PROJ-123', '--force'])
 * // Returns: { command: 'get', options: { force: true }, positional: ['PROJ-123'] }
 */
function parseArgs(args) {
  // Initialize result structure with default values
  const parsed = {
    command: null, // Primary command to execute
    options: {}, // Key-value pairs for options and flags
    positional: [], // Additional arguments after command
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Long Option Processing (--option or --option=value)
      const [key, value] = arg.substring(2).split('=');

      if (value !== undefined) {
        // Explicit value assignment: --key=value
        parsed.options[key] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Space-separated value: --key value
        parsed.options[key] = args[i + 1];
        i++; // Skip the value argument in next iteration
      } else {
        // Boolean flag: --flag (no value provided)
        parsed.options[key] = true;
      }
    } else if (arg.startsWith('-')) {
      // Short Option Processing (-o or -o value)
      const key = arg.substring(1);

      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Space-separated value: -o value
        parsed.options[key] = args[i + 1];
        i++; // Skip the value argument in next iteration
      } else {
        // Boolean flag: -f (no value provided)
        parsed.options[key] = true;
      }
    } else {
      // Positional Argument or Command Processing
      if (parsed.command === null) {
        // First non-option argument becomes the command
        parsed.command = arg;
      } else {
        // Subsequent non-option arguments are positional parameters
        parsed.positional.push(arg);
      }
    }
    i++;
  }

  return parsed;
}

/**
 * Display Help Information
 *
 * Provides comprehensive help documentation for the CDEV CLI system, including
 * all available commands, options, and usage examples. The help system is designed
 * to be user-friendly and provide clear guidance for both new and experienced users.
 *
 * Help Content Structure:
 * 1. Brief description of CDEV's purpose (Linear to parallel agents transformation)
 * 2. General usage syntax with command and options structure
 * 3. Detailed command descriptions with argument requirements
 * 4. Global options that work with all commands
 * 5. Practical examples showing common usage patterns
 *
 * Command Categories:
 * - Setup commands: init, install (project initialization)
 * - Workflow commands: get, split, run (core parallel development workflow)
 * - Management commands: status, commit (workspace and progress management)
 * - Information commands: help (documentation and guidance)
 *
 * The help system supports the complete CDEV workflow from project setup
 * through Linear issue processing to parallel agent coordination and merging.
 */
function showHelp() {
  console.log(`
Parallel Development CLI - Transform Linear issues into parallel agents

Usage: npx cdev [command] [options]

Commands:
  init [directory]          Initialize cdev in your project (recommended)
  install [directory]       Install cdev files to your project (alias for init)
  get <issue-id>            Cache a Linear issue locally
  split <issue-id>          Decompose issue into parallel agents
  run <plan-file>           Spawn all agents from deployment plan
  status [filter]           Check status of all agent worktrees
  commit [workspace] [msg]  Commit and merge agent work
  help                      Show this help message

Options:
  --help, -h               Show help
  --version, -v            Show version
  --verbose                Enable verbose output
  --force                  Force operation without confirmation

Examples:
  npx cdev init                 # Initialize in current directory
  npx cdev init ./myproject     # Initialize in specific directory
  npx cdev get PROJ-123
  npx cdev split PROJ-123
  npx cdev run shared/deployment-plans/proj-123.json
  npx cdev status ready
  npx cdev commit backend_agent "implement auth system"
`);
}

module.exports = {
  parseArgs,
  showHelp,
};
