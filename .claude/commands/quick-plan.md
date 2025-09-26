---
description: Creates a concise engineering implementation plan based on user requirements and saves it to specs directory
argument-hint: [user prompt]
allowed-tools: Read, Write, Edit, Grep, Glob, MultiEdit
model: claude-opus-4-1-20250805
---

# Quick Plan

Create a detailed implementation plan based on the user's requirements provided thought the `USER_PROMPT` variable. Analyze the request, think through the implementation approach, and save a comprehensive specification document to the `PLAN_OUTPUT_DIRECTORY/<name-of-plan>.md` that can be used as a blueprint for actual development work.

## Variables

USER_PROMPT: $ARGUMENTS
PLAN_OUTPUT_DIRECTORY: `specs/`

## Instructions

- Carefully analyze the user's requirements provided in the `USER_PROMPT` variable.
- Think deeply about the best approach to implement the requested functionality or solve the problem.
- Create a concise implementation plan that includes:
  - Clear problem statement and objectives
  - Technical approach and architecture decisions
  - Step-by-step implementation guide
  - Potential challenges and solutions
  - Testing strategy
  - Success criteria
- Generate a descriptive, kebab-case filename based on the main topic of the plan
- Save the complete implementation plan to the `PLAN_OUTPUT_DIRECTORY/<descriptive-name.md>` directory
- Ensure the plan is detailed enough that another developer could follow it to implement the solution
- Include code examples or pseudo-code where appropriate to clarify complex concepts
- Consider edge cases, error handling, and scalability concerns to the tune of 10-20 users
- Structure the document with clear sections and proper markdown formatting

## Workflow

1. Analyze Requirements - THINK HARD and parse the `USER_PROMPT` to understand the core problem and desired outcome
2. Design solution - Develop technical approach including architecture decisions and implementation strategy
3. Document Plan - Structure a comprehensive markdown document with problem statement, implementation steps, and testing approach
4. Generate Filename - Create a descriptive, kebab-case filename based on the plan's main topic
5. Save & Report - Write the plan to the `PLAN_OUTPUT_DIRECTORY/<filename.md>` and provide a summary of key components

## Report

After creating and saving the implemetaion plan, provide a concise report with the following format:

```
Implementation Plan Created

File: PLAN_OUTPUT_DIRECTORY/<filename.md>
Topic: <brief description of the what the plan covers>
Key Components:
- <main component 1>
- <main component 2>
- <main component 3>
```
