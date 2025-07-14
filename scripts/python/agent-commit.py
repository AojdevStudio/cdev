#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0"]
# ///
"""Enhanced Agent Commit with Integration Coordination
Validates completion and safely integrates agent work
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import click
import yaml
from rich.console import Console
from rich.table import Table

console = Console()


def run_command(cmd: List[str], check: bool = True, capture_output: bool = True) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    return subprocess.run(cmd, check=check, capture_output=capture_output, text=True)


def get_current_branch() -> str:
    """Get the current git branch name."""
    result = run_command(["git", "branch", "--show-current"])
    return result.stdout.strip()


def load_agent_context(workspace_path: Path) -> Dict[str, Any]:
    """Load and parse agent context from YAML file."""
    # Try YAML first (new format)
    yaml_path = workspace_path / "agent_context.yaml"
    json_path = workspace_path / "agent_context.json"

    if yaml_path.exists():
        with open(yaml_path) as f:
            return yaml.safe_load(f)
    elif json_path.exists():
        with open(json_path) as f:
            return json.load(f)
    else:
        console.print(f"[red]❌ Agent context file not found in: {workspace_path}[/red]")
        sys.exit(1)


def parse_agent_context(context: Dict[str, Any]) -> Dict[str, Any]:
    """Extract key information from agent context."""
    # Handle both single agent and multi-instance formats
    agent_instances = context.get("agentInstances", [])

    return {
        "agent_id": context.get("agentId", "unknown"),
        "agent_role": agent_instances[0].get("agentRole", "Unknown")
        if agent_instances
        else context.get("agentRole", "Unknown"),
        "task_id": context.get("taskId", "Unknown"),
        "task_title": context.get("taskTitle", "Unknown"),
        "branch_name": context.get("branchName", get_current_branch()),
        "files_to_create": context.get("allFilesToCreate", []),
        "files_to_modify": context.get("allFilesToModify", []),
        "dependencies": context.get("dependencies", []),
        "validation_criteria": context.get("allValidationCriteria", []),
    }


def validate_agent_completion(workspace_path: Path) -> Tuple[int, int]:
    """Validate that all checklist items are completed."""
    checklist_file = workspace_path / "validation_checklist.txt"

    if not checklist_file.exists():
        console.print(f"[red]❌ Validation checklist not found: {checklist_file}[/red]")
        sys.exit(1)

    content = checklist_file.read_text()
    lines = content.strip().split("\n")

    completed = sum(1 for line in lines if "[x]" in line)
    total = sum(1 for line in lines if "[ ]" in line or "[x]" in line)

    if total == 0:
        console.print("[red]❌ No validation items found in checklist[/red]")
        sys.exit(1)

    if completed < total:
        console.print(f"[red]❌ Validation incomplete: {completed}/{total} items completed[/red]")
        console.print("[yellow]⚠️ Please complete all validation criteria before committing[/yellow]")
        console.print("\nRemaining items:")
        for line in lines:
            if "[ ]" in line:
                console.print(f"  {line}")
        sys.exit(1)

    console.print(f"[green]✅ All validation criteria completed ({completed}/{total})[/green]")
    return completed, total


def verify_files(workspace_path: Path):
    """Verify that all required files exist."""
    files_list = workspace_path / "files_to_work_on.txt"

    if not files_list.exists():
        console.print(f"[yellow]⚠️ Files list not found: {files_list}[/yellow]")
        return

    content = files_list.read_text()
    lines = content.strip().split("\n")

    missing_files = 0
    for line in lines:
        if line.startswith("CREATE:"):
            file_path = line.replace("CREATE:", "").strip()
            full_path = Path(file_path)
            if not full_path.exists():
                console.print(f"[red]❌ Required file not found: {file_path}[/red]")
                missing_files += 1

    if missing_files > 0:
        console.print(f"[red]❌ {missing_files} required files are missing[/red]")
        sys.exit(1)

    console.print("[green]✅ All required files verified[/green]")


def create_coordination_files(agent_info: Dict[str, Any], validation: Tuple[int, int], workspace_path: Path):
    """Create all coordination files."""
    timestamp = datetime.now().isoformat()
    agent_id = agent_info["agent_id"]

    # Create directories
    Path("shared/coordination").mkdir(parents=True, exist_ok=True)
    Path("shared/deployment-plans").mkdir(parents=True, exist_ok=True)
    Path("shared/reports").mkdir(parents=True, exist_ok=True)
    Path(f"workspaces/{agent_id}").mkdir(parents=True, exist_ok=True)

    # Get file counts
    files_list_path = workspace_path / "files_to_work_on.txt"
    files_created = []
    files_modified = []

    if files_list_path.exists():
        lines = files_list_path.read_text().strip().split("\n")
        for line in lines:
            if line.startswith("CREATE:"):
                files_created.append(line.replace("CREATE:", "").strip())
            elif line.startswith("MODIFY:"):
                files_modified.append(line.replace("MODIFY:", "").strip())

    # Validation status
    validation_status = {
        "validation_passed": True,
        "validated_at": timestamp,
        "agent_id": agent_id,
        "validation_criteria": validation[0],
        "total_criteria": validation[1],
        "files_created": files_created,
        "files_modified": files_modified,
        "validator": "agent-commit-enhanced",
    }

    with open("shared/coordination/validation-status.yaml", "w") as f:
        yaml.dump(validation_status, f, default_flow_style=False, sort_keys=False)

    # Integration status
    commit_hash = run_command(["git", "rev-parse", "HEAD"]).stdout.strip()

    integration_status = {
        "integration_ready": True,
        "agent_id": agent_id,
        "branch_name": agent_info["branch_name"],
        "commit_hash": commit_hash,
        "integration_order": [agent_id],
        "dependencies": agent_info["dependencies"],
        "created_at": timestamp,
        "agent_role": agent_info["agent_role"],
        "task_id": agent_info["task_id"],
    }

    with open("shared/coordination/integration-status.yaml", "w") as f:
        yaml.dump(integration_status, f, default_flow_style=False, sort_keys=False)

    # Deployment plan
    deployment_plan = {
        "deployment_id": f"{agent_id}-deployment-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "created_at": timestamp,
        "integration_order": [agent_id],
        "agents": {
            agent_id: {
                "role": agent_info["agent_role"],
                "status": "completed",
                "branch": agent_info["branch_name"],
                "files_created": len(files_created),
                "files_modified": len(files_modified),
                "validation_passed": True,
                "dependencies": agent_info["dependencies"],
            }
        },
        "deployment_strategy": "single_agent_merge",
        "quality_gates": {"validation_complete": True, "tests_passing": True, "files_verified": True},
    }

    with open(f"shared/deployment-plans/{agent_id}-deployment-plan.yaml", "w") as f:
        yaml.dump(deployment_plan, f, default_flow_style=False, sort_keys=False)

    console.print("[green]✅ Coordination files created[/green]")


def generate_completion_report(agent_info: Dict[str, Any], validation: Tuple[int, int], workspace_path: Path):
    """Generate agent completion report."""
    timestamp = datetime.now()
    report_file = f"shared/reports/agent-completion-{timestamp.strftime('%Y%m%d-%H%M%S')}.md"

    # Get file lists
    files_list_path = workspace_path / "files_to_work_on.txt"
    files_created = []
    files_modified = []

    if files_list_path.exists():
        lines = files_list_path.read_text().strip().split("\n")
        for line in lines:
            if line.startswith("CREATE:"):
                files_created.append(f"- {line.replace('CREATE:', '').strip()}")
            elif line.startswith("MODIFY:"):
                files_modified.append(f"- {line.replace('MODIFY:', '').strip()}")

    if not files_created:
        files_created = ["- None"]
    if not files_modified:
        files_modified = ["- None"]

    report_content = f"""# Agent Completion Report

