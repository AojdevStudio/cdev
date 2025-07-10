---
allowed-tools: Read, Write, Bash, Glob, Grep, Eza, Git
description: Generate comprehensive README using structured template with project analysis
---

# Generate README

This command analyzes your project structure and generates a comprehensive README file following the established template pattern with proper variable substitution and contextual content.

**variables:**
OutputPath: $ARGUMENTS

**Usage Examples:**
- `/generate-readme` - Generate README for current project using template (@ai-docs/readme-template.md)
- `/generate-readme --output docs/README.md` - Generate to specific location

## Instructions

**Apply the Feynman Technique throughout README generation:**
- Explain complex concepts in simple, clear language that anyone can understand
- Use analogies and real-world examples to illustrate technical concepts
- Break down complicated processes into basic, logical steps
- Assume the reader is intelligent but unfamiliar with the specific domain
- Test understanding by explaining "why" not just "what" and "how"

### Technical Analysis
- Analyze current or specified project structure for file system exploration
- Use EZA CLI to explore project structure with common patterns:
  ```bash
  # Basic file listing
  eza
  
  # Detailed listing with metadata
  eza -l
  
  # Tree view of project structure
  eza -T
  
  # Show Git status in listing
  eza --git
  
  # List all files including hidden
  eza -a
  
  # List only directories
  eza -D
  
  # List only files
  eza -f
  
  # Recursive listing limited to 2 levels
  eza -R --level=2
  
  # Show icons for file types
  eza --icons
  ```

### Content Generation with Feynman Technique
- Extract project metadata from package.json, setup.py, or similar configuration files
- Identify key features, installation methods, and usage patterns from codebase
- **Explain each feature's purpose in simple terms**: What problem does it solve? Why would someone need this?
- **Use analogies**: Compare technical concepts to familiar, everyday experiences
- **Break down complex workflows**: Transform multi-step technical processes into logical, sequential explanations
- **Avoid jargon**: When technical terms are necessary, immediately explain them in plain language
- Load the README template and systematically replace all {{VARIABLE}} placeholders with actual project data
- Generate contextual content based on actual project analysis (not generic placeholders)
- Use git analysis understand the commits and changes in the git repository
- Review changelog to understand the changes and updates to the project

### Feynman-Style Writing Guidelines
- **Start with the "why"**: Begin each section by explaining the problem or need
- **Use concrete examples**: Instead of "supports multiple frameworks," say "works with React, Vue, and Angular projects"
- **Simplify installation**: Explain each setup step and why it's necessary
- **Make benefits clear**: Don't just list features—explain the real-world impact
- **Use progressive disclosure**: Start simple, then provide deeper details for those who need them
- **Test comprehension**: Each explanation should be understandable to someone new to the field

### Final Assembly
- Create navigation links that correspond to actual README sections
- Include proper setup instructions based on detected package manager and dependencies (if applicable)
- Add relevant badges, license information, and community links if available
- Write the completed README to the project root or specified output location
- Provide summary of generated sections and suggest manual review areas for final adjustments

## Context
- README template: @ai-docs/readme-template.md
- Project root: !`pwd`
- Package configuration: !`ls package.json setup.py Cargo.toml composer.json 2>/dev/null || echo "none"`
- Project structure: !`find . -maxdepth 2 -type f -name "*.md" -o -name "*.json" -o -name "*.py" -o -name "*.js" -o -name "*.ts" | grep -v node_modules | head -20`
- Git info: !`git remote get-url origin 2>/dev/null || echo "no-remote"`
- Git Org: !`git config user.name`
- Git Email: !`git config user.email`
- License: !`ls LICENSE* 2>/dev/null || echo "none"`
- Documentation: !`ls docs/ README* CONTRIBUTING* 2>/dev/null || echo "none"`
- Template variables: PROJECT_NAME, TAGLINE_OR_SHORT_DESCRIPTION, VERSION, LICENSE_TYPE, REQUIREMENTS, PRIMARY_PURPOSE, DISTINGUISHING_FEATURE_OR_METHOD, TARGET_AUDIENCE_OR_DOMAIN, INSTALL_COMMAND_PRIMARY, REPOSITORY_PATH
- Common sections: Setup & Updates, Key Highlights, Quick Navigation, Modular Features, Documentation & Resources, Support & Community, Contributing, License
- Output location: README.md (default), or use --output argument for custom path