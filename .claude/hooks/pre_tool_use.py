#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path


def is_dangerous_deletion_command(command):
    """
    ULTRA-COMPREHENSIVE detection of ANY deletion or destructive commands.
    Blocks absolutely ALL forms of file/directory removal and destructive operations.
    """
    # Normalize command by removing extra spaces and converting to lowercase
    normalized = ' '.join(command.lower().split())

    # PATTERN 1: ALL rm command variations (any rm usage is blocked)
    rm_patterns = [
        r'\brm\b',                                      # Any rm command at all
        r'\bunlink\b',                                  # unlink command
        r'\brmdir\b',                                   # rmdir command
        r'\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b', # rm -rf, rm -fr, rm -Rf, etc.
        r'\brm\s+--recursive\s+--force',               # rm --recursive --force
        r'\brm\s+--force\s+--recursive',               # rm --force --recursive
        r'\brm\s+-[a-z]*r\b',                          # rm with recursive flag
        r'\brm\s+-[a-z]*f\b',                          # rm with force flag
        r'\brm\s+--recursive\b',                       # rm --recursive
        r'\brm\s+--force\b',                           # rm --force
        r'\brm\s+-[a-z]*i\b',                          # rm with interactive flag
        r'\brm\s+--interactive\b',                     # rm --interactive
    ]

    # PATTERN 2: File system destructive operations
    destructive_patterns = [
        r'\bdd\s+.*of=',                               # dd command writing to files
        r'\bshred\b',                                  # shred command
        r'\bwipe\b',                                   # wipe command
        r'\bsrm\b',                                    # secure rm
        r'\btrash\b',                                  # trash command
        r'\bgio\s+trash\b',                           # gio trash
        r'\bmv\s+.*\s+/dev/null',                     # move to /dev/null
        r'\bcp\s+/dev/null\b',                        # copy /dev/null (truncate)
        r'>\s*/dev/null',                             # redirect to /dev/null
        r'\btruncate\b',                              # truncate command
        r'\b:\s*>\s*[^|&;]+',                         # shell truncation (:> file)
        r'\btrue\s*>\s*[^|&;]+',                      # true > file (truncation)
        r'\bfalse\s*>\s*[^|&;]+',                     # false > file (truncation)
    ]

    # PATTERN 3: Dangerous redirection and overwrite operations
    overwrite_patterns = [
        r'>\s*[^|&;>\s]+\s*$',                        # Simple redirection that overwrites
        r'\becho\s+.*>\s*[^|&;>\s]+',                 # echo > file (overwrite)
        r'\bprintf\s+.*>\s*[^|&;>\s]+',               # printf > file (overwrite)
        r'\bcat\s+.*>\s*[^|&;>\s]+',                  # cat > file (overwrite)
        r'\bcp\s+/dev/null\s+',                       # copy /dev/null to file
        r'\bdd\s+.*>\s*[^|&;>\s]+',                   # dd > file
    ]

    # PATTERN 4: Archive/compression destructive operations
    archive_destructive_patterns = [
        r'\btar\s+.*--delete\b',                      # tar delete
        r'\bzip\s+.*-d\b',                            # zip delete
        r'\bunzip\b',                                 # unzip (can overwrite)
        r'\bgunzip\b',                                # gunzip (deletes .gz)
        r'\bbunzip2\b',                               # bunzip2 (deletes .bz2)
        r'\bunxz\b',                                  # unxz (deletes .xz)
        r'\b7z\s+.*d\b',                              # 7z delete
    ]

    # PATTERN 5: Git destructive operations
    git_destructive_patterns = [
        r'\bgit\s+clean\s+.*-f\b',                    # git clean -f
        r'\bgit\s+reset\s+.*--hard\b',               # git reset --hard
        r'\bgit\s+checkout\s+.*--force\b',           # git checkout --force
        r'\bgit\s+branch\s+.*-D\b',                  # git branch -D (force delete)
        r'\bgit\s+tag\s+.*-d\b',                     # git tag -d (delete)
        r'\bgit\s+remote\s+.*remove\b',              # git remote remove
        r'\bgit\s+worktree\s+.*remove\b',            # git worktree remove
        r'\bgit\s+stash\s+.*drop\b',                 # git stash drop
        r'\bgit\s+stash\s+.*clear\b',                # git stash clear
        r'\bgit\s+reflog\s+.*delete\b',              # git reflog delete
        r'\bgit\s+gc\s+.*--prune\b',                 # git gc --prune
    ]

    # PATTERN 6: Package manager destructive operations
    package_destructive_patterns = [
        r'\bnpm\s+.*uninstall\b',                     # npm uninstall
        r'\bnpm\s+.*remove\b',                        # npm remove
        r'\bnpm\s+.*rm\b',                            # npm rm
        r'\byarn\s+.*remove\b',                       # yarn remove
        r'\bpip\s+.*uninstall\b',                     # pip uninstall
        r'\bconda\s+.*remove\b',                      # conda remove
        r'\bapt\s+.*remove\b',                        # apt remove
        r'\bapt\s+.*purge\b',                         # apt purge
        r'\byum\s+.*remove\b',                        # yum remove
        r'\bbrew\s+.*uninstall\b',                    # brew uninstall
        r'\bbrew\s+.*remove\b',                       # brew remove
    ]

    # PATTERN 7: Database destructive operations
    database_destructive_patterns = [
        r'\bdrop\s+table\b',                          # SQL DROP TABLE
        r'\bdrop\s+database\b',                       # SQL DROP DATABASE
        r'\bdelete\s+from\b',                         # SQL DELETE FROM
        r'\btruncate\s+table\b',                      # SQL TRUNCATE TABLE
        r'\bmongo.*\.drop\b',                         # MongoDB drop
        r'\bmongo.*\.remove\b',                       # MongoDB remove
        r'\bmongo.*\.deleteMany\b',                   # MongoDB deleteMany
        r'\bmongo.*\.deleteOne\b',                    # MongoDB deleteOne
    ]

    # PATTERN 8: System destructive operations
    system_destructive_patterns = [
        r'\bkill\s+.*-9\b',                           # kill -9 (force kill)
        r'\bkillall\b',                               # killall
        r'\bpkill\b',                                 # pkill
        r'\bfuser\s+.*-k\b',                          # fuser -k (kill)
        r'\bumount\s+.*-f\b',                         # umount -f (force)
        r'\bswapoff\b',                               # swapoff
        r'\bfdisk\b',                                 # fdisk (disk partitioning)
        r'\bmkfs\b',                                  # mkfs (format filesystem)
        r'\bformat\b',                                # format command
    ]

    # PATTERN 9: Dangerous paths and wildcards
    dangerous_paths = [
        r'/',           # Root directory
        r'/\*',         # Root with wildcard
        r'~',           # Home directory
        r'~/',          # Home directory path
        r'\$HOME',      # Home environment variable
        r'\.\.',        # Parent directory references
        r'\*',          # Any wildcards
        r'\.',          # Current directory
        r'\.\s*$',      # Current directory at end
        r'/usr',        # System directories
        r'/var',        # Variable data
        r'/etc',        # Configuration
        r'/bin',        # Binaries
        r'/sbin',       # System binaries
        r'/lib',        # Libraries
        r'/opt',        # Optional software
        r'/tmp/\*',     # Temp with wildcards
        r'\.git',       # Git directories
        r'node_modules', # Node modules
        r'\.env',       # Environment files
    ]

    # Check ALL patterns
    all_patterns = (
        rm_patterns +
        destructive_patterns +
        overwrite_patterns +
        archive_destructive_patterns +
        git_destructive_patterns +
        package_destructive_patterns +
        database_destructive_patterns +
        system_destructive_patterns
    )

    # Check for any destructive pattern
    for pattern in all_patterns:
        if re.search(pattern, normalized):
            return True

    # Check for dangerous paths in any context
    for path in dangerous_paths:
        if re.search(path, normalized):
            # Extra strict: block any command that mentions dangerous paths
            return True

    # PATTERN 10: Command chaining that might hide destructive operations
    chain_patterns = [
        r'&&.*\brm\b',                                # && rm
        r'\|\|.*\brm\b',                              # || rm
        r';.*\brm\b',                                 # ; rm
        r'\|.*\brm\b',                                # | rm
        r'`.*\brm\b.*`',                              # `rm` in backticks
        r'\$\(.*\brm\b.*\)',                          # $(rm) in command substitution
    ]

    for pattern in chain_patterns:
        if re.search(pattern, normalized):
            return True

    return False

