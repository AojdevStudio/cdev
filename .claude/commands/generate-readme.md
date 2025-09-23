---
allowed-tools: Task
description: Use doc-curator agent to generate README following template standards
argument-hint: [target-file] [template-mode]
---

# Generate README

Use the doc-curator sub-agent to generate comprehensive `README.md` following `TEMPLATE_MODE` standards from `TARGET_FILE` template, ensuring no business-specific references or credentials are included.

## Variables

TARGET_FILE: $1 (default: README.md)
TEMPLATE_MODE: $2 (default: ai-docs/readme-template.yaml)
OUTPUT_DIRECTORY: current project root
TEMPLATE_NAME: structured YAML template format

## Workflow

1. Use the doc-curator sub-agent to analyze current project structure
2. Load template from `@ai-docs/readme-template.yaml`
3. Extract metadata from configuration files (package.json, setup.py)
4. Apply security filtering to remove business references and credentials
5. Substitute template variables with sanitized project-specific content
6. Generate navigation structure and setup instructions
7. Write final README.md with comprehensive documentation

## Report

README Generation Complete

File: `TARGET_FILE`
Template: `TEMPLATE_MODE` format applied
Key Components:
- Project metadata and description
- Installation and setup instructions
- Navigation structure
- Security-sanitized content (no credentials/business refs)

## Relevant Files

- @ai-docs/readme-template.yaml
- @package.json
- @CLAUDE.md
