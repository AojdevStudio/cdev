#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pyyaml>=6.0",
#   "click>=8.1",
#   "rich>=13.0"
# ]
# ///

"""Parallel Claude Development Workflow - Deployment Script"""

import os
import secrets
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()


def run_command(args: List[str], cwd: Optional[Path] = None, check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return the result"""
    result = subprocess.run(args, capture_output=True, text=True, cwd=cwd, check=False)
    if check and result.returncode != 0:
        raise click.ClickException(f"Command failed: {' '.join(args)}\n{result.stderr}")
    return result


def log_info(message: str) -> None:
    """Log info message"""
    console.print(f"[blue][INFO][/blue] {message}")


def log_success(message: str) -> None:
    """Log success message"""
    console.print(f"[green][SUCCESS][/green] {message}")


def log_warning(message: str) -> None:
    """Log warning message"""
    console.print(f"[yellow][WARNING][/yellow] {message}")


def log_error(message: str) -> None:
    """Log error message"""
    console.print(f"[red][ERROR][/red] {message}")


def check_command(command: str) -> bool:
    """Check if a command is available"""
    return shutil.which(command) is not None


def check_prerequisites() -> None:
    """Check if all prerequisites are installed"""
    log_info("Checking prerequisites...")

    prerequisites = {
        "docker": "Docker",
        "docker-compose": "Docker Compose",
        "node": "Node.js",
        "npm": "NPM",
        "git": "Git",
    }

    missing = []
    for cmd, name in prerequisites.items():
        if not check_command(cmd):
            missing.append(name)

    if missing:
        log_error(f"Missing prerequisites: {', '.join(missing)}")
        log_error("Please install the missing tools to continue.")
        sys.exit(1)

    log_success("All prerequisites are met.")


def create_directories(project_dir: Path) -> None:
    """Create necessary directories"""
    log_info("Creating necessary directories...")

    directories = [".linear-cache", "shared/deployment-plans", "workspaces", "../worktrees", "logs", "nginx"]

    for dir_path in directories:
        (project_dir / dir_path).mkdir(parents=True, exist_ok=True)

    log_success("Directories created successfully.")


def setup_environment(project_dir: Path, deployment_env: str) -> None:
    """Set up environment variables"""
    log_info("Setting up environment variables...")

    env_file = project_dir / ".env"
    if not env_file.exists():
        # Generate secure random tokens
        jwt_secret = secrets.token_urlsafe(32)
        encryption_key = secrets.token_urlsafe(32)

        env_content = f"""# Environment Configuration
NODE_ENV={deployment_env}
NEXT_TELEMETRY_DISABLED=1
PORT=3000

# Linear API Configuration
LINEAR_API_KEY={os.environ.get("LINEAR_API_KEY", "")}

# Database Configuration
POSTGRES_PASSWORD={os.environ.get("POSTGRES_PASSWORD", "claudepassword")}
DATABASE_URL=postgresql://claude:${{POSTGRES_PASSWORD}}@postgres:5432/claude_workflow

# Redis Configuration
REDIS_URL=redis://redis:6379

# Application Configuration
CLAUDE_WORKFLOW_VERSION=1.0.0
MONITORING_INTERVAL=30000
CACHE_REFRESH_INTERVAL=300000
HEALTH_CHECK_INTERVAL=60000
CLEANUP_INTERVAL=3600000

# Security Configuration
JWT_SECRET={jwt_secret}
ENCRYPTION_KEY={encryption_key}

# Logging Configuration
LOG_LEVEL={os.environ.get("LOG_LEVEL", "info")}
LOG_FORMAT={os.environ.get("LOG_FORMAT", "json")}
"""
        env_file.write_text(env_content)
        log_success(f"Environment file created at {env_file}")
    else:
        log_info("Environment file already exists.")


def setup_nginx(project_dir: Path) -> None:
    """Set up Nginx configuration"""
    log_info("Setting up Nginx configuration...")

    nginx_dir = project_dir / "nginx"
    nginx_dir.mkdir(exist_ok=True)

    nginx_config = r"""events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_proxied any;
        gzip_comp_level 6;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
        
        # Static file caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri @app;
        }
        
        # API routes
        location /api/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Health check endpoint
        location /health {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # All other routes
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        location @app {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
"""

    (nginx_dir / "nginx.conf").write_text(nginx_config)
    log_success("Nginx configuration created.")


def create_db_init(project_dir: Path) -> None:
    """Create database initialization script"""
    log_info("Creating database initialization script...")

    db_init_sql = """-- Database initialization for Claude Workflow
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agent tracking table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(255) UNIQUE NOT NULL,
    task_id VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'spawned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Task tracking table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Deployment tracking table
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(255) NOT NULL,
    deployment_plan JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_task_id ON agents(task_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_deployments_task_id ON deployments(task_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""

    scripts_dir = project_dir / "scripts"
    scripts_dir.mkdir(exist_ok=True)
    (scripts_dir / "init-db.sql").write_text(db_init_sql)

    log_success("Database initialization script created.")


def deploy_services(project_dir: Path, deployment_env: str, force_rebuild: bool) -> None:
    """Build and deploy services"""
    log_info("Deploying services...")

    os.chdir(project_dir)

    # Build or pull images
    if force_rebuild:
        log_info("Force rebuilding images...")
        run_command(["docker-compose", "build", "--no-cache"])
    else:
        run_command(["docker-compose", "build"])

    # Deploy based on environment
    if deployment_env == "production":
        log_info("Deploying to production...")
        run_command(["docker-compose", "--profile", "production", "up", "-d"])
    elif deployment_env == "development":
        log_info("Deploying to development...")
        run_command(["docker-compose", "--profile", "dev", "up", "-d"])
    else:
        log_info("Deploying default services...")
        run_command(["docker-compose", "up", "-d"])

    log_success("Services deployed successfully.")


def wait_for_services(project_dir: Path) -> None:
    """Wait for services to be ready"""
    log_info("Waiting for services to be ready...")

    os.chdir(project_dir)

    # Wait for database
    log_info("Waiting for database...")
    for _ in range(30):
        result = run_command(
            ["docker-compose", "exec", "postgres", "pg_isready", "-U", "claude", "-d", "claude_workflow"], check=False
        )
        if result.returncode == 0:
            break
        time.sleep(2)
    else:
        log_error("Database failed to start")
        sys.exit(1)

    # Wait for Redis
    log_info("Waiting for Redis...")
    for _ in range(30):
        result = run_command(["docker-compose", "exec", "redis", "redis-cli", "ping"], check=False)
        if result.returncode == 0:
            break
        time.sleep(2)
    else:
        log_error("Redis failed to start")
        sys.exit(1)

    # Wait for application
    log_info("Waiting for application...")
    for _ in range(30):
        result = run_command(["curl", "-f", "-s", "http://localhost:3000/api/health"], check=False)
        if result.returncode == 0:
            break
        time.sleep(2)
    else:
        log_warning("Application health check timed out (may still be starting)")

    log_success("All services are ready.")


def run_health_checks(project_dir: Path) -> bool:
    """Run health checks on deployed services"""
    log_info("Running health checks...")

    os.chdir(project_dir)
    all_healthy = True

    # Check application health
    result = run_command(["curl", "-f", "-s", "http://localhost:3000/api/health"], check=False)
    if result.returncode == 0:
        log_success("Application health check passed.")
    else:
        log_error("Application health check failed.")
        all_healthy = False

    # Check database connection
    result = run_command(
        ["docker-compose", "exec", "postgres", "pg_isready", "-U", "claude", "-d", "claude_workflow"], check=False
    )
    if result.returncode == 0:
        log_success("Database health check passed.")
    else:
        log_error("Database health check failed.")
        all_healthy = False

    # Check Redis connection
    result = run_command(["docker-compose", "exec", "redis", "redis-cli", "ping"], check=False)
    if result.returncode == 0:
        log_success("Redis health check passed.")
    else:
        log_error("Redis health check failed.")
        all_healthy = False

    if all_healthy:
        log_success("All health checks passed.")
    else:
        log_warning("Some health checks failed.")

    return all_healthy


def display_summary(project_dir: Path, deployment_env: str) -> None:
    """Display deployment summary"""
    console.print("\n")
    console.print(Panel.fit("Deployment Summary", style="bold blue"))

    table = Table(show_header=False)
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Environment", deployment_env)
    table.add_row("Project Directory", str(project_dir))
    table.add_row("Application URL", "http://localhost:3000")
    table.add_row("Database", "postgres://claude@localhost:5432/claude_workflow")
    table.add_row("Redis", "redis://localhost:6379")

    console.print(table)

    console.print("\n[yellow]Useful commands:[/yellow]")
    console.print("  Logs:    docker-compose logs -f")
    console.print("  Stop:    docker-compose down")
    console.print("  Restart: docker-compose restart")
    console.print("  Status:  docker-compose ps")


@click.command()
@click.argument("environment", default="development", type=click.Choice(["development", "production"]))
@click.option("--force-rebuild", is_flag=True, help="Force rebuild of Docker images")
@click.option(
    "--command", type=click.Choice(["stop", "restart", "logs", "status", "clean"]), help="Run specific command"
)
def main(environment: str, force_rebuild: bool, command: Optional[str]) -> None:
    """Parallel Claude Development Workflow - Deployment Script

    Deploys the NPX package distribution infrastructure.
    """
    # Get project directory
    script_dir = Path(__file__).parent.resolve()
    project_dir = script_dir.parent

    # Handle specific commands
    if command:
        os.chdir(project_dir)

        if command == "stop":
            log_info("Stopping services...")
            run_command(["docker-compose", "down"])
            log_success("Services stopped.")
        elif command == "restart":
            log_info("Restarting services...")
            run_command(["docker-compose", "restart"])
            log_success("Services restarted.")
        elif command == "logs":
            subprocess.run(["docker-compose", "logs", "-f"], check=False)
        elif command == "status":
            result = run_command(["docker-compose", "ps"])
            console.print(result.stdout)
        elif command == "clean":
            log_info("Cleaning up containers and volumes...")
            run_command(["docker-compose", "down", "-v"])
            run_command(["docker", "system", "prune", "-f"])
            log_success("Cleanup complete.")
        return

    # Main deployment process
    log_info("Starting deployment process...")

    try:
        check_prerequisites()
        create_directories(project_dir)
        setup_environment(project_dir, environment)
        setup_nginx(project_dir)
        create_db_init(project_dir)
        deploy_services(project_dir, environment, force_rebuild)
        wait_for_services(project_dir)
        run_health_checks(project_dir)
        display_summary(project_dir, environment)

        log_success("Deployment completed successfully!")

    except click.ClickException as e:
        log_error(str(e))
        sys.exit(1)
    except Exception as e:
        log_error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