def is_env_file_access(tool_name, tool_input):
    """
    Check if any tool is trying to access .env files containing sensitive data.
    Allows reading .env files but blocks editing/writing operations.
    Also allows access to .env.sample and .env.example files.
    """
    if tool_name in ['Read', 'Edit', 'MultiEdit', 'Write', 'Bash']:
        # Check file paths for file-based tools
        if tool_name in ['Edit', 'MultiEdit', 'Write']:  # Only block edit operations, allow Read
            file_path = tool_input.get('file_path', '')
            if '.env' in file_path and not (file_path.endswith('.env.sample') or file_path.endswith('.env.example')):
                return True
        
        # Check bash commands for .env file access
        elif tool_name == 'Bash':
            command = tool_input.get('command', '')
            # Pattern to detect .env file write/edit operations (but allow .env.sample and .env.example)
            # Allow cat/read operations but block write operations
            env_write_patterns = [
                r'echo\s+.*>\s*\.env\b(?!\.sample|\.example)',  # echo > .env
                r'touch\s+.*\.env\b(?!\.sample|\.example)',  # touch .env
                r'cp\s+.*\.env\b(?!\.sample|\.example)',  # cp .env (as destination)
                r'mv\s+.*\.env\b(?!\.sample|\.example)',  # mv .env (as destination)
                r'>\s*\.env\b(?!\.sample|\.example)',  # any redirection to .env
                r'>>\s*\.env\b(?!\.sample|\.example)',  # any append to .env
                r'vim\s+.*\.env\b(?!\.sample|\.example)',  # vim .env
                r'nano\s+.*\.env\b(?!\.sample|\.example)',  # nano .env
                r'emacs\s+.*\.env\b(?!\.sample|\.example)',  # emacs .env
                r'sed\s+.*-i.*\.env\b(?!\.sample|\.example)',  # sed -i .env (in-place edit)
            ]
            
            for pattern in env_write_patterns:
                if re.search(pattern, command):
                    return True
    
    return False

