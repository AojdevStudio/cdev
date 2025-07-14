#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0", "pathlib>=1.0"]
# ///

"""Security check script for CDEV package publication
Ensures no sensitive data is included in the published package
"""

import json
import re
import sys
from pathlib import Path
from typing import List

import click
import yaml
from rich.console import Console
from rich.theme import Theme

# Custom theme for output
custom_theme = Theme({"info": "blue", "success": "green", "warning": "yellow", "error": "red bold"})

console = Console(theme=custom_theme)


class SecurityChecker:
    """Security checker for package publication"""

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.package_root = Path(__file__).parent.parent.parent

    def log(self, message: str, style: str = "info") -> None:
        """Log message with appropriate style"""
        icons = {"info": "ℹ️", "success": "✅", "warning": "⚠️", "error": "❌"}
        console.print(f"{icons.get(style, '')} {message}", style=style)

    def add_error(self, message: str) -> None:
        """Add error and log it"""
        self.errors.append(message)
        self.log(message, "error")

    def add_warning(self, message: str) -> None:
        """Add warning and log it"""
        self.warnings.append(message)
        self.log(message, "warning")

    def check_environment_files(self) -> None:
        """Check that environment files are properly excluded from version control"""
        self.log("Checking environment file exclusions...")

        env_files = [".env", ".env.local", ".env.production", ".env.development"]
        found_env_files = []

        # First, check which env files exist
        for env_file in env_files:
            file_path = self.package_root / env_file
            if file_path.exists():
                found_env_files.append(env_file)
                self.log(f"Found {env_file} - checking if it's properly excluded...", "info")

        # If env files exist, verify they're in .gitignore
        if found_env_files:
            gitignore_path = self.package_root / ".gitignore"
            if gitignore_path.exists():
                gitignore_content = gitignore_path.read_text()

                for env_file in found_env_files:
                    # Check if the env file is mentioned in .gitignore
                    if env_file not in gitignore_content and ".env" not in gitignore_content:
                        self.add_error(
                            f"{env_file} exists but is NOT in .gitignore! "
                            f"Add it to .gitignore to prevent accidental commits."
                        )
                    else:
                        self.log(f"{env_file} is properly excluded in .gitignore", "success")
            else:
                self.add_error(
                    f"Found {len(found_env_files)} env file(s) but no .gitignore! "
                    f"Create a .gitignore and add: {', '.join(found_env_files)}"
                )

        # Check for .env.example
        env_example_path = self.package_root / ".env.example"
        if env_example_path.exists():
            self.log(".env.example found - this is good for documentation", "success")

            # Check if .env.example contains real API keys
            content = env_example_path.read_text()
            suspicious_patterns = [
                r"sk-[a-zA-Z0-9]{48}",  # OpenAI API key pattern
                r"lin_api_[a-zA-Z0-9]{10,}",  # Linear API key pattern
                r"pk_[a-zA-Z0-9]{10,}",  # General API key pattern
            ]

            # Additional check for obviously fake keys
            fake_key_patterns = [
                r"X{10,}",  # Multiple X's
                r"your[-_].*[-_]key[-_]here",
                r"example[-_]key",
                r"test[-_]key",
            ]

            for pattern in suspicious_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    # Check if it's obviously fake
                    is_fake = any(re.search(fake_pattern, content, re.IGNORECASE) for fake_pattern in fake_key_patterns)
                    if not is_fake:
                        self.add_error(".env.example contains what appears to be a real API key!")
                        break
        else:
            self.add_warning(".env.example not found - consider adding for user guidance")

    def check_sensitive_files(self) -> None:
        """Check for sensitive files that might be accidentally published"""
        self.log("Checking for sensitive files in published package...")

        # Check if package.json has files field to control what gets published
        package_path = self.package_root / "package.json"
        with open(package_path) as f:
            pkg = json.load(f)

        if pkg.get("files") and len(pkg["files"]) > 0:
            self.log("Using package.json 'files' field to control published content", "success")

            # Only check files that would actually be published
            published_dirs = [f for f in pkg["files"] if "." not in f]

            for dir_name in published_dirs:
                dir_path = self.package_root / dir_name
                if dir_path.exists() and dir_path.is_dir():
                    self.check_directory_for_secrets(dir_path, dir_name)
        else:
            # Warn about sensitive directories that should be excluded
            sensitive_files = [
                ".linear-cache",
                "validation",
                "shared/coordination",
                "shared/deployment-plans",
                "workspaces",
                "logs",
            ]

            for file in sensitive_files:
                file_path = self.package_root / file
                if file_path.exists():
                    self.add_warning(
                        f"Sensitive directory '{file}' exists. Consider adding a 'files' field "
                        f"to package.json to explicitly control what gets published."
                    )

    def check_directory_for_secrets(self, dir_path: Path, dir_name: str) -> None:
        """Check if published directories contain sensitive files"""
        try:
            for file_path in dir_path.iterdir():
                if file_path.is_file() and file_path.suffix in [".env", ".key", ".secret", ".token", ".credential"]:
                    self.add_warning(
                        f"Potentially sensitive file found in published directory: {dir_name}/{file_path.name}"
                    )
        except Exception:
            # Directory might not be readable, skip
            pass

    def check_package_json(self) -> None:
        """Check package.json security settings"""
        self.log("Checking package.json security settings...")

        package_path = self.package_root / "package.json"
        with open(package_path) as f:
            pkg = json.load(f)

        # Check for private flag
        if pkg.get("private") is True:
            self.add_error('package.json has "private": true - this will prevent publication')

        # Check files field
        if not pkg.get("files") or len(pkg["files"]) == 0:
            self.add_warning('package.json missing "files" field - all files will be included')
        else:
            self.log(f"Files field found with {len(pkg['files'])} entries", "success")

        # Check for repository and bug URLs
        if not pkg.get("repository"):
            self.add_warning("package.json missing repository field")

        # Check version
        if not pkg.get("version") or pkg.get("version") == "0.0.0":
            self.add_error("Invalid or missing version in package.json")

    def check_npmignore(self) -> None:
        """Check .npmignore for security patterns"""
        self.log("Checking .npmignore...")

        npmignore_path = self.package_root / ".npmignore"
        if not npmignore_path.exists():
            self.add_warning(".npmignore not found - relying on .gitignore and package.json files field")
            return

        content = npmignore_path.read_text()
        required_patterns = [".env", "logs/", "*secret*", "*key*"]

        for pattern in required_patterns:
            if pattern not in content:
                self.add_warning(f'Important pattern "{pattern}" missing from .npmignore')

        self.log(".npmignore found with security patterns", "success")

    def check_gitignore(self) -> None:
        """Check .gitignore for security patterns"""
        self.log("Checking .gitignore...")

        gitignore_path = self.package_root / ".gitignore"
        if not gitignore_path.exists():
            self.add_warning(".gitignore not found")
            return

        content = gitignore_path.read_text()
        if ".env" not in content:
            self.add_error(".gitignore does not exclude .env files!")

    def check_for_hardcoded_secrets(self) -> None:
        """Check source files for hardcoded secrets"""
        self.log("Checking source files for hardcoded secrets...")

        source_files = []
        src_dir = self.package_root / "src"
        scripts_dir = self.package_root / "scripts"

        if src_dir.exists():
            source_files.extend(self.find_js_files(src_dir))
        if scripts_dir.exists():
            source_files.extend(self.find_js_files(scripts_dir))

        secret_patterns = [
            r"sk-[a-zA-Z0-9]{48}",  # OpenAI API key
            r"lin_api_[a-zA-Z0-9]{32,}",  # Linear API key
            r"AIza[0-9A-Za-z-_]{35}",  # Google API key
            r"pk_[a-zA-Z0-9]{24,}",  # Stripe-like keys
            r"[\"'](?:password|secret|key|token)[\"']:\s*[\"'][^\"']{8,}[\"']",  # JSON secrets
        ]

        for file in source_files:
            try:
                content = file.read_text()
                for pattern in secret_patterns:
                    if re.search(pattern, content):
                        self.add_error(f"Potential hardcoded secret found in {file.relative_to(self.package_root)}")
                        break
            except Exception:
                # Skip files that can't be read
                pass

    def find_js_files(self, directory: Path) -> List[Path]:
        """Find all JavaScript/TypeScript files in directory"""
        files = []
        for path in directory.rglob("*"):
            if path.is_file() and path.suffix in [".js", ".ts"]:
                files.append(path)
        return files

    def run(self) -> None:
        """Run all security checks"""
        console.print("\n[bold blue]🔒 CDEV Security Check[/bold blue]")
        console.print("[dim]Verifying package security without modifying any files...[/dim]\n")

        self.check_environment_files()
        self.check_sensitive_files()
        self.check_package_json()
        self.check_npmignore()
        self.check_gitignore()
        self.check_for_hardcoded_secrets()

        console.print("\n📊 Security Check Results:")
        console.print("[success]✅ Checks passed[/success]")
        console.print(f"[warning]⚠️  Warnings: {len(self.warnings)}[/warning]")
        console.print(f"[error]❌ Errors: {len(self.errors)}[/error]")

        if self.warnings:
            console.print("\n[warning]Warnings:[/warning]")
            for warning in self.warnings:
                console.print(f"  [warning]⚠️  {warning}[/warning]")

        if self.errors:
            console.print("\n[error]Errors that must be fixed:[/error]")
            for error in self.errors:
                console.print(f"  [error]❌ {error}[/error]")
            console.print("\n[error]🚫 Publication blocked due to security issues![/error]")
            sys.exit(1)

        console.print("\n[success]🎉 Security check passed! Package is safe to publish.[/success]\n")

    def to_yaml(self) -> str:
        """Export results as YAML"""
        results = {
            "security_check_results": {
                "status": "fail" if self.errors else "pass",
                "errors": self.errors,
                "warnings": self.warnings,
                "checks_performed": [
                    "environment_files",
                    "sensitive_files",
                    "package_json",
                    "npmignore",
                    "gitignore",
                    "hardcoded_secrets",
                ],
            }
        }
        return yaml.dump(results, default_flow_style=False)


@click.command()
@click.option(
    "--output-format", type=click.Choice(["console", "yaml"]), default="console", help="Output format for results"
)
def main(output_format: str):
    """Run security checks for CDEV package publication"""
    checker = SecurityChecker()

    if output_format == "yaml":
        # Run checks silently and output YAML
        console.quiet = True
        try:
            checker.run()
        except SystemExit:
            pass  # Catch the exit to output YAML
        console.quiet = False
        print(checker.to_yaml())
    else:
        checker.run()


if __name__ == "__main__":
    main.main(standalone_mode=True)
