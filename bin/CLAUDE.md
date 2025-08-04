# bin/ Directory Documentation

## Overview

The `bin/` directory contains the main executable entry point for the CDEV (Claude Development) CLI system. This directory serves as the primary interface between users and the CDEV parallel development orchestration system, providing a command-line interface for transforming Linear issues into coordinated parallel agent workflows.

## File Structure

```
bin/
└── cli.js                    # Main CLI executable entry point
```

## Files Documentation

### cli.js

**Purpose**: Main executable entry point for the CDEV CLI system that handles command-line argument parsing and command execution orchestration.

**Entry Points**:

- `main()`: Primary asynchronous function that orchestrates the CLI workflow from argument parsing through command execution
- Module exports: `{ main }` - Allows the main function to be imported and called programmatically

**Key Functions**:

- `main()`: Orchestrates the complete CLI workflow including argument parsing, command execution, and error handling. Uses try-catch to provide user-friendly error messages and proper exit codes.

**Important Variables/Constants**:

- Shebang line: `#!/usr/bin/env node` - Enables direct execution as a shell command
- Module check: `require.main === module` - Ensures main() only runs when file is executed directly, not when imported

**Dependencies**:

- `../src/cli-parser`: Provides `parseArgs()` function for robust command-line argument parsing
- `../src/cli-commands`: Provides `executeCommand()` function for command execution logic
- Node.js built-ins: `path` module for file system path operations

**Execution Flow**:

1. Parse command-line arguments using `parseArgs()` from process.argv
2. Execute the parsed command using `executeCommand()`
3. Handle any errors with user-friendly messages and exit code 1
4. Allow programmatic usage through module exports

**Error Handling**:

- Comprehensive try-catch wrapper around the entire execution flow
- User-friendly error messages prefixed with "Error:"
- Proper process exit codes (1 for errors, 0 for success)
- Prevents stack traces from overwhelming end users

**Package Configuration Integration**:
This file is configured as the main executable in package.json:

- `"main": "bin/cli.js"` - Primary entry point for the package
- `"bin": { "cdev": "bin/cli.js" }` - Creates the `cdev` command when installed globally
- Executable permissions set during build process via `chmod +x bin/cli.js`

**CLI Command Support**:
The executable supports the complete CDEV workflow through delegated command handlers:

- **Setup Commands**: `init`, `install` - Project initialization and CDEV installation
- **Workflow Commands**: `get`, `split`, `run` - Core parallel development workflow for Linear issue processing
- **Management Commands**: `status`, `commit` - Agent workspace monitoring and work integration
- **Information Commands**: `help`, `--version` - Documentation and version information

**Usage Examples**:

```bash
# Direct execution (when installed globally)
cdev init
cdev get PROJ-123
cdev split PROJ-123

# NPX execution (without global installation)
npx @aojdevstudio/cdev init
npx @aojdevstudio/cdev get PROJ-123

# Programmatic usage (when imported as module)
const { main } = require('./bin/cli.js');
process.argv = ['node', 'cli.js', 'init', '--verbose'];
await main();
```

**Security Considerations**:

- Uses `parseArgs()` for safe argument parsing without eval or unsafe operations
- Command execution is delegated to validated command handlers
- No direct shell command execution in this entry point
- Proper error boundaries prevent information leakage

**Performance Characteristics**:

- Lightweight entry point with minimal overhead
- Asynchronous execution supports non-blocking operations
- Efficient argument parsing without complex regex or string manipulation
- Fast startup time for CLI responsiveness

**Distribution Context**:
This file is included in the NPM package distribution and serves as the primary interface for:

- Global installations via `npm install -g @aojdevstudio/cdev`
- Local project usage via `npx @aojdevstudio/cdev`
- Direct Node.js execution via `node bin/cli.js`
- Integration into development workflows and CI/CD pipelines

**Maintenance Notes**:

- Keep this file minimal and focused solely on CLI orchestration
- All business logic should remain in the src/ directory modules
- Maintain backward compatibility for command-line interface changes
- Ensure proper error handling for all execution paths
- Test both direct execution and programmatic usage scenarios
