#!/bin/bash

# Test the interactive installer
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing cdev interactive installer...${NC}"

# Get the absolute path to the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLI_PARSER="$PROJECT_ROOT/src/cli-parser.js"

# Verify CLI parser exists
if [ ! -f "$CLI_PARSER" ]; then
    echo -e "${RED}✗ CLI parser not found at: $CLI_PARSER${NC}"
    exit 1
fi

echo -e "${BLUE}Using CLI parser: $CLI_PARSER${NC}"

# Create test directory
TEST_DIR="/tmp/cdev-installer-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo -e "${BLUE}Test directory: $TEST_DIR${NC}"

# Test 1: Basic installation with default selections
echo -e "\n${BLUE}Test 1: Running installer with default selections...${NC}"

# Simulate user input: accept defaults for most options
echo -e "\n\n\n\ny\ny\nTest Engineer\n" | node "$CLI_PARSER" init

# Verify core components were installed
echo -e "\n${BLUE}Verifying installation...${NC}"

# Check directory structure
REQUIRED_DIRS=(
    ".claude"
    ".claude/hooks"
    ".claude/commands"
    ".claude/agents"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ Directory $dir exists${NC}"
    else
        echo -e "${RED}✗ Directory $dir missing${NC}"
        exit 1
    fi
done

# Check tier 1 hooks (should always be installed)
echo -e "\n${BLUE}Checking Tier 1 hooks (critical - should always be installed)...${NC}"

TIER1_HOOKS=(
    "pre_tool_use.py"
    "post_tool_use.py"
    "notification.py"
    "stop.py"
    "subagent_stop.py"
)

for hook in "${TIER1_HOOKS[@]}"; do
    # Check in flat structure only (no tier subdirectories)
    if [ -f ".claude/hooks/$hook" ]; then
        echo -e "${GREEN}✓ $hook installed${NC}"
    else
        echo -e "${RED}✗ $hook NOT installed (critical hook missing!)${NC}"
        exit 1
    fi
done

# Check that default optional hooks were installed
echo -e "\n${BLUE}Checking default optional hooks...${NC}"

DEFAULT_OPTIONAL_HOOKS=(
    "code-quality-reporter.py"
    "import-organizer.py"
    "typescript-validator.py"
    "task-completion-enforcer.py"
    "commit-message-validator.py"
    "command-template-guard.py"
)

for hook in "${DEFAULT_OPTIONAL_HOOKS[@]}"; do
    if [ -f ".claude/hooks/$hook" ]; then
        echo -e "${GREEN}✓ $hook installed (default selection)${NC}"
    else
        echo -e "${RED}✗ $hook NOT installed (should be default)${NC}"
        exit 1
    fi
done

# Test 2: Verify commands and agents were installed
echo -e "\n${BLUE}Test 2: Checking commands and agents installation...${NC}"

if [ -d ".claude/commands" ] && [ "$(ls -A .claude/commands)" ]; then
    echo -e "${GREEN}✓ Commands directory populated${NC}"
else
    echo -e "${RED}✗ Commands directory empty or missing${NC}"
    exit 1
fi

if [ -d ".claude/agents" ] && [ "$(ls -A .claude/agents)" ]; then
    echo -e "${GREEN}✓ Agents directory populated${NC}"
else
    echo -e "${RED}✗ Agents directory empty or missing${NC}"
    exit 1
fi

# Test 3: Verify settings.json was created
echo -e "\n${BLUE}Test 3: Checking settings.json configuration...${NC}"

if [ -f ".claude/settings.json" ]; then
    echo -e "${GREEN}✓ settings.json created${NC}"
    
    # Check if it contains hook configurations
    if grep -q "hooks" ".claude/settings.json"; then
        echo -e "${GREEN}✓ Hook configurations present${NC}"
    else
        echo -e "${RED}✗ Hook configurations missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ settings.json missing${NC}"
    exit 1
fi

echo -e "\n${GREEN}All tests passed! ✅${NC}"

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo -e "${BLUE}Test completed successfully${NC}"
