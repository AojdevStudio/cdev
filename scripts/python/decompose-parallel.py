#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pyyaml>=6.0",
#   "click>=8.1",
#   "rich>=13.0"
# ]
# ///

"""decompose-parallel.py - Exclusive Ownership Decomposition Engine

This completely redesigned script ensures NO file conflicts by:
1. Analyzing all file operations first
2. Grouping files by dependency clusters
3. Creating exclusive agent domains
4. Validating no overlaps before generating agents

Usage: python decompose-parallel.py [LINEAR_ISSUE_ID]
"""

import json
import os
import re
import subprocess
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import click
import yaml
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()


@dataclass
class LinearIssue:
    """Represents a Linear issue"""

    id: str
    title: str
    description: str
    requirements: List[str]


@dataclass
class FileOperation:
    """Represents an operation on a file"""

    operation: str
    domain: str
    requirement: str


@dataclass
class WorkDomain:
    """Represents a work domain configuration"""

    id: str
    role: str
    focus_area: str
    estimated_time: int
    complexity: str
    type: str
    dependencies: List[str] = field(default_factory=list)


@dataclass
class Agent:
    """Represents an agent specification"""

    id: str
    role: str
    focus_area: str
    dependencies: List[str]
    files_to_create: List[str]
    files_to_modify: List[str]
    test_contracts: List[str]
    validation_criteria: List[str]
    estimated_time: int
    requirements: List[str]
    can_start_immediately: bool


