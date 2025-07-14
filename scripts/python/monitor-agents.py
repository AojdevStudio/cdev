#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0"]
# ///
"""Monitor parallel agent progress
Provides real-time status updates on agent development
"""

import json
import time
from pathlib import Path
from typing import Any, Dict, Optional

import click
import yaml
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

console = Console()


def load_coordination_status(coordination_dir: Path) -> Optional[Dict[str, Any]]:
    """Load parallel agent status from coordination file."""
    yaml_file = coordination_dir / "parallel-agent-status.yaml"
    json_file = coordination_dir / "parallel-agent-status.json"

    if yaml_file.exists():
        with open(yaml_file) as f:
            return yaml.safe_load(f)
    elif json_file.exists():
        with open(json_file) as f:
            return json.load(f)

    return None


def get_agent_progress(worktree_path: Path) -> Dict[str, Any]:
    """Get progress information for a single agent."""
    checklist_path = worktree_path / "validation_checklist.txt"

    if not checklist_path.exists():
        # Check in workspace subdirectories
        for workspace in worktree_path.glob("workspaces/*"):
            alt_checklist = workspace / "validation_checklist.txt"
            if alt_checklist.exists():
                checklist_path = alt_checklist
                break

    if checklist_path.exists():
        content = checklist_path.read_text()
        lines = content.strip().split("\n")

        completed = sum(1 for line in lines if "[x]" in line)
        total = sum(1 for line in lines if "[ ]" in line or "[x]" in line)

        if total > 0:
            progress = int((completed * 100) / total)
            return {
                "completed": completed,
                "total": total,
                "progress": progress,
                "status": "complete" if progress == 100 else "in_progress",
            }

    return {"completed": 0, "total": 0, "progress": 0, "status": "ready"}


def create_status_table(worktrees_dir: Path, coordination_status: Optional[Dict[str, Any]]) -> Table:
    """Create a status table for all agents."""
    table = Table(title="Parallel Agent Status", show_header=True, header_style="bold magenta")

    table.add_column("Agent", style="cyan", no_wrap=True)
    table.add_column("Branch", style="yellow")
    table.add_column("Status", style="green")
    table.add_column("Progress", style="blue")
    table.add_column("Tasks", style="magenta")
    table.add_column("Dependencies", style="red")

    # Get all agent worktrees
    agent_dirs = []
    for item in worktrees_dir.iterdir():
        if item.is_dir() and "-" in item.name:
            # Check if it's an agent worktree (contains task ID and agent name)
            parts = item.name.split("-")
            if len(parts) >= 2:
                agent_dirs.append(item)

    # Sort directories
    agent_dirs.sort(key=lambda x: x.name)

    # Process each agent
    for agent_dir in agent_dirs:
        agent_name = agent_dir.name
        progress_info = get_agent_progress(agent_dir)

        # Try to extract agent ID from directory name
        parts = agent_name.split("-")
        if len(parts) >= 2:
            agent_id = "-".join(parts[1:])  # Everything after task ID
        else:
            agent_id = agent_name

        # Get dependencies from coordination status if available
        dependencies = []
        can_start = True
        if coordination_status and "agents" in coordination_status:
            for agent_info in coordination_status["agents"]:
                if agent_info.get("agentId") == agent_id:
                    dependencies = agent_info.get("dependencies", [])
                    can_start = agent_info.get("canStartImmediately", True)
                    break

        # Determine status
        if progress_info["status"] == "complete":
            status_icon = "✅ Complete"
            status_style = "bold green"
        elif progress_info["status"] == "in_progress":
            status_icon = "⏳ In Progress"
            status_style = "yellow"
        elif not can_start and dependencies:
            status_icon = "⏸️  Blocked"
            status_style = "red"
        else:
            status_icon = "📦 Ready"
            status_style = "cyan"

        # Create progress bar
        if progress_info["total"] > 0:
            progress_bar = f"[{'█' * (progress_info['progress'] // 10)}{'░' * (10 - progress_info['progress'] // 10)}] {progress_info['progress']}%"
            tasks_str = f"{progress_info['completed']}/{progress_info['total']}"
        else:
            progress_bar = "[░░░░░░░░░░] 0%"
            tasks_str = "0/0"

        # Dependencies string
        deps_str = ", ".join(dependencies) if dependencies else "None"

        table.add_row(agent_id, agent_name, Text(status_icon, style=status_style), progress_bar, tasks_str, deps_str)

    return table


