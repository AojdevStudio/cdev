#!/bin/bash

# Parallel Claude Development Workflow - Deployment Script
# Deploys the NPX package distribution infrastructure

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEPLOYMENT_ENV="${1:-production}"
FORCE_REBUILD="${2:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker to continue."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose to continue."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js to continue."
        exit 1
    fi
    
    # Check NPM
    if ! command -v npm &> /dev/null; then
        log_error "NPM is not installed. Please install NPM to continue."
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install Git to continue."
        exit 1
    fi
    
    log_success "All prerequisites are met."
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "${PROJECT_DIR}/.linear-cache"
    mkdir -p "${PROJECT_DIR}/shared/deployment-plans"
    mkdir -p "${PROJECT_DIR}/workspaces"
    mkdir -p "${PROJECT_DIR}/../worktrees"
    mkdir -p "${PROJECT_DIR}/logs"
    mkdir -p "${PROJECT_DIR}/nginx"
    
    log_success "Directories created successfully."
}

# Set up environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    # Create .env file if it doesn't exist
    if [ ! -f "${PROJECT_DIR}/.env" ]; then
        cat > "${PROJECT_DIR}/.env" << EOF
# Environment Configuration
NODE_ENV=${DEPLOYMENT_ENV}
NEXT_TELEMETRY_DISABLED=1
PORT=3000

# Linear API Configuration
LINEAR_API_KEY=${LINEAR_API_KEY:-}

# Database Configuration
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-claudepassword}
DATABASE_URL=postgresql://claude:\${POSTGRES_PASSWORD}@postgres:5432/claude_workflow

# Redis Configuration
REDIS_URL=redis://redis:6379

# Application Configuration
CLAUDE_WORKFLOW_VERSION=1.0.0
MONITORING_INTERVAL=30000
CACHE_REFRESH_INTERVAL=300000
HEALTH_CHECK_INTERVAL=60000
CLEANUP_INTERVAL=3600000

# Security Configuration
JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
ENCRYPTION_KEY=${ENCRYPTION_KEY:-$(openssl rand -base64 32)}

# Logging Configuration
LOG_LEVEL=${LOG_LEVEL:-info}
LOG_FORMAT=${LOG_FORMAT:-json}
EOF
        log_success "Environment file created at ${PROJECT_DIR}/.env"
    else
        log_info "Environment file already exists."
    fi
}

# Create nginx configuration
setup_nginx() {
    log_info "Setting up Nginx configuration..."
    
    mkdir -p "${PROJECT_DIR}/nginx"
    
    cat > "${PROJECT_DIR}/nginx/nginx.conf" << 'EOF'
events {
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
EOF
    
    log_success "Nginx configuration created."
}

# Create database initialization script
create_db_init() {
    log_info "Creating database initialization script..."
    
    cat > "${PROJECT_DIR}/scripts/init-db.sql" << 'EOF'
-- Database initialization for Claude Workflow
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
EOF
    
    log_success "Database initialization script created."
}

# Build and deploy services
deploy_services() {
    log_info "Deploying services..."
    
    cd "${PROJECT_DIR}"
    
    # Build or pull images
    if [ "$FORCE_REBUILD" = "true" ]; then
        log_info "Force rebuilding images..."
        docker-compose build --no-cache
    else
        docker-compose build
    fi
    
    # Deploy based on environment
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        log_info "Deploying to production..."
        docker-compose --profile production up -d
    elif [ "$DEPLOYMENT_ENV" = "development" ]; then
        log_info "Deploying to development..."
        docker-compose --profile dev up -d
    else
        log_info "Deploying default services..."
        docker-compose up -d
    fi
    
    log_success "Services deployed successfully."
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for database
    log_info "Waiting for database..."
    docker-compose exec postgres pg_isready -U claude -d claude_workflow
    
    # Wait for Redis
    log_info "Waiting for Redis..."
    docker-compose exec redis redis-cli ping
    
    # Wait for application
    log_info "Waiting for application..."
    timeout 60 bash -c 'until curl -f -s http://localhost:3000/api/health; do echo "Waiting for app..."; sleep 2; done'
    
    log_success "All services are ready."
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check application health
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        log_success "Application health check passed."
    else
        log_error "Application health check failed."
        return 1
    fi
    
    # Check database connection
    if docker-compose exec postgres pg_isready -U claude -d claude_workflow > /dev/null; then
        log_success "Database health check passed."
    else
        log_error "Database health check failed."
        return 1
    fi
    
    # Check Redis connection
    if docker-compose exec redis redis-cli ping > /dev/null; then
        log_success "Redis health check passed."
    else
        log_error "Redis health check failed."
        return 1
    fi
    
    log_success "All health checks passed."
}

# Display deployment summary
display_summary() {
    log_info "Deployment Summary"
    echo "===================="
    echo "Environment: $DEPLOYMENT_ENV"
    echo "Project Directory: $PROJECT_DIR"
    echo "Services:"
    docker-compose ps
    echo ""
    echo "Application URL: http://localhost:3000"
    echo "Database: postgres://claude@localhost:5432/claude_workflow"
    echo "Redis: redis://localhost:6379"
    echo ""
    echo "Logs: docker-compose logs -f"
    echo "Stop: docker-compose down"
    echo "Restart: docker-compose restart"
}

# Main deployment process
main() {
    log_info "Starting deployment process..."
    
    check_prerequisites
    create_directories
    setup_environment
    setup_nginx
    create_db_init
    deploy_services
    wait_for_services
    run_health_checks
    display_summary
    
    log_success "Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "production")
        DEPLOYMENT_ENV="production"
        ;;
    "development")
        DEPLOYMENT_ENV="development"
        ;;
    "stop")
        log_info "Stopping services..."
        docker-compose down
        exit 0
        ;;
    "restart")
        log_info "Restarting services..."
        docker-compose restart
        exit 0
        ;;
    "logs")
        docker-compose logs -f
        exit 0
        ;;
    "status")
        docker-compose ps
        exit 0
        ;;
    "clean")
        log_info "Cleaning up containers and volumes..."
        docker-compose down -v
        docker system prune -f
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [environment] [force_rebuild]"
        echo ""
        echo "Environments:"
        echo "  production  - Deploy production environment"
        echo "  development - Deploy development environment"
        echo ""
        echo "Commands:"
        echo "  stop        - Stop all services"
        echo "  restart     - Restart all services"
        echo "  logs        - Show service logs"
        echo "  status      - Show service status"
        echo "  clean       - Clean up containers and volumes"
        echo "  help        - Show this help message"
        echo ""
        echo "Options:"
        echo "  force_rebuild - Force rebuild of Docker images"
        exit 0
        ;;
esac

# Run main function
main "$@"