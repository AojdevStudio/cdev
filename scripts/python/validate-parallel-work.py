#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "pyyaml>=6.0",
#     "click>=8.1",
#     "rich>=13.0",
#     "python-dateutil>=2.8",
# ]
# ///
"""Parallel Work Validation - Contract Testing & Integration Readiness

This script validates parallel agent work by:
1. Discovering all spawned agents from workspace directories
2. Checking completion status based on markers or validation checklists
3. Validating test contracts for each agent
4. Checking for file conflicts between agents
5. Creating validation status report
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import click
import yaml
from rich.console import Console
from rich.table import Table
from rich.tree import Tree

console = Console()


def run_command(cmd: List[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    try:
        return subprocess.run(cmd, capture_output=True, text=True, check=check)
    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Command failed: {' '.join(cmd)}[/red]")
        console.print(f"[red]Error: {e.stderr}[/red]")
        if check:
            raise
        return e


def load_json_file(filepath: Path) -> Optional[Dict]:
    """Load and parse a JSON file."""
    try:
        with open(filepath) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        console.print(f"[yellow]⚠️  Error loading {filepath}: {e}[/yellow]")
        return None


def discover_agents(worktrees_dir: Path) -> Tuple[List[str], List[Path], Dict[str, Path]]:
    """Discover all spawned agents from workspace directories."""
    spawned_agents = []
    agent_worktrees = []
    agent_seen = set()
    agent_to_worktree = {}

    console.print("[cyan]📊 Discovering agents from workspace directories...[/cyan]")

    # Scan all worktree directories for workspace folders
    for worktree_path in worktrees_dir.iterdir():
        if worktree_path.is_dir() and worktree_path.name != "coordination":
            workspaces_dir = worktree_path / "workspaces"
            if workspaces_dir.exists():
                # Scan for agent workspace directories
                for workspace_path in workspaces_dir.iterdir():
                    if workspace_path.is_dir():
                        agent_id = workspace_path.name
                        context_file = workspace_path / "agent_context.json"

                        # Verify this is a valid agent workspace
                        if context_file.exists():
                            # Try to read actual agent ID from context
                            context_data = load_json_file(context_file)
                            if context_data and "agentId" in context_data:
                                final_agent_id = context_data["agentId"]
                            else:
                                final_agent_id = agent_id

                            # Only add if not already seen
                            if final_agent_id not in agent_seen:
                                spawned_agents.append(final_agent_id)
                                agent_worktrees.append(worktree_path)
                                agent_to_worktree[final_agent_id] = worktree_path
                                agent_seen.add(final_agent_id)
                                console.print(f"   Found agent: [green]{final_agent_id}[/green] in {worktree_path}")

    return spawned_agents, agent_worktrees, agent_to_worktree


def check_agent_completion(agent: str, worktree_path: Path) -> bool:
    """Check if an agent has completed its work."""
    workspace_dir = worktree_path / "workspaces" / agent

    # Check for completion marker
    if (workspace_dir / "COMPLETED").exists():
        return True

    # Check validation checklist
    checklist_file = workspace_dir / "validation_checklist.txt"
    if checklist_file.exists():
        try:
            with open(checklist_file) as f:
                content = f.read()
                # Count unchecked items
                unchecked_count = content.count("[ ]")
                return unchecked_count == 0
        except Exception:
            pass

    return False


def display_worktree_structure(worktrees_dir: Path):
    """Display the work-trees structure using rich Tree."""
    tree = Tree(f"[bold cyan]{worktrees_dir.name}/[/bold cyan]")

    for item in sorted(worktrees_dir.iterdir()):
        if item.is_dir():
            branch = tree.add(f"[blue]{item.name}/[/blue]")
            # Add subdirectories up to 2 levels deep
            for subitem in sorted(item.iterdir())[:5]:  # Limit to 5 items
                if subitem.is_dir():
                    subbranch = branch.add(f"[green]{subitem.name}/[/green]")
                    for subsubitem in sorted(subitem.iterdir())[:3]:  # Limit to 3 items
                        if subsubitem.is_dir():
                            subbranch.add(f"[yellow]{subsubitem.name}/[/yellow]")
                        else:
                            subbranch.add(f"{subsubitem.name}")
                else:
                    branch.add(f"{subitem.name}")

    console.print("\n[bold]🌳 Work-trees structure:[/bold]")
    console.print(tree)
    console.print()


def validate_agent_work(agent: str, worktree_path: Path) -> bool:
    """Validate an individual agent's work."""
    console.print(f"\n[cyan]🔬 Validating {agent}...[/cyan]")

    workspace_dir = worktree_path / "workspaces" / agent

    # Debug: Show paths being checked
    console.print(f"   🔍 Checking paths for {agent}:")
    console.print(f"      Worktree: {worktree_path}")
    console.print(f"      Workspace: {workspace_dir}")
    console.print(f"      Test contracts: {workspace_dir / 'test_contracts.txt'}")

    # Check if workspace directory exists
    if not workspace_dir.exists():
        console.print(f"   [red]❌ Workspace directory not found: {workspace_dir}[/red]")
        console.print("   🔍 Let's see what's actually in the worktree:")
        workspaces_path = worktree_path / "workspaces"
        if workspaces_path.exists():
            for item in workspaces_path.iterdir():
                console.print(f"      {item.name}")
        else:
            console.print("      No workspaces directory found")
        return False

    # Check if test contracts exist
    test_contracts_file = workspace_dir / "test_contracts.txt"
    if test_contracts_file.exists():
        console.print(f"   📋 Test contracts found: {test_contracts_file}")
        try:
            with open(test_contracts_file) as f:
                contract_count = len(f.readlines())
            console.print(f"   📊 Test contracts listed: {contract_count}")
        except Exception:
            pass
    else:
        console.print(f"   📝 No test contracts found for {agent}")

    console.print(f"   [green]✅ {agent} validation passed[/green]")
    return True


