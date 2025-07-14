#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0", "click>=8.1", "rich>=13.0"]
# ///

"""INTELLIGENT AGENT GENERATION ENGINE

Instead of hardcoded pattern matching, this system:
1. Analyzes requirements using semantic parsing
2. Maps requirements to work domains using codebase analysis
3. Generates agents dynamically based on the analysis
"""

import re
from dataclasses import dataclass
from typing import Any, Dict, List, Set

import click
import yaml
from rich.console import Console

console = Console()


@dataclass
class WorkDomain:
    """Represents a work domain discovered from codebase"""

    id: str
    name: str
    directories: List[str]
    test_patterns: List[str]
    estimated_complexity: str
    base_time: int


@dataclass
class RequirementAnalysis:
    """Analysis of a parsed requirement"""

    original_text: str
    actions: List[str]
    objects: List[str]
    technologies: List[str]
    complexity: str
    domains: List[str]


@dataclass
class Agent:
    """Generated agent specification"""

    agent_id: str
    agent_role: str
    focus_area: str
    files_to_create: List[str]
    files_to_modify: List[str]
    validation_criteria: List[str]
    complexity: str
    estimated_time: int
    dependencies: List[str]
    requirements: List[str]


class IntelligentAgentGenerator:
    """Main agent generation engine"""

    def __init__(self, codebase_structure: Dict[str, Any], test_suite_analysis: Dict[str, Any]):
        self.codebase_structure = codebase_structure
        self.test_suite_analysis = test_suite_analysis
        self.work_domains = self.discover_work_domains()

    def generate_agent_for_requirement(self, requirement: str) -> Agent:
        """Main method: Analyze requirement and generate appropriate agent"""
        # Step 1: Parse requirement to extract key information
        requirement_analysis = self.analyze_requirement(requirement)

        # Step 2: Map to work domains
        work_domain = self.map_to_work_domain(requirement_analysis)

        # Step 3: Generate agent specification
        agent = self.create_agent_from_domain(work_domain, requirement, requirement_analysis)

        return agent

    def discover_work_domains(self) -> Dict[str, WorkDomain]:
        """Discover work domains by analyzing the actual codebase"""
        domains = {}

        # API/Backend Domain
        if self.has_backend_capabilities():
            domains["backend"] = WorkDomain(
                id="backend",
                name="Backend & API",
                directories=self.get_backend_directories(),
                test_patterns=self.get_backend_test_patterns(),
                estimated_complexity="high",
                base_time=30,
            )

        # Frontend/UI Domain
        if self.has_frontend_capabilities():
            domains["frontend"] = WorkDomain(
                id="frontend",
                name="Frontend & UI",
                directories=self.get_frontend_directories(),
                test_patterns=self.get_frontend_test_patterns(),
                estimated_complexity="medium",
                base_time=25,
            )

        # Component Domain
        if self.has_component_library():
            domains["components"] = WorkDomain(
                id="components",
                name="Component Library",
                directories=self.get_component_directories(),
                test_patterns=self.get_component_test_patterns(),
                estimated_complexity="medium",
                base_time=20,
            )

        # Data/Integration Domain
        if self.has_data_capabilities():
            domains["data"] = WorkDomain(
                id="data",
                name="Data & Integration",
                directories=self.get_data_directories(),
                test_patterns=self.get_data_test_patterns(),
                estimated_complexity="high",
                base_time=35,
            )

        # Infrastructure Domain
        if self.has_infrastructure_config():
            domains["infrastructure"] = WorkDomain(
                id="infrastructure",
                name="Infrastructure & Config",
                directories=self.get_infrastructure_directories(),
                test_patterns=self.get_infrastructure_test_patterns(),
                estimated_complexity="medium",
                base_time=25,
            )

        return domains

    def analyze_requirement(self, requirement: str) -> RequirementAnalysis:
        """Analyze requirement text to extract semantic information"""
        return RequirementAnalysis(
            original_text=requirement,
            actions=self.extract_actions(requirement),
            objects=self.extract_objects(requirement),
            technologies=self.extract_technologies(requirement),
            complexity=self.estimate_complexity(requirement),
            domains=self.suggest_domains(requirement),
        )

    def extract_actions(self, requirement: str) -> List[str]:
        """Extract action verbs from requirement"""
        action_patterns = [
            r"\b(create|build|implement|add|develop|design)\b",
            r"\b(fix|resolve|repair|debug|correct)\b",
            r"\b(enhance|improve|optimize|upgrade)\b",
            r"\b(integrate|connect|sync|link)\b",
            r"\b(configure|setup|initialize|install)\b",
            r"\b(test|validate|verify|check)\b",
        ]

        actions = []
        for pattern in action_patterns:
            matches = re.findall(pattern, requirement, re.IGNORECASE)
            actions.extend([m.lower() for m in matches])

        return list(set(actions))  # Remove duplicates

    def extract_objects(self, requirement: str) -> List[str]:
        """Extract objects/nouns from requirement"""
        object_patterns = [
            r"\b(form|forms|input|field|validation)\b",
            r"\b(api|endpoint|service|server|integration)\b",
            r"\b(database|db|storage|data|model)\b",
            r"\b(component|ui|interface|layout|design)\b",
            r"\b(auth|authentication|login|signup|jwt)\b",
            r"\b(file|upload|download|document|storage)\b",
            r"\b(chart|graph|visualization|dashboard|kpi)\b",
            r"\b(test|testing|spec|coverage)\b",
            r"\b(routing|navigation|route|page)\b",
        ]

        objects = []
        for pattern in object_patterns:
            matches = re.findall(pattern, requirement, re.IGNORECASE)
            objects.extend([m.lower() for m in matches])

        return list(set(objects))

    def extract_technologies(self, requirement: str) -> List[str]:
        """Extract technology mentions"""
        tech_patterns = [
            r"\b(react|next\.?js|vue|angular|svelte)\b",
            r"\b(node\.?js|express|fastify|nestjs)\b",
            r"\b(typescript|javascript|python|go)\b",
            r"\b(mongodb|postgres|mysql|redis|sqlite)\b",
            r"\b(mcp|google\s*drive|aws|azure|gcp)\b",
            r"\b(graphql|rest|grpc|websocket)\b",
            r"\b(docker|kubernetes|terraform)\b",
        ]

        technologies = []
        for pattern in tech_patterns:
            matches = re.findall(pattern, requirement, re.IGNORECASE)
            technologies.extend([m.lower() for m in matches])

        return list(set(technologies))

    def estimate_complexity(self, requirement: str) -> str:
        """Estimate complexity based on requirement characteristics"""
        complexity_score = 0

        # Length indicates complexity
        complexity_score += min(len(requirement) / 100, 3)

        # Multiple technologies increase complexity
        technologies = self.extract_technologies(requirement)
        complexity_score += len(technologies) * 0.5

        # Certain keywords indicate high complexity
        high_complexity_keywords = [
            "integration",
            "security",
            "performance",
            "scale",
            "architecture",
        ]
        for keyword in high_complexity_keywords:
            if keyword in requirement.lower():
                complexity_score += 1

        if complexity_score >= 4:
            return "high"
        elif complexity_score >= 2:
            return "medium"
        return "low"

    def suggest_domains(self, requirement: str) -> List[str]:
        """Suggest potential work domains based on requirement analysis"""
        suggestions = []
        req_lower = requirement.lower()

        # Frontend indicators
        if re.search(r"\b(ui|component|form|layout|design|interface)\b", req_lower):
            suggestions.append("frontend")

        # Backend indicators
        if re.search(r"\b(api|server|database|integration|service)\b", req_lower):
            suggestions.append("backend")

        # Data indicators
        if re.search(r"\b(data|storage|file|drive|upload|sync)\b", req_lower):
            suggestions.append("data")

        # Component indicators
        if re.search(r"\b(component|reusable|library|widget)\b", req_lower):
            suggestions.append("components")

        # Infrastructure indicators
        if re.search(r"\b(config|setup|deploy|infrastructure|mcp)\b", req_lower):
            suggestions.append("infrastructure")

        return suggestions

    def map_to_work_domain(self, requirement_analysis: RequirementAnalysis) -> WorkDomain:
        """Map requirement analysis to best work domain"""
        # Start with suggested domains from requirement analysis
        candidate_domains = [
            self.work_domains[domain] for domain in requirement_analysis.domains if domain in self.work_domains
        ]

        if not candidate_domains:
            # Fallback: Create a custom domain
            return self.create_custom_domain(requirement_analysis)

        # Score each candidate domain
        scored_domains = [
            {"domain": domain, "score": self.score_domain_match(domain, requirement_analysis)}
            for domain in candidate_domains
        ]

        # Return highest scoring domain
        scored_domains.sort(key=lambda x: x["score"], reverse=True)
        return scored_domains[0]["domain"]

    def score_domain_match(self, domain: WorkDomain, requirement_analysis: RequirementAnalysis) -> float:
        """Score how well a domain matches the requirement"""
        score = 0.0

        # Check if objects match domain capabilities
        domain_objects = self.get_domain_objects(domain)
        for obj in requirement_analysis.objects:
            if obj in domain_objects:
                score += 1.0

        # Check if technologies match domain
        domain_technologies = self.get_domain_technologies(domain)
        for tech in requirement_analysis.technologies:
            if tech in domain_technologies:
                score += 1.5

        # Complexity alignment
        if domain.estimated_complexity == requirement_analysis.complexity:
            score += 0.5

        return score

    def create_agent_from_domain(self, domain: WorkDomain, requirement: str, analysis: RequirementAnalysis) -> Agent:
        """Generate agent specification from domain and requirement"""
        # Generate unique agent ID
        agent_id = f"{domain.id}_agent_{hash(requirement) % 10000}"

        # Create role description
        role = self.generate_role_description(domain, analysis)

        # Determine files to work on
        files_to_create, files_to_modify = self.determine_files(domain, analysis)

        # Generate validation criteria
        validation_criteria = self.generate_validation_criteria(domain, analysis)

        # Calculate estimated time
        time_multiplier = {"low": 0.7, "medium": 1.0, "high": 1.5}
        estimated_time = int(domain.base_time * time_multiplier.get(analysis.complexity, 1.0))

        return Agent(
            agent_id=agent_id,
            agent_role=role,
            focus_area=domain.name,
            files_to_create=files_to_create,
            files_to_modify=files_to_modify,
            validation_criteria=validation_criteria,
            complexity=analysis.complexity,
            estimated_time=estimated_time,
            dependencies=[],
            requirements=[requirement],
        )

    # Helper methods for capability detection
    def has_backend_capabilities(self) -> bool:
        """Check if codebase has backend capabilities"""
        backend_indicators = ["api", "server", "routes", "controllers", "models"]
        return any(indicator in str(self.codebase_structure).lower() for indicator in backend_indicators)

    def has_frontend_capabilities(self) -> bool:
        """Check if codebase has frontend capabilities"""
        frontend_indicators = ["components", "pages", "views", "ui", "styles"]
        return any(indicator in str(self.codebase_structure).lower() for indicator in frontend_indicators)

    def has_component_library(self) -> bool:
        """Check if codebase has a component library"""
        return "components" in str(self.codebase_structure).lower()

    def has_data_capabilities(self) -> bool:
        """Check if codebase has data handling capabilities"""
        data_indicators = ["database", "storage", "models", "migrations"]
        return any(indicator in str(self.codebase_structure).lower() for indicator in data_indicators)

    def has_infrastructure_config(self) -> bool:
        """Check if codebase has infrastructure configuration"""
        infra_indicators = ["config", "docker", "terraform", ".env", "deployment"]
        return any(indicator in str(self.codebase_structure).lower() for indicator in infra_indicators)

    # Directory getters (simplified versions)
    def get_backend_directories(self) -> List[str]:
        return ["src/api", "src/server", "src/routes", "src/controllers"]

    def get_frontend_directories(self) -> List[str]:
        return ["src/components", "src/pages", "src/ui", "src/views"]

    def get_component_directories(self) -> List[str]:
        return ["src/components", "src/ui/components"]

    def get_data_directories(self) -> List[str]:
        return ["src/models", "src/database", "src/storage"]

    def get_infrastructure_directories(self) -> List[str]:
        return ["config", "infrastructure", "deployment"]

    # Test pattern getters
    def get_backend_test_patterns(self) -> List[str]:
        return ["*.test.js", "*.spec.js", "__tests__/*.js"]

    def get_frontend_test_patterns(self) -> List[str]:
        return ["*.test.tsx", "*.spec.tsx", "__tests__/*.tsx"]

    def get_component_test_patterns(self) -> List[str]:
        return ["*.test.tsx", "*.stories.tsx"]

    def get_data_test_patterns(self) -> List[str]:
        return ["*.test.js", "*.integration.test.js"]

    def get_infrastructure_test_patterns(self) -> List[str]:
        return ["*.test.sh", "*.test.yml"]

    # Additional helper methods
    def get_domain_objects(self, domain: WorkDomain) -> Set[str]:
        """Get objects associated with a domain"""
        domain_objects = {
            "backend": {"api", "endpoint", "service", "server"},
            "frontend": {"ui", "component", "form", "layout"},
            "components": {"component", "widget", "element"},
            "data": {"database", "storage", "file", "data"},
            "infrastructure": {"config", "deployment", "setup"},
        }
        return domain_objects.get(domain.id, set())

    def get_domain_technologies(self, domain: WorkDomain) -> Set[str]:
        """Get technologies associated with a domain"""
        domain_tech = {
            "backend": {"node.js", "express", "fastify"},
            "frontend": {"react", "next.js", "typescript"},
            "components": {"react", "storybook"},
            "data": {"mongodb", "postgres", "redis"},
            "infrastructure": {"docker", "terraform", "mcp"},
        }
        return domain_tech.get(domain.id, set())

    def generate_role_description(self, domain: WorkDomain, analysis: RequirementAnalysis) -> str:
        """Generate a role description for the agent"""
        action = analysis.actions[0] if analysis.actions else "implement"
        objects = " and ".join(analysis.objects[:2]) if analysis.objects else "features"

        return f"{action.capitalize()} {objects} in {domain.name}"

    def determine_files(self, domain: WorkDomain, analysis: RequirementAnalysis) -> tuple[List[str], List[str]]:
        """Determine which files to create or modify"""
        files_to_create = []
        files_to_modify = []

        # Simple heuristic based on domain
        if domain.id == "backend":
            if "api" in analysis.objects:
                files_to_create.append("src/api/new-endpoint.js")
            files_to_modify.append("src/routes/index.js")
        elif domain.id == "frontend":
            if "component" in analysis.objects:
                files_to_create.append("src/components/NewComponent.tsx")
            files_to_modify.append("src/pages/index.tsx")

        return files_to_create, files_to_modify

    def generate_validation_criteria(self, domain: WorkDomain, analysis: RequirementAnalysis) -> List[str]:
        """Generate validation criteria for the agent"""
        criteria = []

        # Add test-related criteria
        criteria.append(f"All tests in {domain.directories[0]} pass")

        # Add action-specific criteria
        if "create" in analysis.actions:
            criteria.append("New functionality is properly implemented")
        if "fix" in analysis.actions:
            criteria.append("Issue is resolved and regression tests added")

        # Add domain-specific criteria
        if domain.id == "backend":
            criteria.append("API endpoints are documented")
        elif domain.id == "frontend":
            criteria.append("Components are responsive and accessible")

        return criteria

    def create_custom_domain(self, analysis: RequirementAnalysis) -> WorkDomain:
        """Create a custom domain when no existing domain matches"""
        return WorkDomain(
            id="custom",
            name="Custom Implementation",
            directories=["src"],
            test_patterns=["*.test.js"],
            estimated_complexity=analysis.complexity,
            base_time=30,
        )

    def to_yaml(self, agent: Agent) -> str:
        """Convert agent to YAML format"""
        agent_dict = {
            "agent_id": agent.agent_id,
            "agent_role": agent.agent_role,
            "focus_area": agent.focus_area,
            "deliverables": {
                "files_to_create": agent.files_to_create,
                "files_to_modify": agent.files_to_modify,
                "validation_criteria": agent.validation_criteria,
            },
            "execution": {
                "complexity": agent.complexity,
                "estimated_time": agent.estimated_time,
                "dependencies": agent.dependencies,
            },
            "requirements": agent.requirements,
        }
        return yaml.dump(agent_dict, default_flow_style=False)