def is_command_file_access(tool_name, tool_input):
    """
    Check if any tool is trying to access .claude/commands/ files.
    This now only provides warnings, not blocks, to avoid workflow disruption.
    """
    if tool_name not in ['Write', 'Edit', 'MultiEdit']:
        return False
    
    file_path = tool_input.get('file_path', '')
    if not file_path:
        return False
    
    # Check if this is a .claude/commands/ file
    normalized_path = os.path.normpath(file_path)
    
    # Check for both relative and absolute paths
    is_commands_file = (
        '/.claude/commands/' in normalized_path or
        normalized_path.startswith('.claude/commands/') or
        normalized_path.startswith('.claude\\commands\\') or  # Windows
        '/.claude/commands/' in normalized_path or
        normalized_path.endswith('/.claude/commands') or
        normalized_path.endswith('\\.claude\\commands')  # Windows
    )
    
    if not is_commands_file:
        return False
    
    # Only check .md files in commands directory
    if not file_path.endswith('.md'):
        return False
    
    return True

def find_template_file():
    """Find the custom command template file"""
    possible_paths = [
        "ai-docs/custom-command-template.md",
        "./ai-docs/custom-command-template.md",
        "../ai-docs/custom-command-template.md",
        "ai_docs/custom-command-template.md",
        "./ai_docs/custom-command-template.md"
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    return None

def contains_date_patterns(content):
    """
    Check if content contains date patterns that might be hallucinated.
    Returns True if dates are found that should be verified.
    """
    # Common date patterns that LLMs might hallucinate
    date_patterns = [
        r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b',
        r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b',
        r'\bQ[1-4]\s+\d{4}\b',  # Q1 2025, etc.
        r'\b\d{4}-\d{2}-\d{2}\b',  # 2025-01-15
        r'\b\d{1,2}/\d{1,2}/\d{4}\b',  # 1/15/2025 or 01/15/2025
        r'\b(by|in|on|before|after)\s+(end\s+of\s+)?\d{4}\b',  # by 2025, by end of 2025
        r'\b(early|mid|late)\s+\d{4}\b',  # early 2025
        r'(next|last|this)\s+(month|quarter|year)',  # next quarter
        r'(within|in)\s+\d+\s+(days|weeks|months)',  # within 30 days
    ]
    
    for pattern in date_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    
    return False

def check_root_structure_violations(tool_name, tool_input):
    """
    Check for operations that might create files violating root directory structure rules.
    Prevents creation of unauthorized .md files, config files, or scripts in root.
    """
    if tool_name not in ['Write', 'Edit', 'MultiEdit']:
        return False
    
    # Define structure rules
    allowed_md_files = {
        'README.md', 'CHANGELOG.md', 'CLAUDE.md', 
        'ROADMAP.md', 'SECURITY.md', 'LICENSE.md'
    }
    
    forbidden_patterns = [
        r'^jest\.config.*\.js$',  # Jest configs
        r'^babel\.config\.js$',   # Babel config
        r'^webpack\.config.*\.js$',  # Webpack configs
        r'^tsconfig.*\.json$',    # TypeScript configs
        r'^docker-compose\.ya?ml$',  # Docker Compose
        r'^Dockerfile',           # Docker files
        r'^.*\.sh$',              # Shell scripts
        r'^debug-.*\.js$',        # Debug scripts
        r'^test-.*\.js$',         # Test scripts
        r'.*-report\.md$',        # Report docs  
        r'.*enforcement.*\.md$',  # Enforcement reports
        r'.*-plan\.md$',          # Planning docs
        r'^USAGE\.md$',           # Usage docs
        r'^CONTRIBUTING\.md$',    # Contributing docs
        r'^ARCHITECTURE\.md$',    # Architecture docs
        r'^API\.md$',             # API docs
        r'^.*\.yaml$',            # YAML manifests/configs
        r'^.*\.yml$'              # YML manifests/configs
    ]
    
    file_path = tool_input.get('file_path', '')
    if not file_path:
        return False
    
    # Extract filename from path
    filename = os.path.basename(file_path)
    
    # Check if it's trying to create/edit a file in root directory
    # Normalize the path
    normalized_path = os.path.normpath(file_path)
    
    # Essential framework directories that should stay in root
    essential_root_dirs = {
        'ai-docs',     # Framework AI documentation
        'src', 'test', 'bin', 'lib', 'node_modules', 
        '.git', '.claude', 'config', 'scripts', 'docs'
    }
    
    # Check if file is in root directory
    if '/' in normalized_path:
        dir_part = os.path.dirname(normalized_path)
        # If directory part exists and is not current directory, it's not in root
        if dir_part and dir_part not in ['.', '']:
            # Check if it's in an essential directory - these are allowed
            first_dir = dir_part.split('/')[0] if '/' in dir_part else dir_part
            if first_dir in essential_root_dirs:
                return False
            # If it's not in an essential directory, it's not a root violation
            return False
    
    # If no '/' in path, it's definitely in root - check if it's allowed
    
    # Special case: absolute paths to current project root
    if file_path.startswith('/Users/') and 'paralell-development-claude' in file_path:
        # Extract relative path from project root
        parts = file_path.split('paralell-development-claude/')
        if len(parts) > 1:
            relative_path = parts[1]
            if '/' in relative_path:
                return False
    
    # Check .md files
    if filename.endswith('.md'):
        if filename not in allowed_md_files:
            return True
    
    # Check forbidden patterns
    for pattern in forbidden_patterns:
        if re.match(pattern, filename):
            return True
    
    return False

def check_date_awareness(tool_name, tool_input):
    """
    Check if the tool is writing date-sensitive content without verifying current date.
    """
    # Only check tools that write content
    if tool_name not in ['Write', 'Edit', 'MultiEdit']:
        return False
    
    # Get the content being written
    content = ''
    if tool_name == 'Write':
        content = tool_input.get('content', '')
    elif tool_name == 'Edit':
        content = tool_input.get('new_string', '')
    elif tool_name == 'MultiEdit':
        edits = tool_input.get('edits', [])
        content = ' '.join([edit.get('new_string', '') for edit in edits])
    
    # Check if content contains date patterns
    return contains_date_patterns(content)

def check_recent_date_command():
    """
    Check if the date command was run recently (within last 5 minutes).
    """
    # Check logs for recent date command
    log_paths = [
        Path.home() / '.claude' / 'logs' / 'pre_tool_use.json',
        Path('logs/pre_tool_use.json'),
        Path('../logs/pre_tool_use.json')
    ]
    
    cutoff_time = time.time() - 300  # 5 minutes
    
    for log_path in log_paths:
        if log_path.exists():
            try:
                with open(log_path, 'r') as f:
                    log_data = json.load(f)
                    
                    # Check recent entries for date command
                    for entry in reversed(log_data[-20:]):  # Check last 20 entries
                        if entry.get('tool_name') == 'Bash':
                            command = entry.get('tool_input', {}).get('command', '')
                            if command.strip() == 'date' or 'date' in command.split():
                                return True
                                
            except (json.JSONDecodeError, FileNotFoundError):
                continue
    
    return False

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # Check for .env file access (blocks access to sensitive environment files)
        if is_env_file_access(tool_name, tool_input):
            print("BLOCKED: Access to .env files containing sensitive data is prohibited", file=sys.stderr)
            print("Use .env.sample for template files instead", file=sys.stderr)
            sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Check for ANY destructive/deletion commands - ULTRA STRICT PROTECTION
        if tool_name == 'Bash':
            command = tool_input.get('command', '')

            # Block ALL forms of deletion and destructive operations
            if is_dangerous_deletion_command(command):
                print("🚫 DELETION PROTECTION: ALL destructive operations are BLOCKED", file=sys.stderr)
                print("", file=sys.stderr)
                print("🛡️  PROTECTED OPERATIONS:", file=sys.stderr)
                print("   • File deletion (rm, unlink, rmdir)", file=sys.stderr)
                print("   • Directory removal (rm -r, rm -rf)", file=sys.stderr)
                print("   • File overwriting (>, echo >, cat >)", file=sys.stderr)
                print("   • Truncation (truncate, :>, /dev/null)", file=sys.stderr)
                print("   • Git destructive ops (reset --hard, clean -f)", file=sys.stderr)
                print("   • Package removal (npm uninstall, pip uninstall)", file=sys.stderr)
                print("   • Database drops (DROP TABLE, DELETE FROM)", file=sys.stderr)
                print("   • System operations (kill -9, format, fdisk)", file=sys.stderr)
                print("   • Archive destructive ops (tar --delete)", file=sys.stderr)
                print("   • Dangerous paths (/, ~, *, .., system dirs)", file=sys.stderr)
                print("", file=sys.stderr)
                print("💡 SAFE ALTERNATIVES:", file=sys.stderr)
                print("   • Use 'mv' to relocate instead of delete", file=sys.stderr)
                print("   • Use 'cp' to backup before changes", file=sys.stderr)
                print("   • Use '>>' to append instead of overwrite", file=sys.stderr)
                print("   • Use specific file paths (no wildcards)", file=sys.stderr)
                print("   • Use git operations without --force flags", file=sys.stderr)
                print("   • Request manual confirmation for destructive operations", file=sys.stderr)
                print("", file=sys.stderr)
                print("🔒 This protection ensures NO accidental data loss", file=sys.stderr)
                sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Check for root directory structure violations
        if check_root_structure_violations(tool_name, tool_input):
            file_path = tool_input.get('file_path', '')
            filename = os.path.basename(file_path)
            print("🚫 ROOT STRUCTURE VIOLATION BLOCKED", file=sys.stderr)
            print(f"   File: {filename}", file=sys.stderr)
            print("   Reason: Unauthorized file in root directory", file=sys.stderr)
            print("", file=sys.stderr)
            print("📋 Root directory rules:", file=sys.stderr)
            print("   • Only these .md files allowed: README.md, CHANGELOG.md, CLAUDE.md, ROADMAP.md, SECURITY.md", file=sys.stderr)
            print("   • Config files belong in config/ directory", file=sys.stderr)
            print("   • Scripts belong in scripts/ directory", file=sys.stderr)
            print("   • Documentation belongs in docs/ directory", file=sys.stderr)
            print("", file=sys.stderr)
            print("💡 Suggestion: Use /enforce-structure --fix to auto-organize files", file=sys.stderr)
            sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Check for .claude/commands/ file access - NOW JUST A WARNING
        if is_command_file_access(tool_name, tool_input):
            file_path = tool_input.get('file_path', '')
            print(f"📝 Command Template Reminder: Editing {file_path}", file=sys.stderr)
            
            # Template file to read
            template_file = find_template_file()
            if template_file and os.path.exists(template_file):
                print(f"💡 Reference template: {template_file}", file=sys.stderr)
                print("🔑 Key requirements:", file=sys.stderr)
                print("   • 6-part structure: YAML frontmatter, heading, description, arguments, instructions, context", file=sys.stderr)
                print("   • Use action verbs and keep descriptions under 80 characters", file=sys.stderr)
                print("   • Include dynamic data gathering with ! commands", file=sys.stderr)
                print("   • Reference files with @ syntax", file=sys.stderr)
                print("   • Follow consistent naming and formatting patterns", file=sys.stderr)
                print("", file=sys.stderr)
            # NOTE: No longer blocking - just providing helpful reminder
        
        # Check for date-sensitive content
        if check_date_awareness(tool_name, tool_input):
            if not check_recent_date_command():
                print("📅 Date Awareness Check: Content contains date references", file=sys.stderr)
                print("⚠️  WARNING: You're writing date-sensitive content without verifying the current date!", file=sys.stderr)
                print("💡 Recommendation: Run 'date' command first to ensure accuracy", file=sys.stderr)
                print("", file=sys.stderr)
                print("🗓️  Common date hallucination patterns detected:", file=sys.stderr)
                print("   • Month/Year references (e.g., 'January 2025')", file=sys.stderr)
                print("   • Quarter references (e.g., 'Q1 2025')", file=sys.stderr)
                print("   • Relative dates (e.g., 'next quarter', 'by end of 2025')", file=sys.stderr)
                print("", file=sys.stderr)
                print("✅ To proceed accurately: Run the Bash tool with command 'date' first", file=sys.stderr)
                # Note: This is a warning, not a block - allows Claude to decide
                # If you want to enforce it, change to sys.exit(2)
        
        # Ensure log directory exists
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'pre_tool_use.json'
        
        # Read existing log data or initialize empty list
        if log_path.exists():
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []
        
        # Append new data
        log_data.append(input_data)
        
        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        sys.exit(0)
        
    except json.JSONDecodeError:
        # Gracefully handle JSON decode errors
        sys.exit(0)
    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)

if __name__ == '__main__':
    main()