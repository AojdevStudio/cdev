---
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(find:*), Bash(grep:*), Bash(wc:*), Bash(ls:*), Write, Read, MultiEdit,
description: Analyze GitHub issue and generate technical specification
---

# GitHub Issue Analysis and Technical Specification Generator

This template/script generates a technical specification for a GitHub issue with the following components:

## Key Components
1. A bash script to fetch GitHub issue details
2. A structured technical specification template with sections:
   - Issue Summary
   - Problem Statement
   - Technical Approach
   - Implementation Plan
   - Test Plan
   - Files to Modify/Create
   - Success Criteria
   - Out of Scope

## Principles
- Test-Driven Development (TDD)
- KISS (Keep It Simple, Stupid) approach
- 300-line file size limit

The template is designed to provide a comprehensive, structured approach to analyzing and documenting technical issues from GitHub.