---
allowed-tools: Bash, Grep, Read, WebFetch, mcp__zen__analyze, mcp__zen__codereview
description: Pure analysis PR review for adoption decisions without code modification
---

# PR Review

Analyze pull requests for adoption decisions without code modification. Identify target PR from $ARGUMENTS (number/branch/current), gather PR metadata via gh commands, follow Comprehensive PR Review Template, and present comprehensive findings to console.

# Comprehensive PR Review Template

This is a comprehensive PR (Pull Request) review template with six distinct review tasks:

## 1. Product Manager Review
- Focuses on business value, user experience, and strategic alignment

## 2. Developer Review
- Evaluates code quality, performance, and adherence to best practices

## 3. Quality Engineer Review
- Checks test coverage, potential bugs, and regression risks

## 4. Security Engineer Review
- Assesses security vulnerabilities, data handling, and compliance

## 5. DevOps Review
- Validates CI/CD pipeline, infrastructure, and monitoring considerations

## 6. UI/UX Designer Review
- Ensures visual consistency, usability, and interaction flow

## Key Theme
The document emphasizes an urgent, immediate approach to improvements, with repeated emphasis that "future" recommendations should be addressed right now, not deferred.

Each section follows a similar structure:
- An objective
- Specific areas to review
- An action item requiring immediate implementation of any suggested improvements

The template is designed to provide a thorough, multi-perspective review of a software development pull request.