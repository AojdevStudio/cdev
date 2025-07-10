---
allowed-tools: Read, Grep, Task, Bash
description: Deep analysis of logs with context preservation and smart filtering
---

# Deep Search

This command performs comprehensive searches through structured logs with advanced filtering, context preservation, and intelligent result grouping.

**variables:**
Query: $ARGUMENTS

**Usage Examples:**
- `/log-search "npm.*EACCES|permission.*denied"` - Find npm permission errors
- `/log-search "git.*conflict" --type tool --last 50` - Recent git conflicts in tool calls
- `/log-search "database.*connection.*failed" --context 20` - Database errors with context
- `/log-search "webhook.*payload" notification.json --json-path data.url` - Search webhook URLs
- `/log-search "timestamp:2025-07.*WARNING|ERROR" --type system` - System warnings by date

## Instructions
- Parse $ARGUMENTS to extract search parameters:
  - Primary search pattern (required)
  - --context N: lines of context (default 5)
  - --type: filter by message type (user/assistant/tool/system)
  - --last N: search only last N entries
  - --json-path: specific JSON path to search within
  - --file: specific log file (default: all in logs/)
  - timestamp: prefix for time-based searches
- Determine search strategy based on file type and size:
  - JSON files <50MB: Load and parse for structured search
  - JSON files >50MB: Use streaming JSON parser or grep with JSON boundaries
  - Text logs: Use grep with appropriate context flags
- For JSON logs (especially chat.json):
  - Parse JSON structure to maintain entry boundaries
  - Extract complete message objects, not partial content
  - Include relevant metadata (timestamp, uuid, type)
- Apply filters progressively:
  - First: pattern match
  - Second: type/time filters
  - Third: context extraction
- Format results for clarity:
  - Group by file if searching multiple logs
  - Show entry number/position in large logs
  - Highlight matched patterns
  - Include actionable context (timestamps, message types, tool results)
- Provide search statistics and refinement suggestions

## Context
- Available logs: !`find logs -name "*.json" -o -name "*.log" 2>/dev/null | sort`
- Log structure: !`head -1 logs/chat.json 2>/dev/null | jq -r 'keys[]' 2>/dev/null | head -5 || echo "No JSON logs found"`
- Large log handling: chat.json can be >300KB, use progressive search
- JSON entry structure: {timestamp, type, message:{role, content}, uuid, toolUse, toolUseResult}
- Message types: user (questions), assistant (responses), tool (function calls), system (reminders)
- Search patterns: Simple text, regex (.*), OR (|), timestamp prefix (timestamp:), JSON path notation
- Performance tips: Start broad then refine, use --last for recent entries, specify --type to reduce scope
- Context boundaries: For JSON preserve complete objects, for text preserve semantic paragraphs