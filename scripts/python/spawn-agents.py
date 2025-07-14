#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0"]
# ///
"""Enhanced Parallel Agent Spawning System
Creates multiple isolated Git worktrees with proper environment for parallel Claude development
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import click
import yaml
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

console = Console()


def run_command(cmd: List[str], check: bool = True, capture_output: bool = True) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    return subprocess.run(cmd, check=check, capture_output=capture_output, text=True)


def load_deployment_plan(file_path: str) -> Dict[str, Any]:
    """Load and parse the deployment plan from JSON file."""
    path = Path(file_path)
    if not path.exists():
        console.print(f"[red]❌ Deployment plan not found: {file_path}[/red]")
        sys.exit(1)

    with open(path) as f:
        return json.load(f)


def get_unique_agents(plan: Dict[str, Any]) -> List[str]:
    """Extract unique agent IDs from the deployment plan."""
    agents = []
    for agent in plan.get("parallelAgents", []):
        agent_id = agent.get("agentId")
        if agent_id and agent_id not in agents:
            agents.append(agent_id)
    return agents


def create_agent_context(plan: Dict[str, Any], agent_id: str, branch_name: str, worktree_path: str) -> Dict[str, Any]:
    """Generate agent-specific context data."""
    agent_data = [a for a in plan.get("parallelAgents", []) if a.get("agentId") == agent_id]

    # Extract unique values from all instances
    all_files_to_create = list(set(sum((a.get("filesToCreate", []) for a in agent_data), [])))
    all_files_to_modify = list(set(sum((a.get("filesToModify", []) for a in agent_data), [])))
    all_test_contracts = list(set(sum((a.get("testContracts", []) for a in agent_data), [])))
    all_validation_criteria = list(set(sum((a.get("validationCriteria", []) for a in agent_data), [])))
    all_dependencies = list(set(sum((a.get("dependencies", []) for a in agent_data), [])))

    return {
        "agentId": agent_id,
        "taskId": plan.get("taskId"),
        "taskTitle": plan.get("taskTitle"),
        "branchName": branch_name,
        "workTreePath": worktree_path,
        "agentInstances": agent_data,
        "dependencies": all_dependencies,
        "allFilesToCreate": all_files_to_create,
        "allFilesToModify": all_files_to_modify,
        "allTestContracts": all_test_contracts,
        "allValidationCriteria": all_validation_criteria,
        "canStartImmediately": all(len(a.get("dependencies", [])) == 0 for a in agent_data),
        "estimatedTime": sum(int(a.get("estimatedTime", 0)) for a in agent_data),
        "createdAt": datetime.now().isoformat(),
    }


def copy_config_files(source_dir: Path, target_dir: Path):
    """Copy essential configuration files to the worktree."""
    # Copy .env files
    for env_file in [".env", ".env.local", ".env.development"]:
        source = source_dir / env_file
        if source.exists():
            target = target_dir / env_file
            target.write_text(source.read_text())
            console.print(f"      → {env_file}")

    # Copy IDE configuration directories
    for config_dir in [".claude", ".cursor", ".vscode"]:
        source = source_dir / config_dir
        if source.exists() and source.is_dir():
            target = target_dir / config_dir
            if not target.exists():
                target.mkdir(parents=True)
            # Simple recursive copy
            subprocess.run(["cp", "-r", str(source) + "/.", str(target)], check=True)
            console.print(f"      → {config_dir}/")


def create_agent_files(workspace_dir: Path, agent_context: Dict[str, Any], agent_data: List[Dict[str, Any]]):
    """Create agent-specific files in the workspace."""
    # Write agent context as YAML
    context_file = workspace_dir / "agent_context.yaml"
    with open(context_file, "w") as f:
        yaml.dump(agent_context, f, default_flow_style=False, sort_keys=False)

    # Create files to work on list
    files_list = []
    for a in agent_data:
        files_list.extend([f"CREATE: {f}" for f in a.get("filesToCreate", [])])
        files_list.extend([f"MODIFY: {f}" for f in a.get("filesToModify", [])])

    files_to_work = workspace_dir / "files_to_work_on.txt"
    files_to_work.write_text("\n".join(sorted(set(files_list))))

    # Create test contracts list
    test_contracts = list(set(sum((a.get("testContracts", []) for a in agent_data), [])))
    test_file = workspace_dir / "test_contracts.txt"
    test_file.write_text("\n".join(test_contracts))

    # Create validation checklist
    validation_criteria = list(set(sum((a.get("validationCriteria", []) for a in agent_data), [])))
    checklist = workspace_dir / "validation_checklist.txt"
    checklist_content = "\n".join([f"{i + 1}. [ ] {criteria}" for i, criteria in enumerate(validation_criteria)])
    checklist.write_text(checklist_content)


def create_coordination_status(coordination_dir: Path, plan: Dict[str, Any], agents: List[str], task_id: str):
    """Create coordination status file."""
    status_data = {
        "taskId": plan.get("taskId"),
        "taskTitle": plan.get("taskTitle"),
        "totalAgents": len(agents),
        "agents": [],
        "createdAt": datetime.now().isoformat(),
        "lastUpdated": datetime.now().isoformat(),
    }

    for agent_id in agents:
        agent_info = {
            "agentId": agent_id,
            "branchName": f"{task_id}-{agent_id}",
            "status": "spawned",
            "canStartImmediately": True,  # Simplified for now
            "dependencies": [],
            "startedAt": None,
            "completedAt": None,
        }

        # Get dependencies for this agent
        for pa in plan.get("parallelAgents", []):
            if pa.get("agentId") == agent_id:
                deps = pa.get("dependencies", [])
                if deps:
                    agent_info["dependencies"].extend(deps)
                    agent_info["canStartImmediately"] = False

        agent_info["dependencies"] = list(set(agent_info["dependencies"]))
        status_data["agents"].append(agent_info)

    status_file = coordination_dir / "parallel-agent-status.yaml"
    with open(status_file, "w") as f:
        yaml.dump(status_data, f, default_flow_style=False, sort_keys=False)


@click.command()
@click.argument("deployment_plan", type=click.Path(exists=True))
def spawn_agents(deployment_plan: str):
    """Spawn parallel agents from a deployment plan."""
    console.print("[bold blue]🚀 Enhanced Parallel Agent Spawning System[/bold blue]")
    console.print(f"📋 Reading deployment plan: {deployment_plan}")

    # Load deployment plan
    plan = load_deployment_plan(deployment_plan)
    task_id = plan.get("taskId", "unknown")
    task_title = plan.get("taskTitle", "Unknown Task")

    console.print(f"🎯 Task: {task_id} - {task_title}")

    # Get unique agents
    agents = get_unique_agents(plan)
    console.print(f"🤖 Found {len(agents)} unique agents to spawn: {', '.join(agents)}")

    # Setup directories
    project_name = Path.cwd().name
    worktrees_dir = Path.cwd().parent / f"{project_name}-work-trees"
    coordination_dir = worktrees_dir / "coordination"

    console.print(f"📁 Project: {project_name}")

    # Create directories
    worktrees_dir.mkdir(exist_ok=True)
    coordination_dir.mkdir(exist_ok=True)

    console.print(f"📂 Work-trees directory: {worktrees_dir}")
    console.print("")
    console.print("[bold]🌿 Creating Git worktrees for each agent...[/bold]")
    console.print("")

    # Create worktrees with progress
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
        for agent_id in agents:
            task = progress.add_task(f"Processing agent: {agent_id}", total=None)

            branch_name = f"{task_id}-{agent_id}"
            worktree_path = worktrees_dir / branch_name

            console.print(f"🔄 Processing agent: {agent_id}")
            console.print(f"   📍 Branch: {branch_name}")
            console.print(f"   📂 Path: {worktree_path}")

            if worktree_path.exists():
                console.print("   [yellow]⚠️  Worktree already exists, skipping...[/yellow]")
                progress.remove_task(task)
                continue

            # Create worktree
            console.print("   🌱 Creating worktree...")
            run_command(["git", "worktree", "add", "-b", branch_name, str(worktree_path)])

            # Setup workspace
            console.print("   📋 Setting up agent workspace...")
            workspace_dir = worktree_path / "workspaces" / agent_id
            workspace_dir.mkdir(parents=True, exist_ok=True)

            # Copy configuration files
            console.print("   📄 Copying configuration files...")
            copy_config_files(Path.cwd(), worktree_path)

            # Generate agent context
            console.print("   📝 Generating agent context...")
            agent_data = [a for a in plan.get("parallelAgents", []) if a.get("agentId") == agent_id]
            agent_context = create_agent_context(plan, agent_id, branch_name, str(worktree_path))

            # Create agent files
            console.print("   📁 Generating file lists...")
            create_agent_files(workspace_dir, agent_context, agent_data)

            console.print("   [green]✅ Agent {agent_id} workspace ready![/green]")

            # Try to open Cursor
            try:
                cursor_check = run_command(["which", "cursor"], check=False)
                if cursor_check.returncode == 0:
                    console.print(f"   🚀 Opening Cursor in: {worktree_path}")
                    subprocess.Popen(["cursor", str(worktree_path)])
                else:
                    console.print(f"   📝 Manually open your editor in: {worktree_path}")
            except Exception:
                console.print(f"   📝 Manually open your editor in: {worktree_path}")

            progress.remove_task(task)
            console.print("")

    # Create coordination status
    console.print("📊 Setting up coordination system...")
    create_coordination_status(coordination_dir, plan, agents, task_id)

    # Summary
    console.print("")
    console.print("[bold green]✅ All agent worktrees created successfully![/bold green]")
    console.print("")

    # Create summary table
    table = Table(title="Summary", show_header=True, header_style="bold magenta")
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Task", task_id)
    table.add_row("Agents", str(len(agents)))
    table.add_row("Worktrees", str(worktrees_dir))
    table.add_row("Coordination", str(coordination_dir))

    console.print(table)

    console.print("\n[bold]🔄 Next Steps:[/bold]")
    console.print("   1. ✅ Cursor instances opened automatically for each agent")
    console.print("   2. In each Cursor window:")
    console.print("      - Open terminal (Ctrl+` or Cmd+`)")
    console.print("      - Run: claude")
    console.print("      - Feed Claude the agent context from workspaces/{agent_id}/agent_context.yaml")
    console.print("   3. Use the generated file lists and validation criteria to guide development")
    console.print("")
    console.print("[bold green]🎯 Parallel Development Environment Ready![/bold green]")
    console.print("   Each agent has isolated workspace with specific tasks and dependencies")
    console.print("   Cursor instances are opening automatically - start coding immediately!")


if __name__ == "__main__":
    spawn_agents()
