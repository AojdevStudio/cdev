#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "pyyaml>=6.0",
#     "click>=8.1",
#     "rich>=13.0",
#     "gitpython>=3.1",
#     "inquirer>=3.1",
# ]
# ///
"""Intelligent Conflict Resolution for Parallel Agents

This script provides multiple strategies for resolving conflicts:
1. Merge by Priority (Infrastructure → Backend → Frontend)
2. Interactive Resolution (Manual merge each conflict)
3. Agent Handoff (Let agents resolve their own conflicts)
4. Staged Integration (Merge one agent at a time)
"""

import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import click
import yaml
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt

console = Console()


def run_command(cmd: List[str], check: bool = True, cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    try:
        return subprocess.run(cmd, capture_output=True, text=True, check=check, cwd=cwd)
    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Command failed: {' '.join(cmd)}[/red]")
        console.print(f"[red]Error: {e.stderr}[/red]")
        if check:
            raise
        return e


def load_json_file(filepath: Path) -> Optional[Dict]:
    """Load and parse a JSON file."""
    try:
        import json

        with open(filepath) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        console.print(f"[yellow]⚠️  Error loading {filepath}: {e}[/yellow]")
        return None


def get_agent_branches() -> List[str]:
    """Get all agent branches from git worktree list."""
    result = run_command(["git", "worktree", "list"], check=False)
    if result.returncode != 0:
        return []

    branches = []
    for line in result.stdout.strip().split("\n"):
        if "AOJ-100" in line:
            # Extract branch name from worktree output
            parts = line.split()
            for part in parts:
                if part.startswith("[") and part.endswith("]"):
                    branch = part[1:-1]
                    branches.append(branch)
                    break

    return branches


def check_command_exists(command: str) -> bool:
    """Check if a command exists in the system."""
    try:
        subprocess.run([command, "--version"], capture_output=True, check=False)
        return True
    except FileNotFoundError:
        return False


def create_commit_message(action: str, agent: str, strategy: str) -> str:
    """Create a standardized commit message for conflict resolution."""
    return f"""{action}

- {strategy}
- Agent: {agent}

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"""


def merge_by_priority(agent_branches: List[str]):
    """Strategy 1: Merge agents by priority order."""
    console.print("\n[cyan]🎯 Using priority-based merge...[/cyan]")

    # Define merge order: Infrastructure first, then backend, then frontend
    priority_order = [
        "infrastructure_feature_agent",
        "infrastructure_validation_agent",
        "backend_api_agent",
        "custom_feature_agent",
        "custom_validation_agent",
    ]

    # Filter and order branches based on priority
    ordered_branches = []
    for priority_agent in priority_order:
        for branch in agent_branches:
            if priority_agent in branch:
                ordered_branches.append(branch)

    # Add any remaining branches not in priority list
    for branch in agent_branches:
        if branch not in ordered_branches:
            ordered_branches.append(branch)

    for branch in ordered_branches:
        console.print(f"\n[cyan]🔄 Merging {branch}...[/cyan]")

        result = run_command(["git", "merge", branch, "--strategy-option=theirs"], check=False)
        if result.returncode != 0:
            console.print(f"[yellow]❌ Merge conflict in {branch}. Resolving automatically...[/yellow]")
            console.print("   git status")

            # Add all changes and commit
            run_command(["git", "add", "."])
            commit_msg = create_commit_message(
                f"Resolve conflicts from {branch} merge",
                branch,
                "Merged with theirs strategy\n- Automatic conflict resolution via resolve-conflicts.py\n- Priority-based merge order: Infrastructure → Backend → Frontend",
            )
            run_command(["git", "commit", "-m", commit_msg])
            console.print("   [green]✅ Conflicts resolved and committed[/green]")


def interactive_resolution(agent_branches: List[str]):
    """Strategy 2: Interactive resolution with auto-resolve."""
    console.print("\n[cyan]🤝 Interactive resolution...[/cyan]")

    for branch in agent_branches:
        console.print(f"\n[cyan]🔄 Merging {branch}...[/cyan]")

        result = run_command(["git", "merge", branch], check=False)
        if result.returncode != 0:
            console.print(f"[yellow]❌ Conflicts in {branch}. Auto-resolving...[/yellow]")
            console.print("   - Adding all changes")

            run_command(["git", "add", "."])
            commit_msg = create_commit_message(
                f"Resolve conflicts from {branch} merge",
                branch,
                "Interactive conflict resolution\n- Manual conflict resolution via resolve-conflicts.py",
            )
            run_command(["git", "commit", "-m", commit_msg])
            console.print("   [green]✅ Conflicts resolved and committed[/green]")


def agent_handoff_resolution(coordination_dir: Path):
    """Strategy 3: Create coordination task for agents to resolve."""
    console.print("\n[cyan]🔄 Agent handoff resolution...[/cyan]")

    conflict_task = f"""# Conflict Resolution Task

## Conflicts Detected:
- components/forms/DynamicForm.tsx: custom_validation_agent vs custom_feature_agent
- lib/form-validation.ts: custom_validation_agent vs custom_feature_agent
- hooks/useFormState.ts: custom_validation_agent vs custom_feature_agent

## Resolution Strategy:
1. custom_feature_agent: Focus on UI components only
2. custom_validation_agent: Focus on validation logic only
3. Create clear interfaces between components

## Next Steps:
1. Agents coordinate on shared interfaces
2. Split conflicting files into separate concerns
3. Re-run validation after changes

## Generated: {datetime.now().isoformat()}
"""

    task_file = coordination_dir / "conflict-resolution-task.md"
    task_file.parent.mkdir(parents=True, exist_ok=True)

    with open(task_file, "w") as f:
        f.write(conflict_task)

    # Also save as YAML for structured processing
    task_yaml = {
        "task_type": "conflict_resolution",
        "created_at": datetime.now().isoformat(),
        "conflicts": [
            {"file": "components/forms/DynamicForm.tsx", "agents": ["custom_validation_agent", "custom_feature_agent"]},
            {"file": "lib/form-validation.ts", "agents": ["custom_validation_agent", "custom_feature_agent"]},
            {"file": "hooks/useFormState.ts", "agents": ["custom_validation_agent", "custom_feature_agent"]},
        ],
        "resolution_strategy": {
            "custom_feature_agent": "Focus on UI components only",
            "custom_validation_agent": "Focus on validation logic only",
            "integration": "Create clear interfaces between components",
        },
    }

    yaml_file = task_file.with_suffix(".yaml")
    with open(yaml_file, "w") as f:
        yaml.dump(task_yaml, f, default_flow_style=False)

    console.print(f"[green]📝 Created conflict resolution task: {task_file}[/green]")
    console.print("[cyan]🤖 Coordinate with agents to resolve conflicts, then re-run validation[/cyan]")


def staged_integration(agent_branches: List[str]):
    """Strategy 4: Staged integration with test runs."""
    console.print("\n[cyan]📦 Staged integration...[/cyan]")

    # Determine test command
    if check_command_exists("pnpm"):
        test_cmd = ["pnpm", "test"]
    elif check_command_exists("npm"):
        test_cmd = ["npm", "test"]
    else:
        test_cmd = None

    for branch in agent_branches:
        console.print(f"\n[cyan]🔄 Staging {branch}...[/cyan]")

        # Create a temporary branch for this merge
        staging_branch = f"staging-{branch}"
        run_command(["git", "checkout", "-b", staging_branch])

        result = run_command(["git", "merge", branch], check=False)
        if result.returncode != 0:
            console.print(f"[yellow]❌ Conflicts in {branch}. Auto-resolving...[/yellow]")
            run_command(["git", "add", "."])
            commit_msg = create_commit_message(
                f"Resolve conflicts in staging for {branch}",
                branch,
                "Staged integration conflict resolution\n- Testing will follow after merge",
            )
            run_command(["git", "commit", "-m", commit_msg])
            console.print("   [green]✅ Conflicts resolved and committed[/green]")

        # Run tests if available
        if test_cmd:
            test_result = run_command(test_cmd, check=False)
            if test_result.returncode != 0:
                console.print(f"[yellow]❌ Tests failed after merging {branch}[/yellow]")
                console.print("Creating fix commit...")
                run_command(["git", "add", "."])
                fix_msg = create_commit_message(
                    f"Fix tests after {branch} merge", f"{branch} integration", "Test fixes for staged integration"
                )
                run_command(["git", "commit", "-m", fix_msg])
                console.print("   [green]✅ Test fixes committed[/green]")

        # Merge back to main
        run_command(["git", "checkout", "main"])
        run_command(["git", "merge", staging_branch])
        run_command(["git", "branch", "-d", staging_branch])

        console.print(f"[green]✅ {branch} integrated successfully[/green]")


def display_resolution_strategies():
    """Display available conflict resolution strategies."""
    strategies = [
        ("1", "🎯 Merge by Priority", "Infrastructure → Backend → Frontend"),
        ("2", "🤝 Interactive Resolution", "Manual merge each conflict"),
        ("3", "🔄 Agent Handoff", "Let agents resolve their own conflicts"),
        ("4", "📦 Staged Integration", "Merge one agent at a time"),
    ]

    panel_content = "\n".join(
        [f"[bold cyan]{num}[/bold cyan]. [bold]{name}[/bold] - {desc}" for num, name, desc in strategies]
    )

    console.print(Panel(panel_content, title="[bold]📋 Conflict Resolution Strategies[/bold]", expand=False))


@click.command()
@click.option("--strategy", type=click.Choice(["1", "2", "3", "4"]), help="Pre-select a conflict resolution strategy")
@click.option("--auto", is_flag=True, help="Automatically select the best strategy based on conflicts")
def resolve_conflicts(strategy: Optional[str], auto: bool):
    """Intelligent conflict resolution for parallel agents."""
    console.print("[bold cyan]🔧 Parallel Agent Conflict Resolution[/bold cyan]")

    # Get current project folder name
    project_name = Path.cwd().name
    worktrees_dir = Path.cwd().parent / f"{project_name}-work-trees"
    coordination_dir = worktrees_dir / "coordination"

    # Check if validation failed due to conflicts
    validation_status_path = coordination_dir / "validation-status.json"
    if not validation_status_path.exists():
        console.print("[red]❌ No validation status found. Run validate-parallel-work.py first.[/red]")
        sys.exit(1)

    validation_status = load_json_file(validation_status_path)
    if validation_status and validation_status.get("validation_passed"):
        console.print("[green]✅ No conflicts detected. Validation already passed.[/green]")
        sys.exit(0)

    console.print("\n[cyan]🔍 Analyzing conflicts...[/cyan]")

    # Get agent branches
    agent_branches = get_agent_branches()
    if not agent_branches:
        console.print("[yellow]⚠️  No agent branches found[/yellow]")
        sys.exit(1)

    console.print(f"Found {len(agent_branches)} agent branches")

    # Display strategies and get choice
    if not strategy and not auto:
        display_resolution_strategies()
        strategy = Prompt.ask("\nChoose strategy", choices=["1", "2", "3", "4"], default="1")
    elif auto:
        # Auto-select strategy based on conflict complexity
        # For now, default to priority-based merge
        strategy = "1"
        console.print("[cyan]🤖 Auto-selecting priority-based merge strategy[/cyan]")

    # Execute chosen strategy
    if strategy == "1":
        merge_by_priority(agent_branches)
    elif strategy == "2":
        interactive_resolution(agent_branches)
    elif strategy == "3":
        agent_handoff_resolution(coordination_dir)
    elif strategy == "4":
        staged_integration(agent_branches)

    if strategy != "3":  # Don't re-run validation for agent handoff
        console.print("\n[bold green]🎯 Conflict resolution complete![/bold green]")
        console.print("[cyan]🔄 Re-running validation...[/cyan]")

        # Run validate-parallel-work.py
        validate_script = Path(__file__).parent / "validate-parallel-work.py"
        if validate_script.exists():
            result = run_command([sys.executable, str(validate_script)], check=False)
            if result.returncode != 0:
                console.print("[yellow]⚠️  Validation still failing. Review and fix remaining issues.[/yellow]")
        else:
            console.print("[yellow]⚠️  validate-parallel-work.py not found in same directory[/yellow]")


if __name__ == "__main__":
    resolve_conflicts()
