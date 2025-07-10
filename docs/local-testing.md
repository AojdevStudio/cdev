# Local Testing Guide for CDEV

This guide helps you test CDEV locally before publishing to NPM.

## Prerequisites

1. Ensure your CDEV package is ready:
```bash
cd /path/to/cdev
npm install
npm test
```

2. Create or choose a test project with:
   - Git initialized
   - A valid package.json
   - Some source code files

## Method 1: npm link (Best for Development)

### Step 1: Link CDEV Globally

```bash
# In CDEV directory
cd /path/to/cdev
npm link

# Verify it's linked
npm list -g --depth=0 | grep cdev
```

### Step 2: Link to Test Project

```bash
# In your test project
cd /path/to/test-project
npm link cdev

# Verify the link
ls -la node_modules/cdev
```

### Step 3: Copy Required Files

Since CDEV needs hooks and scripts in your project:

```bash
# Copy the necessary files
cp -r /path/to/cdev/.claude .
cp -r /path/to/cdev/scripts .
chmod +x scripts/*.sh
```

### Step 4: Set Up Environment

```bash
# Create .env file
echo "LINEAR_API_KEY=lin_api_xxxxx" >> .env
echo "LLM_MODEL=mistralai/mistral-large-2411" >> .env
```

### Step 5: Test Commands

```bash
# Test basic functionality
cdev help
cdev --version

# Test with a Linear issue (if you have API key)
cdev get PROJ-123

# Test decomposition with cached issue
cdev split PROJ-123

# Check status
cdev status
```

## Method 2: npm pack (Simulates Real Install)

### Step 1: Pack the Package

```bash
# In CDEV directory
cd /path/to/cdev
npm pack

# Creates cdev-1.0.0.tgz
ls *.tgz
```

### Step 2: Install in Test Project

```bash
# In test project
cd /path/to/test-project
npm install /path/to/cdev/cdev-1.0.0.tgz

# Or install globally
npm install -g /path/to/cdev/cdev-1.0.0.tgz
```

### Step 3: Follow Steps 3-5 from Method 1

## Method 3: Direct Path Install

```bash
# In test project
npm install /path/to/cdev

# Or globally
npm install -g /path/to/cdev
```

## Testing Checklist

### Basic Functionality
- [ ] `cdev help` shows command list
- [ ] `cdev --version` shows correct version
- [ ] Commands run without Node.js errors

### Linear Integration
- [ ] `cdev get ISSUE-ID` caches issue
- [ ] `.linear-cache/` directory created
- [ ] Issue JSON file contains correct data

### Task Decomposition
- [ ] `cdev split ISSUE-ID` creates deployment plan
- [ ] `shared/deployment-plans/` directory created
- [ ] JSON plan has correct structure

### Agent Management
- [ ] `cdev run plan.json` spawns worktrees
- [ ] Git worktrees created in correct location
- [ ] Agent context files generated

### Status Monitoring
- [ ] `cdev status` shows worktree status
- [ ] Filters work (`ready`, `complete`, etc.)

### Integration
- [ ] `cdev commit` validates checklist
- [ ] Merge process works correctly
- [ ] Cleanup removes worktrees

## Common Issues During Testing

### Issue: Command not found
```bash
# Ensure global install or link
npm list -g | grep cdev

# Check PATH includes npm globals
echo $PATH
npm config get prefix
```

### Issue: Hooks not working
```bash
# Check Python is available
python3 --version

# Test hooks directly
python3 .claude/hooks/pre_tool_use.py
```

### Issue: Scripts fail
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Check bash is available
which bash
```

## Cleanup After Testing

### Remove npm link
```bash
# In test project
npm unlink cdev

# In CDEV directory
npm unlink
```

### Remove installed package
```bash
# If installed locally
npm uninstall cdev

# If installed globally
npm uninstall -g cdev
```

### Clean up files
```bash
rm -rf .claude/
rm -rf scripts/
rm -rf .linear-cache/
rm -rf shared/
```

## Tips for Effective Testing

1. **Use a disposable test project** - Create a simple project just for testing
2. **Test with real Linear issues** - Use actual issue IDs if you have access
3. **Test error cases** - Try invalid commands, missing files, etc.
4. **Check file permissions** - Ensure scripts are executable
5. **Test on different platforms** - If possible, test on macOS, Linux, Windows

## Example Test Project Setup

```bash
# Create test project
mkdir cdev-test-project
cd cdev-test-project
git init
npm init -y

# Add some test files
mkdir src
echo "console.log('test');" > src/index.js
echo "# Test Project" > README.md

# Now follow the testing steps above
```

## Debugging During Testing

Enable debug output:
```bash
export CDEV_DEBUG=true
export NODE_ENV=development

# Run commands with verbose output
cdev get PROJ-123 --verbose
```

Check logs:
```bash
# If your package creates logs
tail -f logs/*.log
```

## Next Steps

Once testing is complete and everything works:
1. Update version in package.json if needed
2. Run `npm publish` to publish to NPM
3. Test installation from NPM registry