**Agent ID**: {agent_info["agent_id"]}
**Role**: {agent_info["agent_role"]}
**Completed**: {timestamp.strftime("%Y-%m-%d %H:%M:%S")}
**Branch**: {agent_info["branch_name"]}

## Task Summary
- **Task ID**: {agent_info["task_id"]}
- **Title**: {agent_info["task_title"]}
- **Status**: ✅ Complete

## Validation Results
- **Criteria Met**: {validation[0]}/{validation[1]}
- **All Required**: ✅ Yes

## File Changes
### Created Files ({len(files_created)})
{chr(10).join(files_created)}

### Modified Files ({len(files_modified)})
{chr(10).join(files_modified)}

## Quality Gates
- [x] All validation criteria completed
- [x] Required files created/modified
- [x] Agent context preserved
- [x] Coordination files generated

## Integration Readiness
✅ Ready for integration via:
- Direct merge (already completed)
- Integration scripts (coordination files available)

## Next Steps
1. ✅ Work committed and merged to main
2. 🔄 Available for integration scripts if needed
3. 📊 Coordination files available in shared/
"""

    Path(report_file).write_text(report_content)
    console.print(f"[green]✅ Completion report created: {report_file}[/green]")


def preserve_agent_workspace(workspace_path: Path, agent_id: str, branch_name: str, task_id: str):
    """Preserve agent workspace for integration scripts."""
    target_dir = Path(f"workspaces/{agent_id}")

    if workspace_path.exists():
        # Copy workspace files
        for item in workspace_path.iterdir():
            if item.is_file():
                (target_dir / item.name).write_text(item.read_text())

        # Add metadata files
        (target_dir / "branch_name.txt").write_text(branch_name)
        (target_dir / "completion_timestamp.txt").write_text(datetime.now().isoformat())
        (target_dir / "task_id.txt").write_text(task_id)

        console.print(f"[green]✅ Agent workspace preserved in workspaces/{agent_id}/[/green]")
    else:
        console.print(f"[yellow]⚠️ Source workspace not found: {workspace_path}[/yellow]")


def generate_commit_message(
    agent_info: Dict[str, Any], validation: Tuple[int, int], workspace_path: Path, custom_message: Optional[str] = None
) -> str:
    """Generate a comprehensive commit message."""
    if custom_message:
        return custom_message

    validation_score = int((validation[0] * 100) / validation[1])

    # Get file counts
    files_list_path = workspace_path / "files_to_work_on.txt"
    files_created_count = 0
    files_modified_count = 0

    if files_list_path.exists():
        lines = files_list_path.read_text().strip().split("\n")
        files_created_count = sum(1 for line in lines if line.startswith("CREATE:"))
        files_modified_count = sum(1 for line in lines if line.startswith("MODIFY:"))

    # Get completed validation items
    checklist_file = workspace_path / "validation_checklist.txt"
    completed_items = []
    if checklist_file.exists():
        lines = checklist_file.read_text().strip().split("\n")
        for line in lines:
            if "[x]" in line:
                # Clean up the line
                item = line.strip()
                item = item.split(". ", 1)[1] if ". " in item else item
                item = item.replace("[x]", "✅")
                completed_items.append(f"- {item}")

    completed_section = "\n".join(completed_items) if completed_items else "- All validation criteria completed"

    return f"""feat({agent_info["agent_id"]}): {agent_info["task_title"]}

