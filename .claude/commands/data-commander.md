---
allowed-tools: Bash, Read, Write, WebFetch, Grep, Glob
description: Analyze GitHub issues and generate technical specifications for implementation
argument-hint: [issue_url_or_number] [repository_name] [output_format]
model: claude-3-5-sonnet-20241022
---

# Data Commander

Analyze GitHub {issue_reference} in {repository_context} and generate {specification_format} technical specification that provides implementation-ready requirements and codebase integration guidance.

## Variables:
[IssueReference]: $ARGUMENTS (GitHub issue URL, issue number, or search criteria)
[RepositoryContext]: $ARGUMENTS (GitHub repository name or URL for context)
[SpecificationFormat]: $ARGUMENTS (technical specification output format: detailed, summary, or implementation-focused)
[OutputLocation]: $ARGUMENTS (file path for generated specification)

## Instructions:

- Use GitHub CLI to fetch {IssueReference} details from {RepositoryContext}
- Analyze issue description, comments, and related pull requests
- Examine codebase structure to understand implementation context
- Generate {SpecificationFormat} technical specification with clear requirements
- Include implementation guidance based on existing codebase patterns
- Validate specification completeness against issue requirements

## Workflow:

1. Authenticate GitHub CLI access and verify repository permissions
2. Fetch issue details using `gh issue view {IssueReference} --repo {RepositoryContext} --json title,body,comments,assignees,labels,milestone`
3. Extract core requirements, acceptance criteria, and technical constraints from issue content
4. Analyze codebase structure using `find` and `grep` commands to identify relevant modules and patterns
5. Review existing implementation patterns in related files and directories
6. Cross-reference issue labels and milestone to understand project context and priority
7. Generate technical specification document with sections: Overview, Requirements, Implementation Plan, Dependencies, Testing Strategy
8. Include specific file paths, function signatures, and integration points based on codebase analysis
9. Validate specification against issue acceptance criteria and technical feasibility
10. Save specification to {OutputLocation} with structured format for development team review

## Report:

Technical Specification Generated

File: {OutputLocation}
Source Issue: {IssueReference} from {RepositoryContext}
Specification Type: {SpecificationFormat}
Key Components:
- Requirements analysis with acceptance criteria mapping
- Implementation plan with specific code integration points
- Dependencies and technical constraints identification
- Testing strategy aligned with existing codebase patterns
- Development timeline estimation based on complexity analysis

## Relevant Files:

- [GitHub issue and related discussions]
- [Existing codebase files and modules identified during analysis]
- [Project documentation and README files]