def check_file_conflicts(completed_agents: List[str], agent_to_worktree: Dict[str, Path]) -> bool:
    """Check for file conflicts between agents."""
    console.print("\n[cyan]🔍 Checking for file conflicts...[/cyan]")

    file_agents: Dict[str, str] = {}
    conflicts_found = False

    for agent in completed_agents:
        worktree_path = agent_to_worktree[agent]
        workspace_dir = worktree_path / "workspaces" / agent
        files_to_work_on = workspace_dir / "files_to_work_on.txt"

        if files_to_work_on.exists():
            try:
                with open(files_to_work_on) as f:
                    for line in f:
                        file = line.strip()
                        if file:
                            # Strip CREATE: or MODIFY: prefix if present
                            clean_file = file.replace("CREATE: ", "").replace("MODIFY: ", "")

                            if clean_file in file_agents:
                                console.print(
                                    f"[red]❌ Conflict: {clean_file} modified by both "
                                    f"{agent} and {file_agents[clean_file]}[/red]"
                                )
                                conflicts_found = True
                            else:
                                file_agents[clean_file] = agent
            except Exception:
                pass

    if not conflicts_found:
        console.print("[green]✅ No file conflicts detected[/green]")

    return conflicts_found


def create_validation_status(
    coordination_dir: Path, validation_passed: bool, completed_agents: List[str], worktrees_dir: Path
):
    """Create validation status in coordination directory."""
    coordination_dir.mkdir(parents=True, exist_ok=True)

    status = {
        "validation_passed": validation_passed,
        "validated_at": datetime.utcnow().isoformat() + "Z",
        "agents_validated": completed_agents if validation_passed else [],
        "ready_for_integration": validation_passed,
        "worktrees_dir": str(worktrees_dir),
        "coordination_dir": str(coordination_dir),
    }

    status_file = coordination_dir / "validation-status.json"
    with open(status_file, "w") as f:
        yaml.dump(status, f, default_flow_style=False)

    # Also save as JSON for compatibility
    status_json_file = coordination_dir / "validation-status.json"
    with open(status_json_file, "w") as f:
        json.dump(status, f, indent=2)


