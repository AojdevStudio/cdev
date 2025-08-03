---
allowed-tools: Read, Write
description: Helps Claude read a planning document and explore related files to get familiar with a topic. Asking Claude to prepare to discuss seems to work better than asking it to prepare to do specific work. This is followed by Plan, then Execute
---
# Explore

Conduct a thorough review of the codebase related to $ARGUMENTS.

## Context

- Read $ARGUMENTS.
- Read through related code.
- Do not write any code right now. 
- Conduct review, read relevant files and tests for the project and prepare to discuss this part of the codebase.