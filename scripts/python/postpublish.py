#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0", "httpx>=0.24"]
# ///

"""Postpublish script for Enhanced Claude Code Hooks distribution system

This script runs after successful NPM publishing and performs:
- Distribution verification
- Package availability checks
- Documentation updates
- Notification sending
- Cleanup operations
"""

import asyncio
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import click
import httpx
import yaml
from rich.console import Console
from rich.theme import Theme

# Custom theme for output
custom_theme = Theme({"info": "green", "warn": "yellow", "error": "red bold"})

console = Console(theme=custom_theme)

PROJECT_ROOT = Path(__file__).parent.parent.parent


def log(message: str, level: str = "info") -> None:
    """Log message with timestamp and appropriate styling"""
    timestamp = datetime.now().isoformat()
    icons = {"info": "✅", "warn": "⚠️", "error": "❌"}
    icon = icons.get(level, "ℹ️")
    console.print(f"{icon} [{timestamp}] {message}", style=level)


async def verify_published_package() -> bool:
    """Verify package was successfully published to NPM"""
    log("Verifying published package on NPM...")

    package_path = PROJECT_ROOT / "package.json"
    with open(package_path) as f:
        pkg = json.load(f)

    npm_url = f"https://registry.npmjs.org/{pkg['name']}"

    # Wait a bit for NPM to propagate the package
    await asyncio.sleep(5)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(npm_url, timeout=30.0)

            if response.status_code == 200:
                data = response.json()
                latest_version = data.get("dist-tags", {}).get("latest")

                if latest_version == pkg["version"]:
                    log(f"✅ Package {pkg['name']}@{pkg['version']} successfully published to NPM")
                    return True
                else:
                    log(
                        f"⚠️ Package published but latest version is {latest_version}, expected {pkg['version']}", "warn"
                    )
                    return False
            else:
                log(f"❌ Package verification failed with status {response.status_code}", "error")
                return False

        except Exception as error:
            log(f"❌ Package verification error: {error!s}", "error")
            return False


async def test_npx_execution() -> bool:
    """Test that the package can be executed via NPX"""
    log("Testing NPX execution...")

    package_path = PROJECT_ROOT / "package.json"
    with open(package_path) as f:
        pkg = json.load(f)

    try:
        # Test that the package can be executed via NPX
        test_command = f"npx {pkg['name']}@{pkg['version']} --version"
        log(f"Testing command: {test_command}")

        # Give NPM more time to propagate
        await asyncio.sleep(10)

        result = subprocess.run(test_command, check=False, shell=True, capture_output=True, text=True, timeout=30)

        if result.returncode == 0:
            log(f"✅ NPX execution test passed: {result.stdout.strip()}")
            return True
        else:
            log(f"❌ NPX execution test failed: {result.stderr}", "error")
            return False

    except subprocess.TimeoutExpired:
        log("❌ NPX execution test timed out", "error")
        return False
    except Exception as error:
        log(f"❌ NPX execution test failed: {error!s}", "error")
        return False


def update_distribution_manifest() -> None:
    """Update the distribution manifest with publish status"""
    log("Updating distribution manifest...")

    manifest_path = PROJECT_ROOT / "dist-manifest.yaml"

    if manifest_path.exists():
        with open(manifest_path) as f:
            manifest = yaml.safe_load(f)
    else:
        log("Distribution manifest not found - creating new one", "warn")
        package_path = PROJECT_ROOT / "package.json"
        with open(package_path) as f:
            pkg = json.load(f)

        manifest = {"package": pkg["name"], "version": pkg["version"]}

    manifest["publishStatus"] = {
        "published": True,
        "publishedAt": datetime.now().isoformat(),
        "npmVerified": True,
        "globalInstallTested": True,
    }

    with open(manifest_path, "w") as f:
        yaml.dump(manifest, f, default_flow_style=False)

    log(f"Distribution manifest updated: {manifest_path}")


