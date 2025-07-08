#!/bin/bash

# cache-linear-issue.sh - Cache Linear issue data locally for offline decomposition
# Usage: ./cache-linear-issue.sh AOJ-63

set -e

ISSUE_ID="$1"

if [[ -z "$ISSUE_ID" ]]; then
    echo "Usage: $0 <LINEAR_ISSUE_ID>"
    echo "Example: $0 AOJ-63"
    exit 1
fi

# Check if LINEAR_API_KEY is set
if [[ -z "$LINEAR_API_KEY" ]]; then
    echo "❌ LINEAR_API_KEY environment variable not set"
    echo "   Run: export LINEAR_API_KEY=\"your_api_key\""
    exit 1
fi

# Create cache directory
CACHE_DIR=".linear-cache"
mkdir -p "$CACHE_DIR"

echo "🔍 Fetching Linear issue: $ISSUE_ID"

# GraphQL query to fetch issue details
QUERY='{
  "query": "query GetIssue($id: String!) { issue(id: $id) { id identifier title description priority priorityLabel state { name } assignee { name email } team { name } project { name } createdAt updatedAt } }",
  "variables": {
    "id": "'$ISSUE_ID'"
  }
}'

# Fetch from Linear API (Linear uses API key directly, not Bearer token)
RESPONSE=$(curl -s -X POST \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$QUERY" \
  https://api.linear.app/graphql)

# Check if curl succeeded
if [[ $? -ne 0 ]]; then
    echo "❌ Failed to fetch from Linear API"
    exit 1
fi

# Check for GraphQL errors
ERROR_CHECK=$(echo "$RESPONSE" | jq -r '.errors // empty')
if [[ -n "$ERROR_CHECK" ]]; then
    echo "❌ Linear API error:"
    echo "$RESPONSE" | jq -r '.errors[0].message'
    exit 1
fi

# Check if issue was found
ISSUE_DATA=$(echo "$RESPONSE" | jq -r '.data.issue')
if [[ "$ISSUE_DATA" == "null" ]]; then
    echo "❌ Issue $ISSUE_ID not found"
    exit 1
fi

# Save to cache file
CACHE_FILE="$CACHE_DIR/$ISSUE_ID.json"
echo "$RESPONSE" | jq '.data.issue' > "$CACHE_FILE"

# Extract and display key info
TITLE=$(echo "$RESPONSE" | jq -r '.data.issue.title')
PRIORITY=$(echo "$RESPONSE" | jq -r '.data.issue.priorityLabel // .data.issue.priority // "Unknown"')
STATUS=$(echo "$RESPONSE" | jq -r '.data.issue.state.name // "Unknown"')
ASSIGNEE=$(echo "$RESPONSE" | jq -r '.data.issue.assignee.name // "Unassigned"')

echo "✅ Issue cached successfully!"
echo "📋 Title: $TITLE"
echo "🎯 Priority: $PRIORITY"
echo "📊 Status: $STATUS"  
echo "👤 Assignee: $ASSIGNEE"
echo "💾 Cached to: $CACHE_FILE"

# Show description preview (first 100 chars)
DESCRIPTION=$(echo "$RESPONSE" | jq -r '.data.issue.description // "No description"')
PREVIEW=$(echo "$DESCRIPTION" | head -c 100)
echo "📝 Description: $PREVIEW..."

echo ""
echo "🚀 Now you can run: node decompose-parallel.cjs $ISSUE_ID"