@click.command()
@click.argument("requirement", required=False)
@click.option("--codebase-file", type=click.Path(exists=True), help="Path to codebase structure YAML")
@click.option("--test-file", type=click.Path(exists=True), help="Path to test suite analysis YAML")
@click.option("--output-format", type=click.Choice(["yaml", "console"]), default="console")
def main(requirement: str, codebase_file: str, test_file: str, output_format: str):
    """Generate intelligent agents for requirements"""
    # Load or use default structures
    codebase_structure = {}
    test_suite_analysis = {}

    if codebase_file:
        with open(codebase_file) as f:
            codebase_structure = yaml.safe_load(f)

    if test_file:
        with open(test_file) as f:
            test_suite_analysis = yaml.safe_load(f)

    # Create generator
    generator = IntelligentAgentGenerator(codebase_structure, test_suite_analysis)

    if not requirement:
        # Interactive mode
        console.print("[bold blue]Intelligent Agent Generator[/bold blue]")
        console.print("Enter a requirement to generate an agent specification:")
        requirement = input("> ")

    # Generate agent
    agent = generator.generate_agent_for_requirement(requirement)

    if output_format == "yaml":
        print(generator.to_yaml(agent))
    else:
        console.print("\n[bold green]Generated Agent:[/bold green]")
        console.print(f"ID: {agent.agent_id}")
        console.print(f"Role: {agent.agent_role}")
        console.print(f"Focus Area: {agent.focus_area}")
        console.print(f"Complexity: {agent.complexity}")
        console.print(f"Estimated Time: {agent.estimated_time} minutes")

        if agent.files_to_create:
            console.print("\n[yellow]Files to Create:[/yellow]")
            for file in agent.files_to_create:
                console.print(f"  - {file}")

        if agent.files_to_modify:
            console.print("\n[yellow]Files to Modify:[/yellow]")
            for file in agent.files_to_modify:
                console.print(f"  - {file}")

        console.print("\n[yellow]Validation Criteria:[/yellow]")
        for criteria in agent.validation_criteria:
            console.print(f"  - {criteria}")


if __name__ == "__main__":
    main()
