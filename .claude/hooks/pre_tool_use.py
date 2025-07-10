#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
import re
import os
import hashlib
import time
from pathlib import Path

def is_dangerous_rm_command(command):
    """
    Comprehensive detection of dangerous rm commands.
    Matches various forms of rm -rf and similar destructive patterns.
    """
    # Normalize command by removing extra spaces and converting to lowercase
    normalized = ' '.join(command.lower().split())
    
    # Pattern 1: Standard rm -rf variations
    patterns = [
        r'\brm\s+.*-[a-z]*r[a-z]*f',  # rm -rf, rm -fr, rm -Rf, etc.
        r'\brm\s+.*-[a-z]*f[a-z]*r',  # rm -fr variations
        r'\brm\s+--recursive\s+--force',  # rm --recursive --force
        r'\brm\s+--force\s+--recursive',  # rm --force --recursive
        r'\brm\s+-r\s+.*-f',  # rm -r ... -f
        r'\brm\s+-f\s+.*-r',  # rm -f ... -r
    ]
    
    # Check for dangerous patterns
    for pattern in patterns:
        if re.search(pattern, normalized):
            return True
    
    # Pattern 2: Check for rm with recursive flag targeting dangerous paths
    dangerous_paths = [
        r'/',           # Root directory
        r'/\*',         # Root with wildcard
        r'~',           # Home directory
        r'~/',          # Home directory path
        r'\$HOME',      # Home environment variable
        r'\.\.',        # Parent directory references
        r'\*',          # Wildcards in general rm -rf context
        r'\.',          # Current directory
        r'\.\s*$',      # Current directory at end of command
    ]
    
    if re.search(r'\brm\s+.*-[a-z]*r', normalized):  # If rm has recursive flag
        for path in dangerous_paths:
            if re.search(path, normalized):
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
    Prevents creation/editing of command files without reading template first.
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

def check_template_understanding(template_file):
    """Check if the template has been read and understanding confirmed"""
    
    # Create a session state directory
    session_dir = Path.home() / '.claude' / 'session_state'
    session_dir.mkdir(parents=True, exist_ok=True)
    
    # State file for template understanding
    state_file = session_dir / 'template_understanding.json'
    
    # Check recent understanding confirmation
    if state_file.exists():
        try:
            with open(state_file, 'r') as f:
                state = json.load(f)
            
            # Check if understanding was confirmed recently (within 24 hours)
            last_confirmation = state.get('last_confirmation', 0)
            template_hash = state.get('template_hash', '')
            
            # Get current template hash
            current_hash = get_file_hash(template_file)
            
            # If template unchanged and confirmed recently, allow access
            if (template_hash == current_hash and 
                time.time() - last_confirmation < 86400):  # 24 hours
                return True
                
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    
    # Check if understanding was just echoed in recent logs
    return check_recent_understanding_confirmation(template_file, state_file)

def check_recent_understanding_confirmation(template_file, state_file):
    """Check logs for recent understanding confirmation"""
    
    # Look for recent echo of understanding
    log_paths = [
        Path.home() / '.claude' / 'logs' / 'chat.json',
        Path('logs/chat.json'),
        Path('../logs/chat.json')
    ]
    
    understanding_phrases = [
        "I have read and understood the custom command template requirements",
        "I understand the custom command template requirements",
        "I have read and understand the template",
        "Template requirements understood"
    ]
    
    for log_path in log_paths:
        if log_path.exists():
            try:
                # Check last 10 minutes of logs
                cutoff_time = time.time() - 600  # 10 minutes
                
                with open(log_path, 'r') as f:
                    content = f.read()
                    
                    # Check if any understanding phrase exists in recent content
                    # Simple approach: check if phrases exist in the log file
                    content_lower = content.lower()
                    for phrase in understanding_phrases:
                        if phrase.lower() in content_lower:
                            # Save confirmation state
                            save_understanding_confirmation(template_file, state_file)
                            return True
            except (FileNotFoundError, PermissionError):
                continue
    
    return False

def save_understanding_confirmation(template_file, state_file):
    """Save the understanding confirmation state"""
    state = {
        'last_confirmation': time.time(),
        'template_hash': get_file_hash(template_file),
        'template_path': template_file
    }
    
    try:
        with open(state_file, 'w') as f:
            json.dump(state, f)
    except (FileNotFoundError, PermissionError):
        pass

def get_file_hash(file_path):
    """Get SHA256 hash of file content"""
    try:
        with open(file_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    except (FileNotFoundError, PermissionError):
        return ""

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
        
        # Check for dangerous rm -rf commands
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            
            # Block rm -rf commands with comprehensive pattern matching
            if is_dangerous_rm_command(command):
                print("BLOCKED: Dangerous rm command detected and prevented", file=sys.stderr)
                sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Check for .claude/commands/ file access
        if is_command_file_access(tool_name, tool_input):
            file_path = tool_input.get('file_path', '')
            print(f"🔒 Command Template Guard: Checking access to {file_path}", file=sys.stderr)
            
            # Template file to read
            template_file = find_template_file()
            if not template_file:
                print("❌ Error: Custom command template not found!", file=sys.stderr)
                print("📝 Expected: ai-docs/custom-command-template.md", file=sys.stderr)
                sys.exit(2)
            
            # Check if template has been read and understood
            if not check_template_understanding(template_file):
                print("❌ BLOCKED: You must read and understand the custom command template first!", file=sys.stderr)
                print(f"📖 Please read: {template_file}", file=sys.stderr)
                print("💡 After reading, confirm understanding by echoing:", file=sys.stderr)
                print("   'I have read and understood the custom command template requirements'", file=sys.stderr)
                print("", file=sys.stderr)
                print("🔑 Key requirements from template:", file=sys.stderr)
                print("   • 6-part structure: YAML frontmatter, heading, description, arguments, instructions, context", file=sys.stderr)
                print("   • Use action verbs and keep descriptions under 80 characters", file=sys.stderr)
                print("   • Include dynamic data gathering with ! commands", file=sys.stderr)
                print("   • Reference files with @ syntax", file=sys.stderr)
                print("   • Follow consistent naming and formatting patterns", file=sys.stderr)
                sys.exit(2)
            
            print("✅ Template understanding confirmed. Access granted.", file=sys.stderr)
        
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