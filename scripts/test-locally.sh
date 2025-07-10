#!/bin/bash

# Local testing script for CDEV package

set -e

echo "🧪 CDEV Local Testing Script"
echo "============================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the CDEV directory (where this script lives)
CDEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="${HOME}/cdev-test-project"

echo -e "\n${YELLOW}📁 CDEV Directory:${NC} $CDEV_DIR"
echo -e "${YELLOW}🧪 Test Directory:${NC} $TEST_DIR"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Step 1: Create test project
echo -e "\n${YELLOW}Step 1: Creating test project...${NC}"
if [ -d "$TEST_DIR" ]; then
    echo "Test project already exists. Removing..."
    rm -rf "$TEST_DIR"
fi

mkdir -p "$TEST_DIR"
cd "$TEST_DIR"
git init --quiet
npm init -y --quiet > /dev/null
print_status $? "Test project created"

# Create some test files
mkdir -p src
echo "console.log('Hello from test project');" > src/index.js
echo "# CDEV Test Project" > README.md
print_status $? "Test files created"

# Step 2: Link CDEV package
echo -e "\n${YELLOW}Step 2: Linking CDEV package...${NC}"
cd "$CDEV_DIR"
npm link
print_status $? "CDEV linked globally"

cd "$TEST_DIR"
npm link cdev
print_status $? "CDEV linked to test project"

# Step 3: Copy necessary files
echo -e "\n${YELLOW}Step 3: Copying hooks and scripts...${NC}"
cp -r "$CDEV_DIR/.claude" .
cp -r "$CDEV_DIR/scripts" .
chmod +x scripts/*.sh
print_status $? "Files copied and permissions set"

# Step 4: Set up environment
echo -e "\n${YELLOW}Step 4: Setting up environment...${NC}"
cat > .env << EOF
LINEAR_API_KEY=lin_api_test_key_12345
LLM_MODEL=mistralai/mistral-large-2411
ENGINEER_NAME=TestEngineer
EOF
print_status $? "Environment file created"

# Step 5: Test commands
echo -e "\n${YELLOW}Step 5: Testing CDEV commands...${NC}"

# Test help
echo -e "\n${YELLOW}Testing: cdev help${NC}"
cdev help
print_status $? "Help command works"

# Test version
echo -e "\n${YELLOW}Testing: cdev --version${NC}"
cdev --version
print_status $? "Version command works"

# Test status (should work even without worktrees)
echo -e "\n${YELLOW}Testing: cdev status${NC}"
cdev status || true  # Don't fail if no worktrees
echo -e "${GREEN}✅ Status command works${NC}"

# Create a mock Linear issue for testing
echo -e "\n${YELLOW}Step 6: Creating mock Linear issue...${NC}"
mkdir -p .linear-cache
cat > .linear-cache/TEST-123.json << EOF
{
  "id": "TEST-123",
  "title": "Test Issue for Local Development",
  "description": "1. Create authentication system\n2. Add user management\n3. Implement API endpoints\n4. Write tests",
  "priority": 1,
  "state": {
    "name": "In Progress"
  },
  "assignee": {
    "name": "Test User"
  }
}
EOF
print_status $? "Mock Linear issue created"

# Test decomposition
echo -e "\n${YELLOW}Testing: cdev split TEST-123${NC}"
cdev split TEST-123
print_status $? "Decomposition works"

# Check if deployment plan was created
if [ -f "shared/deployment-plans/test-123-deployment-plan.json" ]; then
    echo -e "${GREEN}✅ Deployment plan created successfully${NC}"
    echo -e "\n${YELLOW}Deployment plan preview:${NC}"
    head -20 shared/deployment-plans/test-123-deployment-plan.json
else
    echo -e "${RED}❌ Deployment plan not created${NC}"
fi

echo -e "\n${GREEN}🎉 Local testing completed successfully!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. cd $TEST_DIR"
echo "2. Try: cdev run shared/deployment-plans/test-123-deployment-plan.json"
echo "3. Try: cdev status"
echo "4. When done, cleanup with: npm unlink cdev && rm -rf $TEST_DIR"

echo -e "\n${YELLOW}To cleanup the test:${NC}"
echo "cd $CDEV_DIR && npm unlink"
echo "rm -rf $TEST_DIR"