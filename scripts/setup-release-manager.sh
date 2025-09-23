#!/bin/bash

# Setup Release Manager for a new project
# Run this once in each new project to set up release management

set -e

echo "🔧 Setting up Release Manager"
echo "============================="

# Get project info
echo "Enter your GitHub username:"
read -r github_username

echo "Enter repository name (current directory: $(basename "$PWD")):"
read -r repo_name
repo_name=${repo_name:-$(basename "$PWD")}

echo "Enter project display name:"
read -r project_name
project_name=${project_name:-$repo_name}

echo "Enter default branch (main/master):"
read -r default_branch
default_branch=${default_branch:-main}

# Create release-manager.sh with project-specific configuration
cat > release-manager.sh << 'SCRIPT_END'
#!/bin/bash

# GitHub Release Manager Script
# Auto-generated for this project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# PROJECT CONFIGURATION - EDIT THESE VALUES
PROJECT_NAME="PROJECT_NAME_PLACEHOLDER"
REPO_OWNER="REPO_OWNER_PLACEHOLDER"
REPO_NAME="REPO_NAME_PLACEHOLDER"
DEFAULT_BRANCH="DEFAULT_BRANCH_PLACEHOLDER"

print_status() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

check_prerequisites() {
    print_status "Checking prerequisites..."

    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed."
        echo "Install it from: https://cli.github.com/"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        print_error "Not authenticated with GitHub CLI."
        echo "Run: gh auth login"
        exit 1
    fi

    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository."
        exit 1
    fi

    print_success "Prerequisites check passed"
}

get_latest_version() {
    git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"
}

suggest_version() {
    local current_version=$1
    if [ "$current_version" = "v0.0.0" ]; then
        echo "v1.0.0"
        return
    fi

    local commits_since
    commits_since=$(git log --oneline "${current_version}..HEAD")

    local version_number=${current_version#v}
    local major minor patch
    IFS='.' read -r major minor patch <<< "$version_number"

    if echo "$commits_since" | grep -q "BREAKING CHANGE\|feat!:"; then
        echo "v$((major + 1)).0.0"
    elif echo "$commits_since" | grep -q "feat:"; then
        echo "v${major}.$((minor + 1)).0"
    else
        echo "v${major}.${minor}.$((patch + 1))"
    fi
}

generate_changelog() {
    local since_tag=$1
    print_status "Generating changelog since $since_tag..."

    local commits
    if [ "$since_tag" = "v0.0.0" ]; then
        commits=$(git log --oneline --pretty=format:"- %s (%h)" HEAD)
    else
        commits=$(git log --oneline --pretty=format:"- %s (%h)" "${since_tag}..HEAD")
    fi

    echo "## 🚀 Changes in this release"
    echo ""
    echo "$commits"
}

create_release() {
    local version=$1
    local title=$2
    local changelog=$3

    print_status "Creating release $version..."

    # Create and push tag
    if ! git tag --list | grep -q "^${version}$"; then
        git tag "$version"
        git push origin "$version"
        print_success "Created and pushed tag $version"
    fi

    # Create GitHub release
    local temp_file
    temp_file=$(mktemp)
    echo -e "$changelog" > "$temp_file"

    if gh release create "$version" \
        --title "$title" \
        --notes-file "$temp_file" \
        --target "$DEFAULT_BRANCH"; then

        rm "$temp_file"
        print_success "Created GitHub release $version"
        print_status "View at: https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$version"
    else
        rm "$temp_file"
        print_error "Failed to create GitHub release"
        exit 1
    fi
}

quick_release() {
    echo "🚀 $PROJECT_NAME Quick Release"
    echo "=============================="

    check_prerequisites

    local current_version
    current_version=$(get_latest_version)
    local suggested_version
    suggested_version=$(suggest_version "$current_version")

    print_status "Current: $current_version → Suggested: $suggested_version"

    echo "Press Enter for $suggested_version, or type a different version:"
    read -r version_input
    local new_version=${version_input:-$suggested_version}

    if [[ ! $new_version == v* ]]; then
        new_version="v$new_version"
    fi

    local changelog
    changelog=$(generate_changelog "$current_version")

    print_warning "Creating release $new_version..."
    echo "Continue? (y/N)"
    read -r confirm

    if [[ $confirm =~ ^[Yy]$ ]]; then
        create_release "$new_version" "Release $new_version" "$changelog"
    else
        print_status "Release cancelled"
    fi
}

# Run quick release
quick_release "$@"

SCRIPT_END

# Replace placeholders with actual values
sed -i.bak "s/PROJECT_NAME_PLACEHOLDER/$project_name/g" release-manager.sh
sed -i.bak "s/REPO_OWNER_PLACEHOLDER/$github_username/g" release-manager.sh
sed -i.bak "s/REPO_NAME_PLACEHOLDER/$repo_name/g" release-manager.sh
sed -i.bak "s/DEFAULT_BRANCH_PLACEHOLDER/$default_branch/g" release-manager.sh

# Clean up backup file
rm release-manager.sh.bak

# Make executable
chmod +x release-manager.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "Created: release-manager.sh"
echo ""
echo "Usage:"
echo "  ./release-manager.sh          # Quick interactive release"
echo ""
echo "Next steps:"
echo "1. Test it: ./release-manager.sh"
echo "2. Make your first release!"