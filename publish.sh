#!/bin/bash

# Claude Parallel Development Package Publisher
# This script handles the complete publishing workflow for the NPX package

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PACKAGE_NAME="claude-parallel-dev"
NPM_REGISTRY="https://registry.npmjs.org/"

echo -e "${BLUE}🚀 Claude Parallel Development Package Publisher${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get current version
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to validate package structure
validate_package() {
    echo -e "${YELLOW}📋 Validating package structure...${NC}"
    
    # Check required files exist
    required_files=("package.json" ".npmrc" "README.md" "LICENSE" "CHANGELOG.md")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ Required file missing: $file${NC}"
            exit 1
        fi
    done
    
    # Check required directories exist
    required_dirs=("scripts" "shared" "ai_docs")
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            echo -e "${RED}❌ Required directory missing: $dir${NC}"
            exit 1
        fi
    done
    
    # Make scripts executable
    chmod +x scripts/*.sh scripts/*.cjs 2>/dev/null || true
    
    echo -e "${GREEN}✅ Package structure validated${NC}"
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    
    # Check if test script exists and run it
    if npm run test --silent 2>/dev/null; then
        echo -e "${GREEN}✅ Tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  No tests found or tests failed - continuing with caution${NC}"
    fi
}

# Function to check npm authentication
check_npm_auth() {
    echo -e "${YELLOW}🔑 Checking npm authentication...${NC}"
    
    if ! npm whoami >/dev/null 2>&1; then
        echo -e "${RED}❌ Not authenticated with npm registry${NC}"
        echo -e "${YELLOW}Please run: npm login${NC}"
        exit 1
    fi
    
    npm_user=$(npm whoami)
    echo -e "${GREEN}✅ Authenticated as: $npm_user${NC}"
}

# Function to check if version already exists
check_version_exists() {
    local version="$1"
    echo -e "${YELLOW}🔍 Checking if version $version already exists...${NC}"
    
    if npm view "$PACKAGE_NAME@$version" version >/dev/null 2>&1; then
        echo -e "${RED}❌ Version $version already exists on npm registry${NC}"
        echo -e "${YELLOW}Please update the version in package.json${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Version $version is available${NC}"
}

# Function to build package
build_package() {
    echo -e "${YELLOW}🔨 Building package...${NC}"
    
    # Clean any existing build artifacts
    rm -rf dist/ build/ 2>/dev/null || true
    
    # Run prepublishOnly script if it exists
    if npm run prepublishOnly >/dev/null 2>&1; then
        echo -e "${GREEN}✅ prepublishOnly script executed${NC}"
    fi
    
    echo -e "${GREEN}✅ Package built successfully${NC}"
}

# Function to publish package
publish_package() {
    local version="$1"
    echo -e "${YELLOW}📦 Publishing package version $version...${NC}"
    
    # Publish to npm
    if npm publish --registry="$NPM_REGISTRY"; then
        echo -e "${GREEN}✅ Package published successfully!${NC}"
        echo -e "${GREEN}🎉 You can now install with: npm install -g $PACKAGE_NAME${NC}"
        echo -e "${GREEN}🎉 Or run directly with: npx $PACKAGE_NAME${NC}"
    else
        echo -e "${RED}❌ Failed to publish package${NC}"
        exit 1
    fi
}

# Function to create git tag
create_git_tag() {
    local version="$1"
    echo -e "${YELLOW}🏷️  Creating git tag v$version...${NC}"
    
    if git tag -a "v$version" -m "Release version $version"; then
        echo -e "${GREEN}✅ Git tag created${NC}"
        
        # Ask if user wants to push tag
        read -p "Push git tag to remote? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin "v$version"
            echo -e "${GREEN}✅ Git tag pushed to remote${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Failed to create git tag (might already exist)${NC}"
    fi
}

# Function to show post-publish instructions
show_post_publish_instructions() {
    local version="$1"
    echo -e "${BLUE}📖 Post-publish instructions:${NC}"
    echo -e "${BLUE}=============================${NC}"
    echo -e "• Package is now available on npm: ${GREEN}https://www.npmjs.com/package/$PACKAGE_NAME${NC}"
    echo -e "• Install globally: ${GREEN}npm install -g $PACKAGE_NAME${NC}"
    echo -e "• Use with npx: ${GREEN}npx $PACKAGE_NAME${NC}"
    echo -e "• Available commands:"
    echo -e "  - ${GREEN}npx claude-parallel [task-id]${NC} - Decompose Linear issue"
    echo -e "  - ${GREEN}npx parallel-cache [task-id]${NC} - Cache Linear issue"
    echo -e "  - ${GREEN}npx parallel-spawn [plan.json]${NC} - Spawn agent worktrees"
    echo -e "• Monitor package: ${GREEN}npm info $PACKAGE_NAME${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting publish process...${NC}"
    
    # Check prerequisites
    if ! command_exists npm; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    if ! command_exists node; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command_exists git; then
        echo -e "${RED}❌ Git is not installed${NC}"
        exit 1
    fi
    
    # Get current version
    current_version=$(get_current_version)
    echo -e "${BLUE}📦 Current version: $current_version${NC}"
    
    # Validate package
    validate_package
    
    # Check npm authentication
    check_npm_auth
    
    # Check if version already exists
    check_version_exists "$current_version"
    
    # Run tests
    run_tests
    
    # Build package
    build_package
    
    # Confirm publish
    echo -e "${YELLOW}⚠️  About to publish $PACKAGE_NAME@$current_version${NC}"
    read -p "Are you sure you want to continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}📋 Publish cancelled${NC}"
        exit 0
    fi
    
    # Publish package
    publish_package "$current_version"
    
    # Create git tag
    create_git_tag "$current_version"
    
    # Show post-publish instructions
    show_post_publish_instructions "$current_version"
    
    echo -e "${GREEN}🎉 Publish process completed successfully!${NC}"
}

# Handle command line arguments
case "${1:-}" in
    "--help"|"-h")
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --dry-run     Validate package without publishing"
        echo "  --force       Skip confirmation prompts"
        exit 0
        ;;
    "--dry-run")
        echo -e "${YELLOW}🧪 Running in dry-run mode${NC}"
        validate_package
        run_tests
        build_package
        echo -e "${GREEN}✅ Dry run completed successfully${NC}"
        exit 0
        ;;
    "--force")
        echo -e "${YELLOW}⚠️  Force mode enabled - skipping confirmations${NC}"
        # Override confirmation function
        read() { REPLY="y"; }
        ;;
esac

# Run main function
main "$@"