# Context7 Tools Recommendation for Coding Agents

## Summary

The context7 MCP tools (`mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs`) are essential for coding agents to ensure they use up-to-date APIs, avoid deprecated methods, and follow current best practices. These tools provide real-time access to library documentation.

## Updated Agents

### 1. javascript-craftsman.md ✅
- **Status**: Updated with context7 tools
- **Tools added**: `mcp__context7__resolve-library-id`, `mcp__context7__get-library-docs`
- **Enhancement**: Added documentation lookup section explaining when to use these tools

### 2. javascript-craftsman-improved.md ✅
- **Status**: Updated with context7 tools
- **Tools added**: `mcp__context7__resolve-library-id`, `mcp__context7__get-library-docs`
- **Enhancement**: Added to best practices and implementation steps

## Already Have Context7 Tools

### 1. python-pro.md ✅
- **Status**: Already includes context7 tools
- **Current tools**: Includes both resolve-library-id and get-library-docs

### 2. typescript-expert.md ✅
- **Status**: Already includes context7 tools
- **Current tools**: Includes both resolve-library-id and get-library-docs

## Recommendations for Other Agents

Based on the meta-agent's updated best practices stating that "Coding and planning agents should ALWAYS have access to the `resolve-library-id` and `get-library-docs` tools", here are agents that should be updated:

### High Priority (Direct Coding Agents)
1. **css-master** - Needs context7 for CSS framework documentation
2. **html-specialist** - For HTML5 APIs and web standards
3. **node-backend-expert** - Critical for Node.js API changes
4. **api-developer** - For REST/GraphQL library documentation
5. **database-architect** - For ORM and database driver docs
6. **mobile-developer** - For React Native/Flutter APIs
7. **devops-engineer** - For infrastructure-as-code tools
8. **full-stack-developer** - Covers multiple technologies

### Medium Priority (Specialized Coding)
1. **test-automator** - For testing framework documentation
2. **performance-optimizer** - For profiling tool APIs
3. **security-auditor** - For security library updates
4. **ui-ux-developer** - For design system libraries
5. **data-engineer** - For data processing libraries
6. **ai-ml-engineer** - For ML framework documentation

### Lower Priority (Support Roles)
1. **code-reviewer** - While reviewing, may need to verify APIs
2. **debugger** - May need to check library behavior
3. **refactoring-expert** - For understanding migration paths
4. **documentation-writer** - To ensure accurate API docs

## Implementation Guidelines

When adding context7 tools to agents:

1. **Minimal Tool Set**: Keep the total number of tools reasonable (6-10 tools max)
2. **Core Tools First**: Prioritize Read, Write, MultiEdit, Grep, Glob, Bash
3. **Add Context7**: Include both `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs`
4. **Update System Prompt**: Add a section explaining when and how to use these tools
5. **Best Practice Note**: Include in the agent's best practices section

## Example Tool Configuration

```yaml
tools: Read, Write, MultiEdit, Grep, Glob, Bash, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
```

## Example System Prompt Addition

```markdown
**Documentation Lookup**: When working with external libraries or frameworks:
- Use `mcp__context7__resolve-library-id` to find the correct library identifier
- Use `mcp__context7__get-library-docs` to retrieve up-to-date documentation
- This ensures you avoid deprecated methods and use the most current patterns
- Always verify unfamiliar APIs before implementation
```

## Benefits

1. **Accuracy**: Agents use current, not outdated APIs
2. **Quality**: Avoid deprecated patterns automatically
3. **Efficiency**: No need to guess or use old knowledge
4. **Consistency**: All agents follow the same documentation lookup pattern
5. **Future-proof**: As libraries update, agents stay current

## Next Steps

1. Audit all existing coding agents for context7 tools
2. Update high-priority agents first
3. Create a template for new coding agents that includes context7 by default
4. Consider adding to the meta-agent template generation