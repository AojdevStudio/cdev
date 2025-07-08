#!/bin/bash

# Parallel Claude Development Workflow - Deployment Script
# This script handles deployment of the NPX package and infrastructure

set -e

echo "🚀 Starting Parallel Claude Development Workflow Deployment"

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.yml"
HEALTH_CHECK_URL="http://localhost:3000/health"
MAX_RETRIES=30
RETRY_DELAY=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# Function to wait for service to be healthy
wait_for_service() {
    local service_name=$1
    local url=$2
    local retries=0
    
    print_status "Waiting for $service_name to be healthy..."
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f "$url" &> /dev/null; then
            print_status "$service_name is healthy!"
            return 0
        fi
        
        retries=$((retries + 1))
        print_warning "Attempt $retries/$MAX_RETRIES: $service_name not ready yet. Retrying in $RETRY_DELAY seconds..."
        sleep $RETRY_DELAY
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to validate environment variables
validate_env() {
    print_status "Validating environment variables..."
    
    if [ -z "$LINEAR_API_KEY" ]; then
        print_warning "LINEAR_API_KEY not set. Linear integration will be disabled."
    fi
    
    if [ -z "$CLAUDE_API_KEY" ]; then
        print_warning "CLAUDE_API_KEY not set. Claude integration will be disabled."
    fi
    
    if [ -z "$POSTGRES_PASSWORD" ]; then
        print_warning "POSTGRES_PASSWORD not set. Using default password."
        export POSTGRES_PASSWORD="parallel_password"
    fi
}

# Function to create required directories
create_directories() {
    print_status "Creating required directories..."
    
    mkdir -p shared/.linear-cache
    mkdir -p shared/deployment-plans
    mkdir -p shared/coordination
    mkdir -p logs
    mkdir -p temp
    
    print_status "Directories created successfully"
}

# Function to set script permissions
set_permissions() {
    print_status "Setting script permissions..."
    
    find scripts -name "*.sh" -type f -exec chmod +x {} \;
    
    print_status "Script permissions set"
}

# Function to build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Build the main application
    docker-compose build --no-cache
    
    # Start all services
    docker-compose up -d
    
    print_status "Services started successfully"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check main application
    wait_for_service "Parallel Claude Workflow" "$HEALTH_CHECK_URL"
    
    # Check Redis
    if docker-compose exec redis redis-cli ping | grep -q "PONG"; then
        print_status "Redis is healthy!"
    else
        print_error "Redis health check failed"
        return 1
    fi
    
    # Check PostgreSQL
    if docker-compose exec postgres pg_isready -U parallel_user -d parallel_claude_db | grep -q "accepting connections"; then
        print_status "PostgreSQL is healthy!"
    else
        print_error "PostgreSQL health check failed"
        return 1
    fi
    
    print_status "All health checks passed!"
}

# Function to show deployment summary
show_summary() {
    print_status "Deployment Summary:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Application URL: http://localhost:3000"
    echo "🔴 Redis: localhost:6379"
    echo "🐘 PostgreSQL: localhost:5432"
    echo "📊 Health Check: $HEALTH_CHECK_URL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Test the deployment: curl $HEALTH_CHECK_URL"
    echo "2. View logs: docker-compose logs -f"
    echo "3. Stop services: docker-compose down"
    echo "4. Update: docker-compose pull && docker-compose up -d"
    echo ""
    echo "🎉 Deployment completed successfully!"
}

# Function to handle cleanup on exit
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        print_error "Deployment failed. Cleaning up..."
        docker-compose down --volumes --remove-orphans
    fi
    exit $exit_code
}

# Main deployment function
main() {
    print_status "Starting deployment process..."
    
    # Set up error handling
    trap cleanup EXIT
    
    # Check prerequisites
    check_command "docker"
    check_command "docker-compose"
    check_command "curl"
    
    # Validate environment
    validate_env
    
    # Prepare environment
    create_directories
    set_permissions
    
    # Deploy services
    deploy_services
    
    # Verify deployment
    run_health_checks
    
    # Show summary
    show_summary
    
    print_status "Deployment completed successfully!"
}

# Handle command line arguments
case "$1" in
    "start")
        main
        ;;
    "stop")
        print_status "Stopping services..."
        docker-compose down
        ;;
    "restart")
        print_status "Restarting services..."
        docker-compose down
        main
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "health")
        curl -f "$HEALTH_CHECK_URL" && echo "✅ Service is healthy"
        ;;
    "cleanup")
        print_status "Cleaning up all resources..."
        docker-compose down --volumes --remove-orphans
        docker system prune -f
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|health|cleanup}"
        echo ""
        echo "Commands:"
        echo "  start    - Deploy and start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - Show service logs"
        echo "  health   - Check service health"
        echo "  cleanup  - Clean up all resources"
        exit 1
        ;;
esac