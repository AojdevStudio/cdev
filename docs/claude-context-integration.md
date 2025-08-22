# Claude Context Integration with Deep Search Agent

## Overview

The deep-searcher agent now uses **Claude Context** for semantic code search, providing incremental indexing with hybrid search capabilities (BM25 + dense vectors) through cloud-powered infrastructure.

## Key Advantages

### Incremental Indexing

- **Only re-indexes changed files** using Merkle trees
- **No waiting** for full codebase reindexing
- **Instant updates** when files change

### Superior Search

- **Hybrid search**: Combines BM25 + dense vectors for best results
- **AST-based understanding**: Analyzes code structure, not just text
- **Cloud-powered**: Offloads heavy computation to Zilliz Cloud

## Prerequisites

### 1. Configure Claude Context MCP

Claude Context MCP server must be configured with:

- **Zilliz Cloud API Key**: Sign up at [Zilliz Cloud](https://cloud.zilliz.com/signup) to get your API key
- **OpenAI API Key**: For embedding model (get from [OpenAI](https://platform.openai.com/api-keys))

```bash
# Add Claude Context MCP server (if not already added)
claude mcp add claude-context \
  -e OPENAI_API_KEY=your-openai-api-key \
  -e MILVUS_TOKEN=your-zilliz-cloud-api-key \
  -- npx @zilliz/claude-context-mcp@latest
```

### 2. Index Your Codebase

Claude Context automatically indexes your codebase on first use:

```python
# The deep-searcher agent will automatically call:
mcp__claude-context__index_codebase(path="/your/project/path")
```

Indexing runs in the background - you can search immediately while it completes.

## How It Works

### Automatic Workflow

The deep-searcher agent now:

1. **Checks indexing status** using `mcp__claude-context__get_indexing_status`
2. **Performs semantic search** using `mcp__claude-context__search_code`
3. **Falls back to grep** for specific regex patterns when needed
4. **Combines both** for comprehensive coverage

### Search Examples

```python
# Old way (Grep - exact matches only)
grep -r "auth.*session" ./src

# New way (Claude Context - semantic understanding)
mcp__claude-context__search_code(
    path="/project/path",
    query="user authentication and session management",
    limit=20
)
# Finds: login implementations, JWT handling, OAuth flows, session storage
# Even if they don't contain the exact words "authentication" or "session"
```

## Usage by Other Agents

The following agents now invoke deep-searcher BEFORE writing code:

- **python-pro**: Searches for existing Python patterns
- **javascript-craftsman**: Finds JavaScript implementations
- **typescript-expert**: Discovers type definitions and interfaces

This ensures:

- No duplicate implementations
- Consistent coding patterns
- Understanding of existing architecture
- Faster development through reuse

## Search Parameters

### mcp**claude-context**search_code

```python
{
    "path": "/absolute/path/to/search",     # Required: absolute path
    "query": "natural language query",       # Required: what to search for
    "limit": 10,                            # Optional: results count (default: 10, max: 50)
    "extensionFilter": [".ts", ".py"]       # Optional: filter by file types
}
```

### mcp**claude-context**index_codebase

```python
{
    "path": "/absolute/path/to/index",      # Required: absolute path
    "force": false,                         # Optional: force re-indexing
    "ignorePatterns": ["dist/**"],          # Optional: custom ignore patterns
    "customExtensions": [".vue", ".svelte"] # Optional: additional file types
}
```

## Troubleshooting

### Check Indexing Status

```python
mcp__claude-context__get_indexing_status(path="/project/path")
```

Returns:

- Progress percentage for active indexing
- Completion status for indexed codebases
- File counts and statistics

### Clear and Re-index

If you need to rebuild the index:

```python
# Clear existing index
mcp__claude-context__clear_index(path="/project/path")

# Re-index with force flag
mcp__claude-context__index_codebase(path="/project/path", force=True)
```

### Common Issues

**No results found**:

- Check if indexing is complete with `get_indexing_status`
- Verify the search path is correct
- Try broader search queries

**Indexing seems stuck**:

- Background indexing continues even if it seems inactive
- Large codebases may take several minutes
- Check status periodically

## Benefits Over Traditional Search

1. **Semantic Understanding**: Finds conceptually related code regardless of terminology
2. **Incremental Updates**: Only re-indexes changed files, not entire codebase
3. **Cloud Processing**: Offloads heavy computation to Zilliz Cloud
4. **Hybrid Search**: Combines keyword (BM25) and semantic (vector) search
5. **AST Analysis**: Understands code structure, not just text matching

## Architecture

```
┌─────────────────────────────────────────┐
│        Deep Search Agent                 │
├─────────────────────────────────────────┤
│         Search Orchestrator              │
│  • Query planning                        │
│  • Result aggregation                    │
├─────────────────────────────────────────┤
│       Claude Context MCP Server          │
│  ┌────────────┬─────────────────────┐   │
│  │Semantic    │ Traditional Grep    │   │
│  │Search      │ (Fallback/Regex)    │   │
│  └────────────┴─────────────────────┘   │
├─────────────────────────────────────────┤
│         Zilliz Cloud Backend             │
│  • Vector storage & search               │
│  • Incremental indexing                  │
│  • Merkle tree tracking                  │
└─────────────────────────────────────────┘
```

## Supported Technologies

- **Languages**: TypeScript, JavaScript, Python, Java, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, Scala, Markdown
- **Code Splitters**: AST-based (with automatic fallback), LangChain character-based
- **Embedding Providers**: OpenAI, VoyageAI, Ollama, Gemini
- **Vector Database**: Zilliz Cloud (managed Milvus)

## Further Reading

- [Claude Context GitHub Repository](https://github.com/zilliztech/claude-context)
- [Claude Context MCP Documentation](https://github.com/zilliztech/claude-context/blob/master/docs)
- [Zilliz Cloud Documentation](https://docs.zilliz.com/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
