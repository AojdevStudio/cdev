---
allowed-tools: Read, Grep, Task
description: Fast pattern search across logs and files for quick results
---

# Quick Search

This command performs fast pattern-based searches across project files and logs for rapid results.

**variables:**
Query: $ARGUMENTS

**Usage Examples:**
- `/search-logs "failed.*authentication"` - Find authentication failures
- `/search-logs "memory.*leak|out.*of.*memory" 10` - Search memory issues with 10 lines context
- `/search-logs "POST.*api/users.*500" access.log` - Find specific API errors
- `/search-logs "hook.*blocked|prevented" pre_tool_use.json` - Search hook interventions

## Instructions
- Parse $ARGUMENTS to extract: search_pattern, context_lines (default 3), specific_log_file, time_filters
- If no specific log file: scan logs/ directory for all .json and .log files
- Use intelligent search strategy based on pattern complexity:
  - Simple terms: use Grep with case-insensitive search
  - Complex patterns: use regex with appropriate flags
  - Multiple terms: combine with OR/AND logic as needed
- Apply time filters if provided (--after, --before, --date)
- Extract relevant context around matches:
  - For JSON logs: include complete JSON objects/events
  - For text logs: include surrounding lines based on context_lines
- Present results in structured format with:
  - File location and line numbers
  - Timestamp of log entry (if available)
  - Matched content with highlighting
  - Relevant context for understanding
- Provide summary of findings and suggest refined searches if too many/few results

## Context
- Log directory: !`ls -la logs/ 2>/dev/null | grep -E '\.(json|log)$' | awk '{print $9}' | head -10`
- Log file sizes: !`du -h logs/*.json logs/*.log 2>/dev/null | sort -hr | head -5`
- Common log files: logs/chat.json (conversation history), logs/pre_tool_use.json (hook logs)
- JSON structure: Each entry typically has timestamp, type, message, uuid fields
- Search optimization: For large files (>10MB), use progressive refinement
- Pattern examples: "model.*test" (regex), "error|warning|fail" (alternatives), "timestamp.*2025-07" (date matching)
- Context extraction: JSON logs need complete object boundaries, text logs need semantic line groups