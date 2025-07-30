# Enhanced /agent-start Command Documentation

## Overview

The enhanced `/agent-start` command now supports intelligent transformation of various task formats into concurrent sub-agents that execute within a single Claude instance. This powerful feature allows you to work with markdown checklists, text lists, JSON files, Linear issues, or even direct text input - all automatically parsed and decomposed into efficient concurrent sub-agents.

## Key Features

### 1. Universal Format Support

- **Markdown Checklists**: Parse `- [ ]` format from .md files
- **Numbered Lists**: Handle `1.` or `1)` formats
- **Plain Text**: Simple line-by-line task lists
- **JSON Arrays**: Structured task data
- **Linear Issues**: Direct integration with Linear tickets
- **Direct Text**: Quick tasks from command line

### 2. Intelligent Task Decomposition

- Uses LLM to group related tasks
- Creates concurrent sub-agents for parallel execution
- Identifies dependencies automatically
- Optimizes for single-worktree execution

### 3. Concurrent Orchestration

- Spawns sub-agents using Claude's Task tool
- Manages concurrent execution phases
- Tracks progress across all sub-agents
- Aggregates results automatically

## Usage Examples

### Basic Usage

```bash
# Auto-detect agent_context.json in current directory
/agent-start

# Parse a markdown checklist
/agent-start PUBLISHING-PLAN.md

# Convert a text file to sub-agents
/agent-start tasks.txt

# Direct text input
/agent-start "Fix linting, add tests, update docs"

# Linear issue decomposition
/agent-start LINEAR-123

# Preview mode without execution
/agent-start checklist.json --dry-run
```

### Real-World Example: Publishing Plan

When you run:

```bash
/agent-start PUBLISHING-PLAN.md
```

The command will:

1. **Parse the markdown file** and extract all tasks
2. **Group tasks intelligently** using LLM or rule-based analysis
3. **Create concurrent sub-agents** like:
   - `validation_subagent`: All linting, testing, security checks
   - `documentation_subagent`: README, CHANGELOG updates
   - `configuration_subagent`: package.json, version updates
   - `publishing_subagent`: npm publish, git tags (waits for others)
4. **Execute phases concurrently**:
   - Phase 1: Run validation, docs, and config in parallel
   - Phase 2: Run publishing after prerequisites complete

## How It Works

### 1. Task Parsing

The `TaskParser` class automatically detects and parses various formats:

```javascript
const parser = new TaskParser();
const parsed = await parser.parse(input);
// Returns: { format, tasks, metadata }
```

### 2. Sub-agent Decomposition

The `SubagentDecomposer` uses LLM to create optimal groupings:

```javascript
const decomposer = new SubagentDecomposer();
const decomposition = await decomposer.decomposeForSubagents(tasks);
// Returns: { subagents, orchestrationPlan }
```

### 3. Concurrent Execution

Sub-agents are launched via the Task tool and run concurrently:

```javascript
// Phase 1: Launch concurrent sub-agents
const results = await Promise.all(phase.concurrent.map((agentId) => launchSubagent(context)));
```

## Configuration

### Environment Variables

```bash
# LLM Provider (optional - falls back to rule-based)
LLM_PROVIDER=openai  # or anthropic, openrouter, ollama
LLM_MODEL=gpt-4

# API Keys (if using LLM)
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
OPENROUTER_API_KEY=your-key
```

### Supported File Locations

- Current directory: `./agent_context.json`
- Relative paths: `../tasks/checklist.md`
- Absolute paths: `/home/user/projects/tasks.txt`

## Advanced Features

### Dry Run Mode

Preview the decomposition without executing:

```bash
/agent-start PUBLISHING-PLAN.md --dry-run
```

Output shows:

- Proposed sub-agents
- Task assignments
- Execution phases
- Dependencies

### Progress Tracking

Real-time progress updates during execution:

```
📊 Overall progress: 67%
✅ validation_subagent: Complete
🔄 documentation_subagent: 80%
🔄 configuration_subagent: 45%
```

### Error Recovery

- Automatic retry for failed sub-agents
- Saves partial results
- Detailed error reporting

## Task Format Examples

### Markdown Checklist

```markdown
## Code Quality

- [ ] Run all tests
- [ ] Check linting
- [ ] Format code

## Documentation

- [ ] Update README
- [ ] Write changelog
```

### JSON Array

```json
{
  "tasks": [
    { "text": "Run tests", "priority": "high" },
    { "text": "Update docs", "priority": "medium" }
  ]
}
```

### Plain Text

```
Run all unit tests
Fix linting errors
Update documentation
Deploy to staging
```

## Best Practices

1. **Group Related Tasks**: Keep similar tasks in the same section for better sub-agent grouping
2. **Clear Task Descriptions**: Use descriptive task names for better LLM understanding
3. **Mark Dependencies**: Note tasks that must complete before others
4. **Use Sections**: Organize tasks with headers for logical grouping

## Troubleshooting

### No LLM API Key

If you see: `⚠️ No API key found, using rule-based analysis only`

- The tool will still work using pattern-based grouping
- For best results, configure an LLM provider

### Task Parsing Issues

- Ensure proper markdown formatting for checklists
- Use consistent formatting within a file
- Check file encoding (UTF-8 recommended)

### Sub-agent Failures

- Check individual sub-agent logs in `/shared/coordination/`
- Review error files: `error-<agentId>.json`
- Retry with `--dry-run` to validate plan

## Integration with Existing Workflows

The enhanced `/agent-start` complements existing parallel development workflows:

1. **For Quick Tasks**: Use direct text input
2. **For Planned Work**: Create a markdown checklist
3. **For Linear Integration**: Use Linear issue IDs directly
4. **For Complex Projects**: Combine with existing agent_context.json

## Performance Tips

1. **Concurrent Execution**: Tasks run in parallel when possible
2. **Smart Grouping**: LLM groups related tasks to minimize context switching
3. **Single Instance**: No git worktree overhead
4. **Cached Results**: LLM results are cached for repeated runs

## Future Enhancements

- Visual progress dashboard
- Custom sub-agent templates
- Integration with more task management tools
- Real-time collaboration features
