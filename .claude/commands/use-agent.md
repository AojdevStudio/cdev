---
allowed-tools: Task, Read, Glob, Bash
description: Intelligently select and use appropriate sub-agent based on task requirements
---

# Use Agent

Intelligently analyze $ARGUMENTS to determine the most appropriate sub-agent from the .claude/agents directory and delegate the task for optimal execution. This command serves as the central orchestration point for CDEV's parallel development workflows.

$ARGUMENTS: [task description, agent:task format, Linear ticket ID (LIN-####), or YouTube URL]

## Instructions - IMPORTANT: YOU MUST FOLLOW THESE INSTRUCTIONS EXACTLY IN THIS ORDER

1. **Parse Input Format**: Analyze $ARGUMENTS to identify:
   - Direct agent specification ("agent:task")
   - YouTube URLs (any youtube.com or youtu.be link)
   - Linear ticket IDs (LIN-#### format)
   - Complex multi-component tasks
   - Authentication/authorization requirements
   - Testing requirements
   - General development tasks

2. **Agent Selection Logic**:
   - If format is "agent:task" → Use specified agent directly
   - If YouTube URL detected → **MANDATORY**: Use youtube-transcript-analyzer
   - If Linear ticket ID (LIN-####) → **MANDATORY**: Use task-orchestrator
   - If complex/multi-component task → **MANDATORY**: Use task-orchestrator
   - If auth/authentication keywords → Use auth-systems-expert
   - If test/testing keywords → Use test-automator
   - If agent creation/modification → Use meta-agent
   - Otherwise → Select best-fit specialist agent

3. **Task Delegation**: Use the Task tool to spawn the selected sub-agent with:
   - Complete context and requirements
   - Clear success criteria
   - Relevant file paths and documentation references
   - Integration requirements with other agents

## Available Sub-Agents

### 🟡 **task-orchestrator** (Opus Model)
**Use PROACTIVELY for**: Breaking down complex tasks into parallel workflows
**MUST BE USED for**: 
- Multi-component features requiring parallel development
- System-wide changes affecting multiple modules
- Linear tickets (LIN-#### format)
- Markdown task lists requiring decomposition
- Any development work benefiting from parallelization

**Capabilities**:
- ✅ **Linear Integration**: Fetches ticket details, comments, and updates status
- ✅ **Intelligent Decomposition**: Breaks complex tasks into 30-90 minute chunks
- ✅ **Parallel Optimization**: Identifies opportunities for concurrent execution
- ✅ **Dependency Mapping**: Creates clear dependency graphs and execution phases
- ✅ **Agent Coordination**: Provides structured handoff protocols
- ✅ **Extended Thinking**: Uses deep analysis for complex architectural decisions

**Example Usage**:
```
# Complex feature development
@use-agent "Implement user authentication system with social logins and MFA"

# Linear ticket processing
@use-agent "LIN-1234"

# Multi-component refactoring
@use-agent "Migrate from REST to GraphQL across frontend and backend"
```

### 🟣 **meta-agent** (Opus Model)
**Use PROACTIVELY for**: Sub-agent creation, modification, and architecture optimization
**MUST BE USED for**:
- Creating new specialized agents
- Modifying existing agent configurations
- Optimizing agent architectures and workflows
- Reviewing sub-agent performance and capabilities

**Capabilities**:
- ✅ **Agent Architecture**: Expert knowledge of sub-agent design patterns
- ✅ **Documentation Scraping**: Fetches latest Claude Code sub-agent documentation
- ✅ **Configuration Generation**: Creates complete agent definition files
- ✅ **Tool Selection**: Intelligently selects optimal tools for agent purposes
- ✅ **Extended Thinking Integration**: Incorporates advanced thinking capabilities
- ✅ **Best Practices**: Applies Claude 4 optimization techniques

**Example Usage**:
```
# Create specialized agent
@use-agent meta-agent:"Create a database migration agent for handling schema changes"

# Optimize existing agent
@use-agent meta-agent:"Review and improve the test-automator agent configuration"
```

### 🔵 **test-automator** (Sonnet Model)
**Use PROACTIVELY for**: Comprehensive test coverage and automation
**MUST BE USED when**:
- Implementing new features requiring test coverage
- Fixing bugs and preventing regressions
- Setting up CI/CD pipelines
- Improving existing test suites

**Capabilities**:
- ✅ **Test Pyramid Implementation**: Unit, integration, and E2E test strategies
- ✅ **Framework Agnostic**: Supports multiple testing frameworks and languages
- ✅ **CI/CD Integration**: Configures automated test execution and reporting
- ✅ **Coverage Analysis**: Identifies gaps and optimizes test coverage
- ✅ **TDD Support**: Implements Test-Driven Development workflows
- ✅ **Performance Testing**: Includes load and performance test strategies

**Example Usage**:
```
# Feature test coverage
@use-agent test-automator:"Create comprehensive tests for the new payment processing module"

# CI/CD setup
@use-agent test-automator:"Set up automated testing pipeline with coverage reporting"
```

### 🟡 **auth-systems-expert** (Sonnet Model)
**Use when**: Authentication and authorization systems are involved
**MUST BE USED for**:
- OAuth implementations and troubleshooting
- JWT handling and session management
- SSO setup and configuration
- Auth framework integration (Supabase, NextAuth, Auth0, BetterAuth)

**Capabilities**:
- ✅ **Framework Mastery**: Expert knowledge of modern auth solutions
- ✅ **Protocol Expertise**: OAuth 2.0, OIDC, SAML, JWT specifications
- ✅ **Security Best Practices**: Secure auth flows and vulnerability prevention
- ✅ **Integration Patterns**: Proven strategies for various tech stacks
- ✅ **Documentation Access**: Uses context7 MCP for latest framework docs
- ✅ **Migration Support**: Smooth transitions between auth systems

**Example Usage**:
```
# New auth implementation
@use-agent auth-systems-expert:"Implement Supabase Auth with social logins in Next.js"

# Troubleshooting
@use-agent auth-systems-expert:"Fix OAuth redirect_uri mismatch errors"

# Migration
@use-agent auth-systems-expert:"Migrate from Firebase Auth to Auth0"
```

### 🔵 **youtube-transcript-analyzer** (Sonnet Model)
**Use PROACTIVELY when**: YouTube URLs are detected in conversation
**MUST BE USED for**:
- Any YouTube video analysis or transcript extraction
- Educational content summarization
- Creating structured knowledge from video content

**Capabilities**:
- ✅ **Advanced Transcript Extraction**: Uses yt-dlp with comprehensive options
- ✅ **Structured Analysis**: Creates detailed summaries with timestamps
- ✅ **Quality Assessment**: Evaluates transcript accuracy and completeness
- ✅ **Knowledge Synthesis**: Extracts actionable insights and key concepts
- ✅ **Automated Cleanup**: Manages temporary files and research organization
- ✅ **Sequential Thinking**: Uses advanced reasoning for complex content

**Example Usage**:
```
# Automatic detection
@use-agent "Check out this video: https://youtube.com/watch?v=xyz123"

# Explicit delegation
@use-agent youtube-transcript-analyzer:"https://youtu.be/abc456"
```

## Agent Selection Guidelines

### **Automatic Triggers (MANDATORY)**
- **YouTube URL detected** → youtube-transcript-analyzer
- **Linear ticket ID (LIN-####)** → task-orchestrator
- **Complex multi-step tasks** → task-orchestrator
- **Authentication keywords** → auth-systems-expert
- **Agent creation/modification** → meta-agent

### **Keyword Mapping**
- **Parallel, complex, multi-component, feature, system-wide** → task-orchestrator
- **Test, testing, TDD, CI/CD, coverage** → test-automator
- **Auth, authentication, OAuth, JWT, login, SSO** → auth-systems-expert
- **Agent, sub-agent, create agent, modify agent** → meta-agent
- **YouTube, video, transcript, summary** → youtube-transcript-analyzer

### **Integration Patterns**

**Sequential Agent Chains**:
1. task-orchestrator → Breaks down complex tasks
2. Specialist agents → Execute parallel components
3. test-automator → Validates implementations
4. meta-agent → Optimizes workflows

**Collaborative Workflows**:
- **Feature Development**: task-orchestrator + auth-systems-expert + test-automator
- **System Architecture**: meta-agent + task-orchestrator
- **Knowledge Extraction**: youtube-transcript-analyzer + task-orchestrator (for implementation)

## Output Format

Provide structured response:

```markdown
## Agent Selection
**Selected Agent**: [agent-name]
**Rationale**: [Why this agent is optimal for the task]
**Task Type**: [Classification of the request]

## Task Delegation
[Results from the selected sub-agent's processing]

## Integration Opportunities
[Recommendations for follow-up agents or parallel work]

## Next Steps
[Clear actions for continued development]
```
