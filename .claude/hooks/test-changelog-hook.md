# Auto Changelog Updater Hook

## Summary

Created a post-tool hook that automatically updates the changelog after git commits.

## Hook Details

- **Name**: auto-changelog-updater.py
- **Type**: PostToolUse
- **Matcher**: Bash (triggers on all Bash commands)
- **Purpose**: Automatically runs `scripts/changelog/update-changelog.py --auto` after successful git commits

## How It Works

1. The hook monitors all Bash tool uses
2. It checks if the command contains git commit patterns:
   - `git commit`
   - `git commit -m`
   - `git commit --message`
   - `git commit -am`
   - `git commit --amend`
3. If a git commit is detected and succeeds (exit code 0), it runs the changelog update script
4. The changelog script analyzes recent commits and updates CHANGELOG.md automatically

## Configuration

Added to `.claude/settings.json` under PostToolUse:

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "cd \"$CLAUDE_PROJECT_DIR\" && python .claude/hooks/auto-changelog-updater.py"
    }
  ]
}
```

## Benefits

- No manual changelog updates needed after commits
- Consistent changelog format following conventions
- Automatic categorization of commits
- Reduces overhead in development workflow

## Testing

To test the hook:

1. Make a code change
2. Commit with: `git commit -m "feat: add new feature"`
3. The changelog should automatically update with the new commit
