# Claude Code Hooks - Templates

> **Reusable templates for consistent project structure and development workflows**

This directory contains template files and configurations that can be used to initialize new projects or standardize existing ones with Claude Code Hooks integration.

## 📋 Available Templates

### Project Templates

- **Basic Project**: Standard project structure with hooks
- **NPX Package**: Template for creating NPX-distributed packages
- **Multi-Agent Project**: Complex project with parallel agent support
- **Linear Integration**: Project with Linear issue processing

### Configuration Templates

- **package.json**: NPX package configuration
- **claude-hooks.json**: Hooks configuration
- **agent-context.json**: Agent context structure
- **deployment-plan.json**: Parallel agent deployment plan

## 🚀 Using Templates

### Initialize New Project

```bash
# Create project with basic template
npx claude-code-hooks init --template=basic

# Create NPX package project
npx claude-code-hooks init --template=npx-package

# Create multi-agent project
npx claude-code-hooks init --template=multi-agent
```

### Apply Template to Existing Project

```bash
# Add hooks to existing project
npx claude-code-hooks apply-template hooks-only

# Add Linear integration
npx claude-code-hooks apply-template linear-integration

# Add parallel agent support
npx claude-code-hooks apply-template parallel-agents
```

## 📂 Template Structure

### Basic Project Template

```
project-name/
├── package.json              # NPX package configuration
├── claude-hooks.json         # Hooks configuration
├── .gitignore               # Git ignore patterns
├── README.md                # Project documentation
├── src/                     # Source code
│   ├── index.js            # Main entry point
│   └── config.js           # Configuration management
├── tests/                   # Test files
│   └── index.test.js       # Basic tests
└── docs/                    # Documentation
    └── README.md           # Documentation index
```

### NPX Package Template

```
package-name/
├── package.json              # NPX package configuration
├── bin/                     # CLI executables
│   └── cli.js              # Main CLI entry point
├── src/                     # Source code
│   ├── cli-parser.js       # Command line parsing
│   ├── installer.js        # Installation logic
│   └── validator.js        # Environment validation
├── templates/               # Template files
│   └── project-template/   # Project template
├── tests/                   # Test files
└── README.md               # Package documentation
```

### Multi-Agent Template

```
project-name/
├── package.json
├── claude-hooks.json
├── shared/                  # Shared resources
│   ├── deployment-plans/   # Agent deployment plans
│   └── coordination/       # Agent coordination
├── workspaces/             # Agent workspaces
│   ├── agent1/            # Individual agent context
│   └── agent2/
├── scripts/                # Automation scripts
│   ├── spawn-agents.sh    # Agent spawning
│   └── integrate-work.sh  # Work integration
└── README.md
```

## 🎯 Template Customization

### Custom Variables

Templates support variable substitution:

```json
{
  "projectName": "{{PROJECT_NAME}}",
  "packageName": "{{PACKAGE_NAME}}",
  "description": "{{DESCRIPTION}}",
  "author": "{{AUTHOR}}",
  "version": "{{VERSION}}"
}
```

### Environment-Specific Templates

```bash
# Development environment
npx claude-code-hooks init --template=basic --env=development

# Production environment
npx claude-code-hooks init --template=basic --env=production

# Testing environment
npx claude-code-hooks init --template=basic --env=testing
```

## 🔧 Template Configuration

### claude-hooks.json Template

```json
{
  "version": "1.0.0",
  "hooks": {
    "pre-commit": "{{PRE_COMMIT_COMMAND}}",
    "post-commit": "{{POST_COMMIT_COMMAND}}",
    "pre-push": "{{PRE_PUSH_COMMAND}}"
  },
  "agents": {
    "maxParallel": 4,
    "autoSpawn": true,
    "defaultEditor": "cursor"
  },
  "linear": {
    "enabled": true,
    "apiKey": "{{LINEAR_API_KEY}}",
    "teamId": "{{LINEAR_TEAM_ID}}"
  },
  "validation": {
    "required": ["git", "node", "claude"],
    "recommended": ["cursor", "linear"]
  }
}
```

### Agent Context Template

```json
{
  "agentId": "{{AGENT_ID}}",
  "taskId": "{{TASK_ID}}",
  "taskTitle": "{{TASK_TITLE}}",
  "agentRole": "{{AGENT_ROLE}}",
  "focusArea": "{{FOCUS_AREA}}",
  "dependencies": [],
  "filesToCreate": [],
  "filesToModify": [],
  "validationCriteria": [],
  "estimatedTime": "{{ESTIMATED_TIME}}",
  "canStartImmediately": true
}
```

## 📊 Template Management

### Creating Custom Templates

```bash
# Create template from existing project
npx claude-code-hooks create-template --from=./my-project --name=my-custom-template

# Save template to registry
npx claude-code-hooks save-template my-custom-template --registry=local

# Share template publicly
npx claude-code-hooks publish-template my-custom-template
```

### Template Validation

```bash
# Validate template structure
npx claude-code-hooks validate-template my-template

# Test template generation
npx claude-code-hooks test-template my-template --dry-run

# Verify template completeness
npx claude-code-hooks check-template my-template
```

## 🎨 Template Best Practices

### Structure Guidelines

1. **Consistent Naming**: Use kebab-case for files and directories
2. **Clear Documentation**: Include README.md in all templates
3. **Flexible Configuration**: Support environment variables
4. **Validation**: Include validation scripts and checks
5. **Testing**: Provide test templates and examples

### Variable Conventions

- Use `{{UPPER_SNAKE_CASE}}` for template variables
- Provide default values where appropriate
- Document all available variables
- Use semantic variable names

### File Organization

- Group related files in subdirectories
- Use consistent file naming patterns
- Include hidden files (like .gitignore)
- Provide example configurations

## 🔍 Template Examples

### Basic CLI Tool

```javascript
// bin/cli.js template
#!/usr/bin/env node

const { program } = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description('{{DESCRIPTION}}')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-c, --config <path>', 'Configuration file path');

program
  .command('install')
  .description('Install {{PACKAGE_NAME}} hooks')
  .action(require('../src/installer'));

program
  .command('init')
  .description('Initialize project with {{PACKAGE_NAME}}')
  .action(require('../src/init'));

program.parse(process.argv);
```

### Agent Deployment Plan

```json
{
  "taskId": "{{TASK_ID}}",
  "taskTitle": "{{TASK_TITLE}}",
  "parallelAgents": [
    {
      "agentId": "{{AGENT_1_ID}}",
      "agentRole": "{{AGENT_1_ROLE}}",
      "focusArea": "{{AGENT_1_FOCUS}}",
      "dependencies": [],
      "filesToCreate": [],
      "estimatedTime": "{{AGENT_1_TIME}}"
    }
  ],
  "integrationPlan": {
    "mergeOrder": [],
    "validationSteps": [],
    "estimatedIntegrationTime": "{{INTEGRATION_TIME}}"
  }
}
```

## 🤝 Contributing Templates

### Adding New Templates

1. Create template directory structure
2. Add template files with variable placeholders
3. Create template.json configuration
4. Add documentation and examples
5. Test template generation

### Template Testing

```bash
# Test template generation
npm run test-template -- --template=my-new-template

# Validate template structure
npm run validate-template -- --template=my-new-template

# Integration testing
npm run test-integration -- --template=my-new-template
```

## 📞 Support

For template-related questions:

- Check existing templates for patterns
- Review template documentation
- Test templates before use
- Report issues with specific template details

---

_Templates are maintained by the docs_agent as part of the Claude Code Hooks project. For the latest templates and updates, refer to the main project repository._
