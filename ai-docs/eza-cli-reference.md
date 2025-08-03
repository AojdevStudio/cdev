# Eza CLI Reference Guide

Eza is a modern replacement for the `ls` command, written in Rust. It provides enhanced features, better defaults, and a more user-friendly experience for listing files and directories.

## Basic Usage

```bash
eza [OPTIONS] [FILES...]
```

## Display Options

### Layout Modes

```bash
# One entry per line
eza -1
eza --oneline

# Grid layout (default)
eza -G
eza --grid

# Long format with detailed information
eza -l
eza --long

# Tree view
eza -T
eza --tree

# Recursive listing
eza -R
eza --recurse

# Sort grid across instead of downwards
eza -x
eza --across
```

### Visual Enhancements

```bash
# Display file type indicators (/, @, *, |, =, >, !)
eza -F
eza --classify          # auto (default)
eza --classify=always   # always show
eza --classify=never    # never show

# Show icons
eza --icons             # auto
eza --icons=always
eza --icons=never

# Enable hyperlinks
eza --hyperlink

# Color options
eza --color=always      # always use colors
eza --color=auto        # auto-detect (default)
eza --color=never       # no colors

# Color scale for file sizes/ages
eza --color-scale       # all fields
eza --color-scale=age   # age only
eza --color-scale=size  # size only

# Color scale mode
eza --color-scale-mode=gradient  # gradient colors (default)
eza --color-scale-mode=fixed     # fixed colors
```

### Path Display

```bash
# Show absolute paths
eza --absolute          # on (default when used)
eza --absolute=on       # show absolute paths
eza --absolute=follow   # resolve symlinks to absolute paths
eza --absolute=off      # show relative paths (default)
```

## Filtering Options

### Basic Filtering

```bash
# Show all files including hidden
eza -a
eza --all

# Show . and .. directories too
eza -aa
eza --all --all

# List directories as files (don't recurse)
eza -d
eza --list-dirs

# Only show directories
eza -D
eza --only-dirs

# Only show files
eza -f
eza --only-files

# Ignore files in .gitignore
eza --git-ignore

# Ignore glob patterns
eza -I "*.tmp"
eza --ignore-glob="*.log|*.cache|node_modules"
```

### Symlink Handling

```bash
# Don't show symbolic links
eza --no-symlinks

# Show symlinks with --only-dirs or --only-files
eza --only-dirs --show-symlinks
eza --only-files --show-symlinks

# Follow symlinks to directories
eza --follow-symlinks

# Dereference symlinks when displaying info
eza -X
eza --dereference
```

## Sorting Options

```bash
# Reverse sort order
eza -r
eza --reverse

# Sort by field
eza -s name      # by name (default)
eza -s Name      # by name (uppercase first)
eza -s size      # by size
eza -s extension # by extension
eza -s Extension # by extension (uppercase first)
eza -s modified  # by modification time
eza -s accessed  # by access time
eza -s created   # by creation time
eza -s changed   # by changed time
eza -s inode     # by inode number
eza -s type      # by file type
eza -s none      # no sorting

# Sort aliases
eza -s date      # same as modified
eza -s time      # same as modified
eza -s newest    # same as modified
eza -s age       # reverse modified
eza -s oldest    # reverse modified

# Directory grouping
eza --group-directories-first
eza --group-directories-last

# Common sorting patterns
eza -l --sort=modified           # sort by modification time
eza -l --sort=modified --reverse # newest first
eza -la --sort=size --reverse    # largest files first
```

## Long View Options (-l)

### Basic Long View

```bash
# Extended details
eza -l

# With header row
eza -lh
eza -l --header

# Common combinations
eza -la     # long view with hidden files
eza -lh     # long view with header
eza -lah    # all of the above
```

### Ownership & Permissions

```bash
# Show group ownership
eza -lg
eza -l --group

# Smart group (only if different from owner)
eza -l --smart-group

# Show octal permissions
eza -lo
eza -l --octal-permissions

# Hide permissions column
eza -l --no-permissions

# Show inode numbers
eza -li
eza -l --inode

# Show number of hard links
eza -lH
eza -l --links

# Show SELinux context
eza -lZ
eza -l --context

# Show extended attributes
eza -l@
eza -l --extended
```

### Size Display

```bash
# Binary prefixes (KiB, MiB, GiB)
eza -lb
eza -l --binary

# Bytes without prefixes
eza -lB
eza -l --bytes

# Show filesystem block size
eza -lS
eza -l --blocksize

# Hide filesize column
eza -l --no-filesize

# Show total size for directories
eza -l --total-size
```

### Time & Date