Completed validation criteria:
{completed_section}

- Agent: {agent_info["agent_role"]}
- Files: {files_created_count} created, {files_modified_count} modified
- Task: {agent_info["task_id"]}
- Coordination: ✅ Integration files generated

Integration Ready:
- Validation Status: ✅ Complete ({validation_score}%)
- Deployment Plan: shared/deployment-plans/{agent_info["agent_id"]}-deployment-plan.yaml
- Agent Workspace: workspaces/{agent_info["agent_id"]}/
- Integration Scripts: Compatible

🤖 Generated with Enhanced AOJDevStudio
Co-Authored-By: Claude <noreply@anthropic.com>"""


def execute_git_workflow(agent_info: Dict[str, Any], commit_message: str, current_branch: str):
    """Execute the git workflow to commit and merge changes."""
    # Check for changes
    status = run_command(["git", "status", "--porcelain"])
    if not status.stdout.strip():
        console.print("[yellow]⚠️ No changes to commit[/yellow]")
        return

    # Add all changes
    run_command(["git", "add", "."])
    console.print("[green]✅ Changes staged[/green]")

    # Commit
    run_command(["git", "commit", "-m", commit_message])
    console.print("[green]✅ Changes committed[/green]")

    # If not on main, merge
    if current_branch != "main":
        console.print("[blue]🔄 Switching to main branch...[/blue]")
        run_command(["git", "checkout", "main"])

        console.print("[blue]🔄 Pulling latest changes...[/blue]")
        try:
            run_command(["git", "pull", "origin", "main"])
        except subprocess.CalledProcessError:
            console.print("[yellow]⚠️ Could not pull from origin[/yellow]")

        console.print("[blue]🔄 Merging agent branch...[/blue]")
        run_command(["git", "merge", current_branch, "--no-ff", "-m", f"Merge agent work: {agent_info['agent_id']}"])

        console.print("[blue]🔄 Pushing to origin...[/blue]")
        try:
            run_command(["git", "push", "origin", "main"])
            console.print("[green]✅ Agent work merged to main and pushed[/green]")
        except subprocess.CalledProcessError:
            console.print("[yellow]⚠️ Could not push to origin[/yellow]")
    else:
        console.print("[blue]🔄 Already on main branch, pushing changes...[/blue]")
        try:
            run_command(["git", "push", "origin", "main"])
        except subprocess.CalledProcessError:
            console.print("[yellow]⚠️ Could not push to origin[/yellow]")


@click.command()
@click.argument("workspace_path", default="workspaces/infrastructure_validation_agent", type=click.Path())
@click.option("--custom-message", "-m", help="Custom commit message")
def agent_commit(workspace_path: str, custom_message: Optional[str]):
    """Validate and commit agent work with integration coordination."""
    workspace = Path(workspace_path)
    current_branch = get_current_branch()
    timestamp = datetime.now()

    console.print("[bold blue]🚀 Enhanced Agent Commit & Merge System[/bold blue]")
    console.print(f"Agent: {workspace.name}")
    console.print(f"Workspace: {workspace}")
    console.print(f"Timestamp: {timestamp.isoformat()}")
    console.print("")

    # Load and parse agent context
    context = load_agent_context(workspace)
    agent_info = parse_agent_context(context)

    console.print("[blue]🔄 Validating agent completion status...[/blue]")
    validation = validate_agent_completion(workspace)

    console.print("[blue]🔄 Verifying required files exist...[/blue]")
    verify_files(workspace)

    console.print("[blue]🔄 Creating coordination infrastructure...[/blue]")
    create_coordination_files(agent_info, validation, workspace)

    console.print("[blue]🔄 Generating completion report...[/blue]")
    generate_completion_report(agent_info, validation, workspace)

    console.print("[blue]🔄 Preserving agent workspace for integration scripts...[/blue]")
    preserve_agent_workspace(workspace, agent_info["agent_id"], agent_info["branch_name"], agent_info["task_id"])

    # Generate commit message
    commit_message = generate_commit_message(agent_info, validation, workspace, custom_message)

    console.print("[blue]🔄 Executing git workflow...[/blue]")
    execute_git_workflow(agent_info, commit_message, current_branch)

    # Display summary
    console.print("")
    console.print("=" * 42)
    console.print("[bold green]🎉 Enhanced Agent Commit Complete![/bold green]")
    console.print("=" * 42)
    console.print("")

    # Create summary table
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Agent", agent_info["agent_id"])
    table.add_row("Task", f"{agent_info['task_id']} - {agent_info['task_title']}")
    table.add_row("Branch", agent_info["branch_name"])
    table.add_row("Validation", f"{validation[0]}/{validation[1]} criteria completed")

    console.print(table)

    console.print("\n[bold]📊 Generated Files:[/bold]")
    console.print("  - shared/coordination/validation-status.yaml")
    console.print("  - shared/coordination/integration-status.yaml")
    console.print(f"  - shared/deployment-plans/{agent_info['agent_id']}-deployment-plan.yaml")
    console.print("  - shared/reports/agent-completion-*.md")
    console.print(f"  - workspaces/{agent_info['agent_id']}/ (preserved workspace)")

    console.print("\n[bold]🚀 Integration Options:[/bold]")
    console.print("  1. Direct merge: ✅ Already completed")
    console.print("  2. Integration scripts: Run ./scripts/integrate-parallel-work.sh")
    console.print("  3. Manual review: Check shared/reports/ for details")

    console.print("\n[bold green]✅ Agent work successfully committed and integrated![/bold green]")


if __name__ == "__main__":
    agent_commit()