@click.command()
@click.option(
    "--worktrees-dir",
    type=click.Path(exists=False, path_type=Path),
    help="Override the default work-trees directory location",
)
@click.option("--show-structure/--no-show-structure", default=True, help="Display the work-trees directory structure")
def validate_parallel_work(worktrees_dir: Optional[Path], show_structure: bool):
    """Validate parallel agent work for integration readiness."""
    console.print("[bold cyan]🔍 Validating parallel agent work...[/bold cyan]")

    # Determine work-trees directory
    if not worktrees_dir:
        project_name = Path.cwd().name
        worktrees_dir = Path.cwd().parent / f"{project_name}-work-trees"

    coordination_dir = worktrees_dir / "coordination"

    # Check if work-trees directory exists
    if not worktrees_dir.exists():
        console.print(f"[red]❌ No work-trees directory found at: {worktrees_dir}[/red]")
        console.print("   Run spawn-agents.sh first to create agent workspaces.")
        sys.exit(1)

    # Check if coordination status exists
    status_file = coordination_dir / "parallel-agent-status.json"
    if not status_file.exists():
        console.print(f"[red]❌ No coordination status found at: {status_file}[/red]")
        console.print("   Run spawn-agents.sh first to create coordination system.")
        sys.exit(1)

    # Discover agents
    spawned_agents, agent_worktrees, agent_to_worktree = discover_agents(worktrees_dir)

    console.print(f"\n[bold]📊 Found {len(spawned_agents)} spawned agents:[/bold] {', '.join(spawned_agents)}")

    # Show work-trees structure if requested
    if show_structure and spawned_agents:
        display_worktree_structure(worktrees_dir)

    if not spawned_agents:
        console.print("[red]❌ No spawned agents found. Run spawn-agents.sh first.[/red]")
        sys.exit(1)

    # Check agent completion status
    completed_agents = []
    pending_agents = []

    for agent in spawned_agents:
        worktree_path = agent_to_worktree[agent]
        if check_agent_completion(agent, worktree_path):
            completed_agents.append(agent)
        else:
            pending_agents.append(agent)

    # Display status table
    table = Table(title="Agent Status Summary")
    table.add_column("Status", style="cyan")
    table.add_column("Count", justify="right")
    table.add_column("Agents")

    table.add_row("✅ Completed", str(len(completed_agents)), ", ".join(completed_agents) or "-")
    table.add_row("⏳ Pending", str(len(pending_agents)), ", ".join(pending_agents) or "-")

    console.print()
    console.print(table)

    if pending_agents:
        console.print("\n[red]❌ Validation cannot proceed. Pending agents:[/red]")
        for agent in pending_agents:
            console.print(f"   - {agent}")
        console.print("\n[yellow]💡 Wait for all agents to complete, then re-run validation.[/yellow]")
        console.print("   Agents are considered complete when:")
        console.print("   - A COMPLETED file exists in their workspace, OR")
        console.print("   - All items in validation_checklist.txt are checked off")
        sys.exit(1)

    # Validate each agent's work
    console.print("\n[bold cyan]🧪 Running agent contract validation...[/bold cyan]")
    validation_passed = True

    for agent in completed_agents:
        if not validate_agent_work(agent, agent_to_worktree[agent]):
            validation_passed = False

    # Run integration compatibility check
    console.print("\n[bold cyan]🔗 Running integration compatibility check...[/bold cyan]")
    conflicts_found = check_file_conflicts(completed_agents, agent_to_worktree)

    if conflicts_found:
        validation_passed = False

    # Create validation status
    create_validation_status(coordination_dir, validation_passed, completed_agents, worktrees_dir)

    # Final summary
    console.print()
    if validation_passed:
        console.print("[bold green]🎯 Parallel Work Validation: PASSED[/bold green]")
        console.print()
        console.print("[green]✅ Ready for integration: ./integrate-parallel-work.sh[/green]")
    else:
        console.print("[bold red]❌ Parallel Work Validation: FAILED[/bold red]")
        console.print()
        console.print("[yellow]🔧 Fix issues above before proceeding to integration.[/yellow]")
        sys.exit(1)


if __name__ == "__main__":
    validate_parallel_work()