```bash
# Time field selection
eza -lt modified  # modification time (default)
eza -lt accessed  # access time
eza -lt created   # creation time
eza -lt changed   # changed time

# Shortcuts
eza -lm          # use modified time
eza -l --modified

eza -lu          # use accessed time
eza -l --accessed

eza -lU          # use created time
eza -l --created

eza -l --changed # use changed time

# Time styles
eza -l --time-style=default    # default format
eza -l --time-style=iso        # ISO 8601
eza -l --time-style=long-iso   # long ISO format
eza -l --time-style=full-iso   # full ISO format
eza -l --time-style=relative   # relative times (e.g., "2 days ago")

# Custom time format
eza -l --time-style="+%Y-%m-%d %H:%M"
eza -l --time-style="+%d %b %Y"

# Hide time column
eza -l --no-time

# Show time with modification info
eza -l --time=modified
```

### User Information

```bash
# Hide user column
eza -l --no-user
```

### Git Integration

```bash
# Show Git status for tracked files
eza -l --git

# Git status indicators:
# - N: New (untracked)
# - M: Modified
# - D: Deleted
# - R: Renamed
# - T: Type changed
# - I: Ignored
# - C: Conflicted

# Show Git repository status for directories
eza -l --git-repos

# Show if directory is a Git repo (faster, no status)
eza -l --git-repos-no-status

# Disable all Git features
eza -l --no-git
```

### Mount Points

```bash
# Show mount details (Linux/macOS only)
eza -lM
eza -l --mounts
```

## Tree View Options

```bash
# Basic tree
eza -T
eza --tree

# Limit tree depth
eza -TL 2
eza --tree --level=2

# Tree with long format
eza -lT
eza -l --tree

# Tree with specific sorting
eza -T --sort=size
eza -T --sort=modified
```

## Common Use Cases

### Quick Overview

```bash
# Current directory grid
eza

# All files with details
eza -la

# Tree view of project
eza -T --git-ignore

# Recent files
eza -l --sort=modified --reverse

# Large files
eza -l --sort=size --reverse
```

### Development

```bash
# Project overview with Git status
eza -la --git --header

# Source files only
eza -la --ignore-glob="*.o|*.pyc|__pycache__|node_modules"

# Tree ignoring Git-ignored files
eza -T --git-ignore

# Find recently modified files
eza -la --sort=modified --reverse | head -20
```

### System Administration

```bash
# Detailed permissions and ownership
eza -l --header --group --octal-permissions

# With SELinux context
eza -lZ

# Mount points and sizes
eza -l --mounts --total-size

# Find large files/directories
eza -la --sort=size --reverse --total-size
```

### Advanced Combinations

```bash
# Full details with everything
eza -laghiHSZ@ --git --header --octal-permissions

# Clean tree for documentation
eza -T --git-ignore -D

# Human-friendly recent changes
eza -l --sort=modified --time-style=relative --git

# Recursive size analysis
eza -l --total-size --sort=size --reverse -T -L 2
```

## Environment Variables

```bash
# Color configuration
export LS_COLORS="..."      # Traditional ls colors
export EXA_COLORS="..."     # Eza-specific colors (legacy)
export EZA_COLORS="..."     # Eza-specific colors

# Config directory for theme.yml
export EZA_CONFIG_DIR="$HOME/.config/eza"

# Icon configuration
export EZA_ICON_SPACING=2   # Spaces between icon and filename
```

## Configuration

Eza supports a `theme.yml` file for customizing colors and icons. Place it in:
- `$EZA_CONFIG_DIR/theme.yml`
- `$XDG_CONFIG_HOME/eza/theme.yml` (default: `~/.config/eza/theme.yml`)

## Aliases

Common aliases to add to your shell configuration:

```bash
# Basic replacements
alias ls='eza --classify --time-style=long-iso'
alias ll='eza --git --group --header --long'
alias la='eza --git --group --header --long --all --all'
alias l='eza --long --all --all'

# Specialized views
alias lt='eza --tree --level=2'
alias lta='eza --tree --all --level=2'
alias llt='eza --long --tree --level=2'

# Recent files
alias lm='eza -l --sort=modified --reverse'
alias lma='eza -la --sort=modified --reverse'

# Size analysis
alias lsize='eza -l --sort=size --reverse'
alias ltsize='eza -l --tree --total-size --sort=size --reverse'

# Git-aware listings
alias lg='eza -la --git --git-repos'
alias lgi='eza -la --git --git-ignore'

# Quick navigation helpers
alias lsd='eza -D'  # directories only
alias lsf='eza -f'  # files only
```

## Tips & Tricks

1. **Performance**: Use `--git-repos-no-status` instead of `--git-repos` for faster directory listings
2. **Readability**: Combine `--header` with `-l` for clearer output
3. **Filtering**: Use `--git-ignore` to respect `.gitignore` files
4. **Icons**: Install a Nerd Font for best icon support
5. **Colors**: Use `--color-scale` for visual file size/age indicators
6. **Time**: Use `--time-style=relative` for human-friendly timestamps

## Differences from ls

- Colors enabled by default
- Git integration
- Better default sorting
- Human-readable sizes by default
- Extended attributes and metadata support
- Tree view built-in
- Icons support
- Hyperlink support