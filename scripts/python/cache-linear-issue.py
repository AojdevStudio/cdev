#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "ruamel.yaml>=0.18",
#   "click>=8.1",
#   "rich>=13.0",
#   "httpx>=0.25.0"
# ]
# ///

"""Cache Linear issue data locally for offline decomposition"""

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

import click
import httpx
from rich.console import Console
from ruamel.yaml import YAML
from ruamel.yaml.scalarstring import LiteralScalarString

console = Console()

# Initialize ruamel.yaml with proper settings
yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 120
yaml.default_flow_style = False


def process_for_yaml(data: Any) -> Any:
    """Recursively process data to use literal strings for multiline content"""
    if isinstance(data, dict):
        return {k: process_for_yaml(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [process_for_yaml(item) for item in data]
    elif isinstance(data, str) and "\n" in data:
        # Use LiteralScalarString for multiline strings
        return LiteralScalarString(data)
    else:
        return data


def save_yaml(data: Dict[str, Any], filepath: Path) -> None:
    """Save data to YAML file with proper formatting"""
    # Process data to use literal strings for multiline content
    processed_data = process_for_yaml(data)

    with open(filepath, "w") as f:
        yaml.dump(processed_data, f)


def fetch_linear_issue(issue_id: str, api_key: str) -> Dict[str, Any]:
    """Fetch issue details from Linear API"""
    query = """
    query GetIssue($id: String!) {
        issue(id: $id) {
            id
            identifier
            title
            description
            priority
            priorityLabel
            state {
                name
            }
            assignee {
                name
                email
            }
            team {
                name
            }
            project {
                name
            }
            createdAt
            updatedAt
        }
    }
    """

    headers = {"Authorization": api_key, "Content-Type": "application/json"}

    variables = {"id": issue_id}

    response = httpx.post(
        "https://api.linear.app/graphql", json={"query": query, "variables": variables}, headers=headers, timeout=30.0
    )

    response.raise_for_status()
    data = response.json()

    # Check for GraphQL errors
    if "errors" in data:
        error_msg = data["errors"][0].get("message", "Unknown error")
        raise click.ClickException(f"Linear API error: {error_msg}")

    # Check if issue was found
    issue_data = data.get("data", {}).get("issue")
    if not issue_data:
        raise click.ClickException(f"Issue {issue_id} not found")

    return issue_data


@click.command()
@click.argument("issue_id")
@click.option("--format", type=click.Choice(["json", "yaml"]), default="yaml", help="Output format for cached data")
def main(issue_id: str, format: str) -> None:
    """Cache Linear issue data locally for offline decomposition

    Example: cache-linear-issue.py AOJ-63
    """
    # Check if LINEAR_API_KEY is set
    api_key = os.environ.get("LINEAR_API_KEY")
    if not api_key:
        console.print("[red]❌ LINEAR_API_KEY environment variable not set[/red]")
        console.print('   Run: export LINEAR_API_KEY="your_api_key"')
        sys.exit(1)

    # Create cache directory
    cache_dir = Path(".linear-cache")
    cache_dir.mkdir(exist_ok=True)

    console.print(f"[blue]🔍 Fetching Linear issue: {issue_id}[/blue]")

    try:
        # Fetch issue data
        issue_data = fetch_linear_issue(issue_id, api_key)

        # Save to cache file
        if format == "yaml":
            cache_file = cache_dir / f"{issue_id}.yaml"
            save_yaml(issue_data, cache_file)
        else:
            cache_file = cache_dir / f"{issue_id}.json"
            with open(cache_file, "w") as f:
                json.dump(issue_data, f, indent=2)

        # Extract and display key info
        title = issue_data.get("title", "Unknown")
        priority = issue_data.get("priorityLabel") or issue_data.get("priority", "Unknown")
        status = issue_data.get("state", {}).get("name", "Unknown")
        assignee = issue_data.get("assignee", {}).get("name", "Unassigned")

        console.print("[green]✅ Issue cached successfully![/green]")
        console.print(f"📋 Title: {title}")
        console.print(f"🎯 Priority: {priority}")
        console.print(f"📊 Status: {status}")
        console.print(f"👤 Assignee: {assignee}")
        console.print(f"💾 Cached to: {cache_file}")

        # Show description preview (first 100 chars)
        description = issue_data.get("description", "No description")
        preview = description[:100] + "..." if len(description) > 100 else description
        console.print(f"📝 Description: {preview}")

        console.print()
        console.print(f"[green]🚀 Now you can run: cdev split {issue_id}[/green]")

    except httpx.HTTPError as e:
        console.print(f"[red]❌ Failed to fetch from Linear API: {e}[/red]")
        sys.exit(1)
    except click.ClickException as e:
        console.print(f"[red]❌ {e}[/red]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")
        sys.exit(1)


if __name__ == "__main__":
    main.main(standalone_mode=True)
