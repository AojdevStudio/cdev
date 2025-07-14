#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pyyaml>=6.0",
#   "click>=8.1",
#   "rich>=13.0"
# ]
# ///

"""Local testing script for CDEV package"""

import shutil
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

import click
import yaml
from rich.console import Console
from rich.panel import Panel

console = Console()


def run_command(args: List[str], cwd: Optional[Path] = None, check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return the result"""
    result = subprocess.run(args, capture_output=True, text=True, cwd=cwd, check=False)
    if check and result.returncode != 0:
        raise click.ClickException(f"Command failed: {' '.join(args)}\n{result.stderr}")
    return result


def run_git(args: List[str], cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
    """Run git command"""
    return run_command(["git"] + args, cwd=cwd)


def print_status(success: bool, message: str) -> None:
    """Print status message"""
    if success:
        console.print(f"[green]✅ {message}[/green]")
    else:
        console.print(f"[red]❌ {message}[/red]")
        sys.exit(1)


def save_yaml(data: dict, filepath: Path) -> None:
    """Save data to YAML file"""
    with open(filepath, "w") as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False)


@click.command()
@click.option("--clean", is_flag=True, help="Clean up test environment after running")
@click.option("--skip-link", is_flag=True, help="Skip npm linking step")
def main(clean: bool, skip_link: bool) -> None:
    """Local testing script for CDEV package"""
    console.print(Panel.fit("🧪 CDEV Local Testing Script", style="bold blue"))

    # Get directories
    cdev_dir = Path(__file__).parent.parent.parent.resolve()
    test_dir = Path.home() / "cdev-test-project"

    console.print(f"\n[yellow]📁 CDEV Directory:[/yellow] {cdev_dir}")
    console.print(f"[yellow]🧪 Test Directory:[/yellow] {test_dir}")

    if clean:
        console.print("\n[yellow]Cleaning up test environment...[/yellow]")
        if cdev_dir.exists():
            try:
                run_command(["npm", "unlink"], cwd=cdev_dir, check=False)
            except:
                pass
        if test_dir.exists():
            shutil.rmtree(test_dir)
        console.print("[green]✅ Cleanup complete[/green]")
        return

    # Step 1: Create test project
    console.print("\n[yellow]Step 1: Creating test project...[/yellow]")
    if test_dir.exists():
        console.print("Test project already exists. Removing...")
        shutil.rmtree(test_dir)

    test_dir.mkdir(parents=True)
    run_git(["init", "--quiet"], cwd=test_dir)
    run_command(["npm", "init", "-y", "--quiet"], cwd=test_dir)
    print_status(True, "Test project created")

    # Create test files
    src_dir = test_dir / "src"
    src_dir.mkdir()
    (src_dir / "index.js").write_text("console.log('Hello from test project');")
    (test_dir / "README.md").write_text("# CDEV Test Project")
    print_status(True, "Test files created")

    # Step 2: Link CDEV package
    if not skip_link:
        console.print("\n[yellow]Step 2: Linking CDEV package...[/yellow]")
        run_command(["npm", "link"], cwd=cdev_dir)
        print_status(True, "CDEV linked globally")

        run_command(["npm", "link", "cdev"], cwd=test_dir)
        print_status(True, "CDEV linked to test project")
    else:
        console.print("\n[yellow]Step 2: Skipping npm link (--skip-link flag)[/yellow]")

    # Step 3: Copy necessary files
    console.print("\n[yellow]Step 3: Copying hooks and scripts...[/yellow]")
    shutil.copytree(cdev_dir / ".claude", test_dir / ".claude")
    shutil.copytree(cdev_dir / "scripts", test_dir / "scripts")

    # Make scripts executable
    for script in (test_dir / "scripts").glob("*.sh"):
        script.chmod(0o755)
    print_status(True, "Files copied and permissions set")

    # Step 4: Set up environment
    console.print("\n[yellow]Step 4: Setting up environment...[/yellow]")
    env_content = """LINEAR_API_KEY=lin_api_test_key_12345
LLM_MODEL=mistralai/mistral-large-2411
ENGINEER_NAME=TestEngineer
"""
    (test_dir / ".env").write_text(env_content)
    print_status(True, "Environment file created")

    # Step 5: Test commands
    console.print("\n[yellow]Step 5: Testing CDEV commands...[/yellow]")

    # Test help
    console.print("\n[yellow]Testing: cdev help[/yellow]")
    result = run_command(["cdev", "help"], cwd=test_dir, check=False)
    print_status(result.returncode == 0, "Help command works")
    if result.returncode == 0:
        console.print(result.stdout)

    # Test version
    console.print("\n[yellow]Testing: cdev --version[/yellow]")
    result = run_command(["cdev", "--version"], cwd=test_dir, check=False)
    print_status(result.returncode == 0, "Version command works")
    if result.returncode == 0:
        console.print(result.stdout)

    # Test status (should work even without worktrees)
    console.print("\n[yellow]Testing: cdev status[/yellow]")
    result = run_command(["cdev", "status"], cwd=test_dir, check=False)
    console.print("[green]✅ Status command works[/green]")
    if result.stdout:
        console.print(result.stdout)

    # Step 6: Create mock Linear issue
    console.print("\n[yellow]Step 6: Creating mock Linear issue...[/yellow]")
    cache_dir = test_dir / ".linear-cache"
    cache_dir.mkdir()

    mock_issue = {
        "id": "TEST-123",
        "title": "Test Issue for Local Development",
        "description": "1. Create authentication system\n2. Add user management\n3. Implement API endpoints\n4. Write tests",
        "priority": 1,
        "state": {"name": "In Progress"},
        "assignee": {"name": "Test User"},
    }

    # Save as YAML instead of JSON
    save_yaml(mock_issue, cache_dir / "TEST-123.yaml")
    print_status(True, "Mock Linear issue created")

    # Test decomposition
    console.print("\n[yellow]Testing: cdev split TEST-123[/yellow]")
    result = run_command(["cdev", "split", "TEST-123"], cwd=test_dir, check=False)
    print_status(result.returncode == 0, "Decomposition works")

    # Check if deployment plan was created
    deployment_plan_path = test_dir / "shared/deployment-plans/test-123-deployment-plan.yaml"
    if deployment_plan_path.exists():
        console.print("[green]✅ Deployment plan created successfully[/green]")
        console.print("\n[yellow]Deployment plan preview:[/yellow]")
        content = deployment_plan_path.read_text()
        console.print(content[:500] + "..." if len(content) > 500 else content)
    else:
        # Check for JSON version as fallback
        json_path = test_dir / "shared/deployment-plans/test-123-deployment-plan.json"
        if json_path.exists():
            console.print("[yellow]⚠️  Deployment plan created as JSON (expected YAML)[/yellow]")
        else:
            console.print("[red]❌ Deployment plan not created[/red]")

    console.print("\n[green]🎉 Local testing completed successfully![/green]")
    console.print("\n[yellow]Next steps:[/yellow]")
    console.print(f"1. cd {test_dir}")
    console.print("2. Try: cdev run shared/deployment-plans/test-123-deployment-plan.yaml")
    console.print("3. Try: cdev status")
    console.print("4. When done, cleanup with: test-locally.py --clean")

    console.print("\n[yellow]To cleanup the test:[/yellow]")
    console.print("test-locally.py --clean")


if __name__ == "__main__":
    main()