def create_summary_panel(worktrees_dir: Path, coordination_status: Optional[Dict[str, Any]]) -> Panel:
    """Create a summary panel with task information."""
    if coordination_status:
        task_id = coordination_status.get("taskId", "Unknown")
        task_title = coordination_status.get("taskTitle", "Unknown")
        total_agents = coordination_status.get("totalAgents", 0)

        # Calculate overall progress
        total_progress = 0
        completed_agents = 0

        for agent_info in coordination_status.get("agents", []):
            agent_info.get("agentId")
            branch_name = agent_info.get("branchName")

            # Find corresponding worktree
            for item in worktrees_dir.iterdir():
                if item.is_dir() and item.name == branch_name:
                    progress_info = get_agent_progress(item)
                    if progress_info["progress"] == 100:
                        completed_agents += 1
                    total_progress += progress_info["progress"]
                    break

        if total_agents > 0:
            overall_progress = int(total_progress / total_agents)
        else:
            overall_progress = 0

        summary_text = f"""[bold cyan]Task:[/bold cyan] {task_id} - {task_title}
[bold magenta]Total Agents:[/bold magenta] {total_agents}
[bold green]Completed:[/bold green] {completed_agents}/{total_agents}
[bold yellow]Overall Progress:[/bold yellow] {overall_progress}%"""
    else:
        summary_text = "[red]No coordination status file found[/red]"

    return Panel(summary_text, title="Task Summary", border_style="blue")


def monitor_loop(worktrees_dir: Path, coordination_dir: Path, refresh_interval: int = 2):
    """Main monitoring loop."""
    layout = Layout()

    with Live(layout, refresh_per_second=1, console=console):
        while True:
            try:
                # Load coordination status
                coordination_status = load_coordination_status(coordination_dir)

                # Create components
                summary_panel = create_summary_panel(worktrees_dir, coordination_status)
                status_table = create_status_table(worktrees_dir, coordination_status)

                # Update layout
                layout.split_column(Layout(summary_panel, size=7), Layout(status_table))

                time.sleep(refresh_interval)

            except KeyboardInterrupt:
                break
            except Exception as e:
                console.print(f"[red]Error: {e}[/red]")
                break


@click.command()
@click.option("--refresh", "-r", default=2, help="Refresh interval in seconds")
@click.option("--once", "-o", is_flag=True, help="Show status once and exit")
def monitor_agents(refresh: int, once: bool):
    """Monitor parallel agent progress."""
    console.print("[bold blue]🔍 Parallel Agent Status Monitor[/bold blue]")
    console.print("=" * 30)
    console.print("")

    # Setup directories
    project_name = Path.cwd().name
    worktrees_dir = Path.cwd().parent / f"{project_name}-work-trees"
    coordination_dir = worktrees_dir / "coordination"

    # Check if work-trees directory exists
    if not worktrees_dir.exists():
        console.print("[red]❌ No active agents found.[/red]")
        console.print("   Run 'cdev run <deployment-plan.json>' to spawn agents first.")
        console.print("")
        return

    if once:
        # Show status once and exit
        coordination_status = load_coordination_status(coordination_dir)

        summary_panel = create_summary_panel(worktrees_dir, coordination_status)
        status_table = create_status_table(worktrees_dir, coordination_status)

        console.print(summary_panel)
        console.print("")
        console.print(status_table)
        console.print("")
        console.print("[dim]Status snapshot taken[/dim]")
    else:
        # Continuous monitoring
        console.print("[dim]Press Ctrl+C to exit monitor[/dim]")
        console.print("")

        try:
            monitor_loop(worktrees_dir, coordination_dir, refresh)
        except KeyboardInterrupt:
            console.print("\n[yellow]Monitor stopped[/yellow]")


if __name__ == "__main__":
    monitor_agents()