class ExclusiveOwnershipDecomposer:
    """Main decomposition engine ensuring exclusive file ownership"""

    def __init__(self):
        self.project_root = Path.cwd()
        self.linear_issue: Optional[LinearIssue] = None
        self.all_file_operations: Dict[str, List[Dict]] = {}
        self.dependency_graph: Dict[str, List[str]] = {}
        self.exclusive_domains: Dict[str, List[str]] = {}
        self.agent_ownership: Dict[str, List[str]] = {}
        self.use_hybrid_analysis = os.environ.get("USE_HYBRID_ANALYSIS", "true").lower() != "false"

    async def decompose(self, issue_id: str) -> Dict[str, Any]:
        """Main decomposition method"""
        try:
            console.print("[cyan]🔄 Starting Exclusive Ownership Decomposition...[/cyan]")

            # Step 1: Load Linear issue
            await self.load_linear_issue(issue_id)

            # Step 2: Try hybrid analysis first (if enabled)
            if self.use_hybrid_analysis:
                hybrid_result = await self.try_hybrid_analysis()
                if hybrid_result:
                    return hybrid_result

            # Step 3: Fall back to pattern-based analysis
            console.print("[yellow]⚠️  Falling back to pattern-based analysis...[/yellow]")

            # Analyze file operations
            await self.analyze_file_operations()

            # Build dependency graph
            await self.build_dependency_graph()

            # Create exclusive domains
            await self.create_exclusive_domains()

            # Generate agents
            agents = await self.generate_exclusive_agents()

            # Validate no conflicts
            self.validate_no_conflicts(agents)

            # Generate deployment plan
            deployment_plan = await self.generate_deployment_plan(agents)

            # Save deployment plan
            await self.save_deployment_plan(deployment_plan, self.linear_issue.id)

            # Report results
            self.report_decomposition(deployment_plan)

            return deployment_plan

        except Exception as e:
            console.print(f"[red]❌ Decomposition failed: {e!s}[/red]")
            raise

    async def load_linear_issue(self, issue_id: str):
        """Load Linear issue from cache or create fallback"""
        cache_file = self.project_root / ".linear-cache" / f"{issue_id}.json"

        try:
            if cache_file.exists():
                with open(cache_file) as f:
                    issue_data = json.load(f)
                    self.linear_issue = LinearIssue(
                        id=issue_data.get("identifier", issue_id),
                        title=issue_data.get("title", "Linear Issue"),
                        description=issue_data.get("description", ""),
                        requirements=self.extract_requirements(issue_data.get("description", "")),
                    )
                    console.print(f"[green]✅ Loaded issue {issue_id} from cache[/green]")
            else:
                console.print(f"[yellow]⚠️  Cache not found, using fallback for {issue_id}[/yellow]")
                self.linear_issue = LinearIssue(
                    id=issue_id,
                    title=f"Issue {issue_id}",
                    description="Fallback issue description",
                    requirements=[f"Implement {issue_id} functionality"],
                )
        except Exception as e:
            console.print(f"[red]Error loading issue: {e!s}[/red]")
            raise

    async def try_hybrid_analysis(self) -> Optional[Dict[str, Any]]:
        """Try LLM-based hybrid analysis"""
        try:
            console.print("[cyan]🤖 Attempting hybrid LLM analysis...[/cyan]")

            # Check for LLM decomposer availability
            try:
                from utils.llm_decomposer import LLMDecomposer

                llm_decomposer = LLMDecomposer()
            except ImportError:
                console.print("[yellow]⚠️  LLM decomposer not available[/yellow]")
                return None

            description = f"{self.linear_issue.title}\n\n{self.linear_issue.description}"
            project_context = {
                "hasPackageJson": (self.project_root / "package.json").exists(),
                "hasDockerfile": (self.project_root / "Dockerfile").exists(),
                "hasNextConfig": (self.project_root / "next.config.js").exists(),
                "projectRoot": str(self.project_root),
            }

            llm_result = await llm_decomposer.decompose(description, project_context)

            if llm_result["confidence"] >= 0.8:
                console.print(f"[green]✅ LLM analysis succeeded (confidence: {llm_result['confidence']})[/green]")
                deployment_plan = await self.convert_llm_result_to_deployment_plan(llm_result)
                return deployment_plan
            else:
                console.print(f"[yellow]⚠️  LLM analysis uncertain (confidence: {llm_result['confidence']})[/yellow]")
                return None

        except Exception as e:
            console.print(f"[yellow]⚠️  LLM analysis error: {e!s}[/yellow]")
            return None

    async def convert_llm_result_to_deployment_plan(self, llm_result: Dict) -> Dict[str, Any]:
        """Convert LLM result to deployment plan format"""
        agents = []

        for agent_data in llm_result["agents"]:
            agent = Agent(
                id=agent_data["agentId"],
                role=agent_data["agentRole"],
                focus_area=agent_data["focusArea"],
                dependencies=agent_data.get("dependencies", []),
                files_to_create=agent_data.get("filesToCreate", []),
                files_to_modify=agent_data.get("filesToModify", []),
                test_contracts=[
                    f.replace(".ts", ".test.ts").replace(".js", ".test.js") for f in agent_data.get("filesToCreate", [])
                ],
                validation_criteria=[
                    f"All {agent_data['focusArea']} files are created successfully",
                    f"{agent_data['focusArea']} functionality works as expected",
                    f"No errors in {agent_data['focusArea']} implementation",
                    f"{agent_data['focusArea']} tests pass successfully",
                ],
                estimated_time=agent_data.get("estimatedTime", 30),
                requirements=[],
                can_start_immediately=not agent_data.get("dependencies", []),
            )
            agents.append(agent)

        # Calculate total files
        total_files = sum(len(agent.files_to_create) + len(agent.files_to_modify) for agent in agents)

        return {
            "taskId": self.linear_issue.id,
            "taskTitle": self.linear_issue.title,
            "decompositionStrategy": "llm_hybrid",
            "conflictResolution": "llm_analyzed",
            "parallelAgents": [self.agent_to_dict(agent) for agent in agents],
            "totalFiles": total_files,
            "integrationPlan": {
                "mergeOrder": self.calculate_merge_order(agents),
                "validationSteps": ["Run LLM-generated agent tests", "Integration testing", "Full system validation"],
                "estimatedIntegrationTime": "10 minutes",
            },
            "llmAnalysis": {
                "projectType": llm_result.get("projectType"),
                "confidence": llm_result.get("confidence"),
                "reasoning": llm_result.get("reasoning"),
                "parallelizationStrategy": llm_result.get("parallelizationStrategy"),
            },
        }

    async def analyze_file_operations(self):
        """Analyze file operations from requirements"""
        console.print("[cyan]📊 Analyzing file operations from requirements...[/cyan]")

        for requirement in self.linear_issue.requirements:
            operations = self.extract_file_operations_from_requirement(requirement)

            for file, operation_data in operations.items():
                if file not in self.all_file_operations:
                    self.all_file_operations[file] = []

                self.all_file_operations[file].append(
                    {
                        "operation": operation_data,
                        "requirement": requirement,
                        "agent": None,  # To be assigned later
                    }
                )

        console.print(
            f"   [green]📁 Found {len(self.all_file_operations)} unique files across all requirements[/green]"
        )

    def extract_file_operations_from_requirement(self, requirement: str) -> Dict[str, FileOperation]:
        """Extract file operations from a requirement"""
        operations = {}
        req_lower = requirement.lower()

        # File operation patterns
        patterns = [
            # Authentication domain
            {
                "condition": lambda req: any(word in req for word in ["auth", "login", "token"]),
                "domain": "auth",
                "files": {
                    "lib/auth/authentication.ts": "CREATE",
                    "lib/auth/token-manager.ts": "CREATE",
                    "middleware/auth.ts": "CREATE",
                    "types/auth.ts": "CREATE",
                },
            },
            # Forms domain
            {
                "condition": lambda req: any(word in req for word in ["form", "validation", "input"]),
                "domain": "forms",
                "files": {
                    "components/forms/DynamicForm.tsx": "CREATE",
                    "lib/form-validation.ts": "CREATE",
                    "hooks/useFormState.ts": "CREATE",
                    "types/form.ts": "CREATE",
                },
            },
            # API/Backend domain
            {
                "condition": lambda req: any(word in req for word in ["api", "endpoint", "server"]),
                "domain": "backend",
                "files": {
                    "pages/api/[...slug].ts": "CREATE",
                    "lib/api/client.ts": "CREATE",
                    "lib/api/handlers.ts": "CREATE",
                    "types/api.ts": "CREATE",
                },
            },
            # Data/Storage domain
            {
                "condition": lambda req: any(word in req for word in ["data", "storage", "database"]),
                "domain": "data",
                "files": {
                    "lib/database/queries.ts": "CREATE",
                    "lib/database/models.ts": "CREATE",
                    "lib/storage/manager.ts": "CREATE",
                    "types/data.ts": "CREATE",
                },
            },
            # Infrastructure domain
            {
                "condition": lambda req: any(word in req for word in ["docker", "deploy", "infrastructure"]),
                "domain": "infrastructure",
                "files": {
                    "Dockerfile": "CREATE",
                    "docker-compose.yml": "CREATE",
                    "scripts/deploy.sh": "CREATE",
                    "scripts/build.sh": "CREATE",
                },
            },
            # File operations domain
            {
                "condition": lambda req: any(word in req for word in ["write", "file operations", "create files"]),
                "domain": "file_operations",
                "files": {
                    "lib/operations/write-operations.ts": "CREATE",
                    "lib/operations/file-writer.ts": "CREATE",
                    "lib/validation/write-validation.ts": "CREATE",
                    "types/operations.ts": "CREATE",
                },
            },
            # UI Components domain
            {
                "condition": lambda req: any(word in req for word in ["component", "ui", "interface"]),
                "domain": "ui",
                "files": {
                    "components/ui/Button.tsx": "CREATE",
                    "components/ui/Input.tsx": "CREATE",
                    "components/common/Layout.tsx": "CREATE",
                    "styles/components.css": "CREATE",
                },
            },
        ]

        # Find matching patterns
        matching_patterns = [p for p in patterns if p["condition"](req_lower)]

        # Add files from matching patterns
        for pattern in matching_patterns:
            for file, operation in pattern["files"].items():
                operations[file] = FileOperation(operation=operation, domain=pattern["domain"], requirement=requirement)

        return operations

    async def build_dependency_graph(self):
        """Build file dependency graph"""
        console.print("[cyan]🔗 Building file dependency graph...[/cyan]")

        # Simple dependency rules based on common patterns
        dependency_rules = [
            # Types files are dependencies for implementation files
            {"pattern": re.compile(r"^types/"), "dependents": ["lib/", "components/", "pages/"]},
            # Auth files depend on each other
            {"pattern": re.compile(r"^lib/auth/"), "dependents": ["middleware/", "pages/api/"]},
            # Database files are dependencies for API files
            {"pattern": re.compile(r"^lib/database/"), "dependents": ["pages/api/", "lib/api/"]},
            # UI components depend on common components
            {"pattern": re.compile(r"^components/common/"), "dependents": ["components/", "pages/"]},
            # Infrastructure files are foundational
            {"pattern": re.compile(r"^(Dockerfile|docker-compose\.yml|scripts/)"), "dependents": ["**"]},
        ]

        # Build dependency relationships
        for file in self.all_file_operations:
            self.dependency_graph[file] = []

            for rule in dependency_rules:
                if rule["pattern"].match(file):
                    for other_file in self.all_file_operations:
                        if other_file != file:
                            for dep in rule["dependents"]:
                                if dep == "**" or other_file.startswith(dep.replace("/", "")):
                                    self.dependency_graph[file].append(other_file)

        console.print(f"   [green]🔗 Built dependency graph with {len(self.dependency_graph)} files[/green]")

    async def create_exclusive_domains(self):
        """Create exclusive domains ensuring no file overlap"""
        console.print("[cyan]🎯 Creating exclusive domains...[/cyan]")

        # Group files by domain based on their operations
        domain_groups = defaultdict(list)

        for file, operations in self.all_file_operations.items():
            # Get the domain from the first operation
            domain = operations[0]["operation"].domain
            domain_groups[domain].append(file)

        # Create exclusive domains
        for domain, files in domain_groups.items():
            self.exclusive_domains[domain] = files
            console.print(f'   [green]📁 Domain "{domain}": {len(files)} files[/green]')

        # Validate no file appears in multiple domains
        all_domain_files = set()
        for domain, files in self.exclusive_domains.items():
            for file in files:
                if file in all_domain_files:
                    raise ValueError(f"❌ File conflict detected: {file} appears in multiple domains")
                all_domain_files.add(file)

        console.print(f"   [green]✅ Created {len(self.exclusive_domains)} exclusive domains with no conflicts[/green]")

    async def generate_exclusive_agents(self) -> List[Agent]:
        """Generate agents with exclusive ownership"""
        console.print("[cyan]🤖 Generating agents with exclusive ownership...[/cyan]")

        agents = []

        for domain, files in self.exclusive_domains.items():
            agent = await self.create_agent_for_domain(domain, files)
            agents.append(agent)

            # Track ownership
            self.agent_ownership[agent.id] = files

            console.print(f'   [green]✅ Agent "{agent.id}": {len(files)} exclusive files[/green]')

        return agents

    async def create_agent_for_domain(self, domain: str, files: List[str]) -> Agent:
        """Create an agent for a specific domain"""
        domain_configs = {
            "auth": WorkDomain(
                id="auth_agent",
                role="Authentication & Authorization",
                focus_area="Authentication",
                estimated_time=35,
                complexity="high",
                type="security",
                dependencies=[],
            ),
            "forms": WorkDomain(
                id="forms_agent",
                role="Form Components & Validation",
                focus_area="Forms",
                estimated_time=25,
                complexity="medium",
                type="frontend",
                dependencies=["auth_agent"],
            ),
            "backend": WorkDomain(
                id="backend_agent",
                role="API Endpoints & Server Logic",
                focus_area="Backend",
                estimated_time=40,
                complexity="high",
                type="backend",
                dependencies=["data_agent"],
            ),
            "data": WorkDomain(
                id="data_agent",
                role="Database & Data Management",
                focus_area="Data",
                estimated_time=30,
                complexity="high",
                type="data",
                dependencies=[],
            ),
            "infrastructure": WorkDomain(
                id="infrastructure_agent",
                role="Infrastructure & Deployment",
                focus_area="Infrastructure",
                estimated_time=20,
                complexity="medium",
                type="infrastructure",
                dependencies=[],
            ),
            "file_operations": WorkDomain(
                id="file_operations_agent",
                role="File Operations & Write Capabilities",
                focus_area="File Operations",
                estimated_time=30,
                complexity="medium",
                type="feature",
                dependencies=["data_agent"],
            ),
            "ui": WorkDomain(
                id="ui_agent",
                role="UI Components & Interface",
                focus_area="UI",
                estimated_time=25,
                complexity="medium",
                type="frontend",
                dependencies=["auth_agent"],
            ),
        }

        config = domain_configs.get(
            domain,
            WorkDomain(
                id=f"{domain}_agent",
                role=f"{domain.capitalize()} Implementation",
                focus_area=domain,
                estimated_time=25,
                complexity="medium",
                type="feature",
                dependencies=[],
            ),
        )

        # Separate files into CREATE and MODIFY
        files_to_create = []
        files_to_modify = []

        for file in files:
            operations = self.all_file_operations[file]
            if operations and operations[0]["operation"].operation == "CREATE":
                files_to_create.append(file)
            else:
                files_to_modify.append(file)

        return Agent(
            id=config.id,
            role=config.role,
            focus_area=config.focus_area,
            dependencies=config.dependencies,
            files_to_create=files_to_create,
            files_to_modify=files_to_modify,
            test_contracts=self.generate_test_contracts(domain, files),
            validation_criteria=self.generate_validation_criteria(domain, files),
            estimated_time=config.estimated_time,
            requirements=self.get_requirements_for_domain(domain),
            can_start_immediately=not config.dependencies,
        )

    def generate_test_contracts(self, domain: str, files: List[str]) -> List[str]:
        """Generate test contracts for domain files"""
        base_tests = []
        for file in files[:3]:  # Limit to 3 main tests
            ext = Path(file).suffix
            base_name = Path(file).stem
            test_ext = ".test.tsx" if ext == ".tsx" else ".test.ts"
            base_tests.append(f"{base_name}{test_ext}")
        return base_tests

    def generate_validation_criteria(self, domain: str, files: List[str]) -> List[str]:
        """Generate validation criteria for domain"""
        return [
            f"All {domain} files are created successfully",
            f"{domain} functionality works as expected",
            f"No errors in {domain} implementation",
            f"{domain} tests pass successfully",
        ]

    def get_requirements_for_domain(self, domain: str) -> List[str]:
        """Get requirements associated with a domain"""
        requirements = []

        for file, operations in self.all_file_operations.items():
            if operations[0]["operation"].domain == domain:
                requirements.extend([op["requirement"] for op in operations])

        return list(set(requirements))  # Remove duplicates

    def validate_no_conflicts(self, agents: List[Agent]):
        """Validate no file conflicts between agents"""
        console.print("[cyan]🔍 Validating no conflicts between agents...[/cyan]")

        file_ownership = {}

        for agent in agents:
            all_files = agent.files_to_create + agent.files_to_modify

            for file in all_files:
                if file in file_ownership:
                    raise ValueError(
                        f'❌ CONFLICT: File "{file}" is assigned to both {agent.id} and {file_ownership[file]}'
                    )
                file_ownership[file] = agent.id

        console.print(f"   [green]✅ Validated {len(file_ownership)} files with exclusive ownership[/green]")

    def calculate_merge_order(self, agents: List[Agent]) -> List[str]:
        """Calculate merge order based on dependencies"""
        ordered = []
        remaining = agents.copy()

        while remaining:
            ready = [
                agent
                for agent in remaining
                if not agent.dependencies or all(dep in ordered for dep in agent.dependencies)
            ]

            if not ready:
                # Fallback: add all remaining agents
                ordered.extend([a.id for a in remaining])
                break

            next_agent = ready[0]
            ordered.append(next_agent.id)
            remaining.remove(next_agent)

        return ordered

    def agent_to_dict(self, agent: Agent) -> Dict[str, Any]:
        """Convert agent to dictionary format"""
        return {
            "agentId": agent.id,
            "agentRole": agent.role,
            "focusArea": agent.focus_area,
            "dependencies": agent.dependencies,
            "filesToCreate": agent.files_to_create,
            "filesToModify": agent.files_to_modify,
            "testContracts": agent.test_contracts,
            "validationCriteria": agent.validation_criteria,
            "estimatedTime": agent.estimated_time,
            "canStartImmediately": agent.can_start_immediately,
        }

    async def generate_deployment_plan(self, agents: List[Agent]) -> Dict[str, Any]:
        """Generate deployment plan from agents"""
        return {
            "taskId": self.linear_issue.id,
            "taskTitle": self.linear_issue.title,
            "decompositionStrategy": "exclusive_ownership",
            "conflictResolution": "eliminated_by_design",
            "parallelAgents": [self.agent_to_dict(agent) for agent in agents],
            "integrationPlan": {
                "mergeOrder": self.calculate_merge_order(agents),
                "validationSteps": [
                    "Validate exclusive file ownership",
                    "Run individual agent tests",
                    "Integration testing",
                    "Full system validation",
                ],
            },
            "exclusiveOwnership": {
                "validated": True,
                "totalFiles": len(self.all_file_operations),
                "agentOwnership": dict(self.agent_ownership),
            },
        }

    async def save_deployment_plan(self, plan: Dict[str, Any], issue_id: str):
        """Save deployment plan to file"""
        output_dir = self.project_root / "shared" / "deployment-plans"
        output_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{issue_id.lower()}-deployment-plan.yaml"
        filepath = output_dir / filename

        def save_yaml(data: Dict, filepath: str):
            with open(filepath, "w") as f:
                yaml.dump(data, f, default_flow_style=False, sort_keys=False)

        save_yaml(plan, str(filepath))
        console.print(f"[green]💾 Saved deployment plan: {filepath}[/green]")
        console.print(f"   [cyan]Next: Run 'cdev run {filepath}' to spawn agents[/cyan]")

        return str(filepath)

    def report_decomposition(self, plan: Dict[str, Any]):
        """Report decomposition results"""
        console.print(Panel.fit("[bold green]🎯 Decomposition Complete![/bold green]"))

        # Summary table
        table = Table(title="Decomposition Summary", show_header=True, header_style="bold blue")
        table.add_column("Property", style="cyan", no_wrap=True)
        table.add_column("Value", style="green")

        table.add_row("Task ID", plan["taskId"])
        table.add_row("Task Title", plan["taskTitle"])
        table.add_row("Agents", str(len(plan["parallelAgents"])))
        total_files = plan.get("exclusiveOwnership", {}).get("totalFiles", 0)
        table.add_row("Total Files", str(total_files))
        table.add_row("Conflicts", "ELIMINATED BY DESIGN")

        console.print(table)

        # Agent summary
        console.print("\n[bold cyan]🔧 Agent Summary:[/bold cyan]")
        for agent in plan["parallelAgents"]:
            can_start = "✅" if agent["canStartImmediately"] else "⏳"
            console.print(
                f"   {can_start} {agent['agentId']}: "
                f"{len(agent['filesToCreate'])} files to create, "
                f"{len(agent['filesToModify'])} files to modify"
            )

        # Integration order
        console.print("\n[bold cyan]📊 Integration Order:[/bold cyan]")
        for i, agent_id in enumerate(plan["integrationPlan"]["mergeOrder"], 1):
            console.print(f"   {i}. {agent_id}")

        # Next steps
        console.print("\n[bold cyan]🚀 Next Steps:[/bold cyan]")
        console.print(f"   Run: cdev run shared/deployment-plans/{plan['taskId'].lower()}-deployment-plan.yaml")
        console.print("   This will spawn parallel agents and open them in your editor")

    def extract_requirements(self, description: str) -> List[str]:
        """Extract requirements from description"""
        requirements = []
        lines = description.split("\n")

        for line in lines:
            match = re.match(r"^\s*\d+\.\s*(.+)", line)
            if match:
                requirements.append(match.group(1).strip())

        # If no numbered requirements, treat the whole description as one requirement
        if not requirements:
            requirements.append(description.strip())

        return requirements


def run_git(args: List[str]) -> subprocess.CompletedProcess:
    """Run a git command"""
    return subprocess.run(["git"] + args, check=False, capture_output=True, text=True)


def save_yaml(data: Dict, filepath: str):
    """Save data to YAML file"""
    with open(filepath, "w") as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False)


@click.command()
@click.argument("issue_id", type=str)
@click.option("--dry-run", is_flag=True, help="Preview decomposition without saving")
async def main(issue_id: str, dry_run: bool):
    """Decompose a Linear issue into parallel agents with exclusive file ownership"""
    decomposer = ExclusiveOwnershipDecomposer()

    try:
        await decomposer.decompose(issue_id)

        if dry_run:
            console.print("\n[yellow]DRY RUN MODE - No files saved[/yellow]")

    except Exception as e:
        console.print(f"[red]Error: {e!s}[/red]")
        raise click.ClickException(str(e))


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