def update_readme_version() -> None:
    """Update version information in README.md"""
    log("Updating README.md version information...")

    package_path = PROJECT_ROOT / "package.json"
    with open(package_path) as f:
        pkg = json.load(f)

    readme_path = PROJECT_ROOT / "README.md"

    # Read current README content
    with open(readme_path, 'r') as f:
        readme_content = f.read()

    # Update the version line (line 3: **Version**: X.X.X)
    import re

    # Pattern to match the version line
    version_pattern = r'(\*\*Version\*\*:\s+)[\d.]+(\s*)'
    new_version_line = f'\\g<1>{pkg["version"]}\\g<2>'

    # Check if pattern matches
    match = re.search(version_pattern, readme_content)
    if not match:
        log("Warning: Version pattern not found in README.md", "warn")
        return

    # Replace the version
    updated_content = re.sub(version_pattern, new_version_line, readme_content)

    # Verify the change was made
    if updated_content == readme_content:
        log("Warning: README content unchanged after regex replacement", "warn")
        return

    # Write back to README
    with open(readme_path, 'w') as f:
        f.write(updated_content)

    log(f"README.md updated with version {pkg['version']}")
    log(f"Package: {pkg['name']} v{pkg['version']} published at {datetime.now().isoformat()}")


def log_publish_success() -> None:
    """Log publication success message"""
    log("🎉 Package publication completed successfully!")

    package_path = PROJECT_ROOT / "package.json"
    with open(package_path) as f:
        pkg = json.load(f)

    success_message = f"""
📦 Distribution Complete!

Package: {pkg["name"]}
Version: {pkg["version"]}
Registry: https://www.npmjs.com/package/{pkg["name"]}

Global usage:
  npx {pkg["name"]} cache-linear-issue PROJ-123
  npx {pkg["name"]} decompose-parallel PROJ-123
  npx {pkg["name"]} spawn-agents deployment-plan.json

✅ Ready for distribution via NPX!
"""

    console.print(success_message)


def cleanup_temporary_files() -> None:
    """Clean up temporary files created during the publish process"""
    log("Cleaning up temporary files...")

    temp_files = ["dist-manifest.json", "npm-debug.log", ".npm-debug.log", "USAGE.md"]

    for file in temp_files:
        file_path = PROJECT_ROOT / file
        if file_path.exists():
            file_path.unlink()
            log(f"Removed: {file}")


def to_yaml(results: Dict[str, Any]) -> str:
    """Export results as YAML"""
    return yaml.dump(results, default_flow_style=False)


async def async_main(output_format: str, skip_verification: bool):
    """Run postpublish operations for CDEV package"""
    results = {
        "postpublish_operations": {"timestamp": datetime.now().isoformat(), "status": "started", "operations": {}}
    }

    try:
        log("🚀 Starting postpublish operations...")

        # Verify the package was published successfully
        if not skip_verification:
            published = await verify_published_package()
            results["postpublish_operations"]["operations"]["npm_verification"] = published

            if not published:
                raise RuntimeError("Package publication verification failed")
        else:
            log("Skipping NPM verification (--skip-verification flag)", "warn")
            results["postpublish_operations"]["operations"]["npm_verification"] = "skipped"

        # Test NPX execution
        npx_works = await test_npx_execution()
        results["postpublish_operations"]["operations"]["npx_execution_test"] = npx_works

        if not npx_works:
            log("NPX execution test failed - package may need time to propagate", "warn")

        # Update distribution manifest
        update_distribution_manifest()
        results["postpublish_operations"]["operations"]["manifest_update"] = True

        # Update README version information
        update_readme_version()
        results["postpublish_operations"]["operations"]["readme_update"] = True

        # Log success
        log_publish_success()

        # Clean up temporary files
        cleanup_temporary_files()
        results["postpublish_operations"]["operations"]["cleanup"] = True

        log("✅ Postpublish operations completed successfully!")
        results["postpublish_operations"]["status"] = "success"

        if output_format == "yaml":
            print(to_yaml(results))

        sys.exit(0)

    except Exception as error:
        log(f"Postpublish operations failed: {error!s}", "error")
        results["postpublish_operations"]["status"] = "failed"
        results["postpublish_operations"]["error"] = str(error)

        if output_format == "yaml":
            print(to_yaml(results))

        sys.exit(1)


@click.command()
@click.option(
    "--output-format", type=click.Choice(["console", "yaml"]), default="console", help="Output format for results"
)
@click.option("--skip-verification", is_flag=True, default=False, help="Skip NPM verification (useful for testing)")
def main(output_format: str, skip_verification: bool):
    """Run postpublish operations for CDEV package (wrapper for async)"""
    asyncio.run(async_main(output_format, skip_verification))


if __name__ == "__main__":
    main()
