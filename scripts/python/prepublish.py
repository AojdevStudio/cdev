#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0"]
# ///

"""Prepublish script for Enhanced Claude Code Hooks distribution system

This script runs before publishing to NPM and performs:
- Validation of package.json
- Verification of required files
- Build process validation
- Distribution readiness checks
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import click
import yaml
from rich.console import Console
from rich.theme import Theme

# Custom theme for output
custom_theme = Theme({"info": "green", "warn": "yellow", "error": "red bold"})

console = Console(theme=custom_theme)

PROJECT_ROOT = Path(__file__).parent.parent.parent
REQUIRED_FILES = ["package.json", "README.md", "CHANGELOG.md", "LICENSE", "CLAUDE.md"]

REQUIRED_SCRIPTS = [
    "scripts/python/cache-linear-issue.py",
    "scripts/python/decompose-parallel.py",
    "scripts/python/spawn-agents.py",
]


def log(message: str, level: str = "info") -> None:
    """Log message with timestamp and appropriate styling"""
    timestamp = datetime.now().isoformat()
    icons = {"info": "✅", "warn": "⚠️", "error": "❌"}
    icon = icons.get(level, "ℹ️")
    console.print(f"{icon} [{timestamp}] {message}", style=level)


def validate_package_json() -> Dict[str, Any]:
    """Validate package.json file and its contents"""
    log("Validating package.json...")

    package_path = PROJECT_ROOT / "package.json"
    if not package_path.exists():
        raise FileNotFoundError("package.json not found")

    with open(package_path) as f:
        pkg = json.load(f)

    # Check required fields
    required_fields = ["name", "version", "description", "main", "keywords", "license"]
    for field in required_fields:
        if not pkg.get(field):
            raise ValueError(f"Missing required field in package.json: {field}")

    # Validate version format
    import re

    if not re.match(r"^\d+\.\d+\.\d+", pkg["version"]):
        raise ValueError(f"Invalid version format: {pkg['version']}")

    # Check if version is appropriate for distribution
    if pkg["version"] == "1.0.0" and not os.environ.get("FORCE_PUBLISH"):
        log("Publishing version 1.0.0 - ensure this is intentional", "warn")

    log(f"Package: {pkg['name']}@{pkg['version']}")
    return pkg


def validate_required_files() -> None:
    """Validate that all required files are present"""
    log("Validating required files...")

    missing = []

    for file in REQUIRED_FILES:
        file_path = PROJECT_ROOT / file
        if not file_path.exists():
            missing.append(file)

    if missing:
        raise FileNotFoundError(f"Missing required files: {', '.join(missing)}")

    log(f"All required files present: {', '.join(REQUIRED_FILES)}")


def validate_scripts() -> None:
    """Validate distribution scripts and ensure they're executable"""
    log("Validating distribution scripts...")

    missing = []

    for script in REQUIRED_SCRIPTS:
        script_path = PROJECT_ROOT / script
        if not script_path.exists():
            missing.append(script)
        # Check if Python scripts are executable
        elif script.endswith(".py"):
            if not os.access(script_path, os.X_OK):
                log(f"Making {script} executable...", "warn")
                script_path.chmod(script_path.stat().st_mode | 0o111)

    if missing:
        raise FileNotFoundError(f"Missing required scripts: {', '.join(missing)}")

    log("All distribution scripts present and executable")


def validate_build_status() -> None:
    """Validate build status and check for uncommitted changes"""
    log("Validating build status...")

    # Check if there are any uncommitted changes
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"], check=False, capture_output=True, text=True, cwd=PROJECT_ROOT
        )

        if result.stdout.strip() and not os.environ.get("ALLOW_DIRTY"):
            raise RuntimeError("Working directory has uncommitted changes. Use ALLOW_DIRTY=1 to override.")
    except FileNotFoundError:
        log("Git not found - skipping git status check", "warn")
    except subprocess.CalledProcessError as e:
        if "not a git repository" in str(e):
            log("Not a git repository - skipping git status check", "warn")
        else:
            raise

    log("Build status validated")


def generate_distribution_manifest() -> Dict[str, Any]:
    """Generate distribution manifest file"""
    log("Generating distribution manifest...")

    package_path = PROJECT_ROOT / "package.json"
    with open(package_path) as f:
        pkg = json.load(f)

    manifest = {
        "package": pkg["name"],
        "version": pkg["version"],
        "publishedAt": datetime.now().isoformat(),
        "distribution": {
            "type": "global-npx-package",
            "entryPoint": pkg["main"],
            "keywords": pkg["keywords"],
            "scripts": [
                {"name": Path(script).name, "path": script, "executable": script.endswith(".py")}
                for script in REQUIRED_SCRIPTS
            ],
        },
        "validation": {
            "filesValidated": len(REQUIRED_FILES),
            "scriptsValidated": len(REQUIRED_SCRIPTS),
            "buildClean": True,
        },
    }

    manifest_path = PROJECT_ROOT / "dist-manifest.yaml"
    with open(manifest_path, "w") as f:
        yaml.dump(manifest, f, default_flow_style=False)

    log(f"Distribution manifest generated: {manifest_path}")
    return manifest


def to_yaml(success: bool, pkg: Dict[str, Any] = None, error: str = None) -> str:
    """Export validation results as YAML"""
    results = {
        "prepublish_validation": {
            "status": "success" if success else "failed",
            "timestamp": datetime.now().isoformat(),
            "package": pkg.get("name") if pkg else None,
            "version": pkg.get("version") if pkg else None,
            "checks_performed": [
                "package_json_validation",
                "required_files_check",
                "scripts_validation",
                "build_status_check",
                "manifest_generation",
            ],
        }
    }

    if error:
        results["prepublish_validation"]["error"] = error

    return yaml.dump(results, default_flow_style=False)


@click.command()
@click.option(
    "--output-format", type=click.Choice(["console", "yaml"]), default="console", help="Output format for results"
)
def main(output_format: str):
    """Run prepublish validation for CDEV package"""
    pkg = None
    success = False
    error_msg = None

    try:
        log("🚀 Starting prepublish validation...")

        # Run all validation steps
        pkg = validate_package_json()
        validate_required_files()
        validate_scripts()
        validate_build_status()

        # Generate distribution manifest
        generate_distribution_manifest()

        log("✅ Prepublish validation completed successfully!")
        log(f"Ready to publish: {pkg['name']}@{pkg['version']}")

        success = True

    except Exception as error:
        error_msg = str(error)
        log(f"Prepublish validation failed: {error_msg}", "error")

    finally:
        if output_format == "yaml":
            print(to_yaml(success, pkg, error_msg))

        # Exit with appropriate code
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
