# @aojdevstudio/cdev - Usage Guide

## Installation

```bash
# Global installation
npm install -g @aojdevstudio/cdev

# Or use with npx (recommended)
npx @aojdevstudio/cdev
```

## Quick Start

```bash
# Cache a Linear issue
npx @aojdevstudio/cdev cache-linear-issue PROJ-123

# Decompose into parallel agents
npx @aojdevstudio/cdev decompose-parallel PROJ-123

# Spawn all agents
npx @aojdevstudio/cdev spawn-agents shared/deployment-plans/proj-123-deployment-plan.json
```

## Commands

### cache-linear-issue
Downloads and caches a Linear issue for offline work.

### decompose-parallel
Analyzes the cached issue and breaks it into parallel workstreams.

### spawn-agents
Creates isolated Git worktrees for each agent to work independently.

## Version Information

- Package: @aojdevstudio/cdev
- Version: 0.0.2
- Published: 2025-07-15T13:37:30.598078

## Global NPX Distribution

This package is designed to be used globally via NPX, providing:
- ✅ Offline workflow capabilities
- ✅ Parallel agent development
- ✅ Git worktree isolation
- ✅ Intelligent task decomposition

For more information, see the [README](./README.md).
