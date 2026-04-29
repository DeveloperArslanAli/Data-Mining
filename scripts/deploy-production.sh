#!/bin/bash

# Data Mining Platform - Production Deployment Script
# This script handles the complete production deployment process

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_NAME="data-mining-platform"
ENVIRONMENT="production"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/${DEPLOYMENT_NAME}"
LOG_FILE="/var/log/${DEPLOYMENT_NAME}/deployment-${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%M-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Error handling
trap 'log_error "Deployment failed. Check logs at: $LOG_FILE"; exit 1' ERR

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command_exists docker; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if ! command_exists curl; then
        log_error "curl is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Function to create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup Docker volumes
    docker run --rm -v "${DEPLOYMENT_NAME}_postgres_data:/data" -v "$BACKUP_DIR:/backup" \
        alpine tar czf "/backup/postgres_backup_${TIMESTAMP}.tar.gz" -C /data .
    
    docker run --rm -v "${DEPLOYMENT_NAME}_redis_data:/data" -v "$BACKUP_DIR:/backup" \
        alpine tar czf "/backup/redis_backup_${TIMESTAMP}.tar.gz" -C /data .
    
    # Backup configuration files
    tar czf "$BACKUP_DIR/config_backup_${TIMESTAMP}.tar.gz" -C "$PROJECT_ROOT" config/
    
    log_success "Backup created at $BACKUP_DIR"
}

# Function to stop current deployment
stop_deployment() {
    log "Stopping current deployment..."
    
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q | grep -q .; then
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" down --timeout 30
        log_success "Current deployment stopped"
    else
        log_warning "No running deployment found"
    fi
}

# Function to pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" pull
    
    log_success "Images pulled successfully"
}

# Function to start deployment
start_deployment() {
    log "Starting production deployment..."
    
    # Start services in order
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d postgres redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 30
    
    # Start other services
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d
    
    log_success "Deployment started"
}

# Function to wait for services to be healthy
wait_for_health() {
    log "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"
        
        if curl -f http://localhost/health >/dev/null 2>&1; then
            log_success "All services are healthy"
            return 0
        fi
        
        log_warning "Services not ready yet, waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Services failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations (if using Alembic)
    if [ -f "$PROJECT_ROOT/backend/alembic.ini" ]; then
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T backend \
            alembic upgrade head
        log_success "Database migrations completed"
    else
        log_warning "No migration configuration found, skipping migrations"
    fi
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if all containers are running
    local running_containers=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q | wc -l)
    local expected_containers=11  # Adjust based on your services
    
    if [ "$running_containers" -eq "$expected_containers" ]; then
        log_success "All containers are running"
    else
        log_error "Expected $expected_containers containers, but $running_containers are running"
        return 1
    fi
    
    # Check service health
    if wait_for_health; then
        log_success "Deployment verification passed"
        return 0
    else
        log_error "Deployment verification failed"
        return 1
    fi
}

# Function to rollback
rollback() {
    log_error "Rolling back deployment..."
    
    # Stop current deployment
    stop_deployment
    
    # Restore from backup
    if [ -f "$BACKUP_DIR/postgres_backup_${TIMESTAMP}.tar.gz" ]; then
        log "Restoring PostgreSQL data..."
        docker run --rm -v "${DEPLOYMENT_NAME}_postgres_data:/data" -v "$BACKUP_DIR:/backup" \
            alpine sh -c "rm -rf /data/* && tar xzf /backup/postgres_backup_${TIMESTAMP}.tar.gz -C /data"
    fi
    
    if [ -f "$BACKUP_DIR/redis_backup_${TIMESTAMP}.tar.gz" ]; then
        log "Restoring Redis data..."
        docker run --rm -v "${DEPLOYMENT_NAME}_redis_data:/data" -v "$BACKUP_DIR:/backup" \
            alpine sh -c "rm -rf /data/* && tar xzf /backup/redis_backup_${TIMESTAMP}.tar.gz -C /data"
    fi
    
    # Start previous deployment
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d
    
    log_success "Rollback completed"
}

# Function to cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups (keeping last 5)..."
    
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    
    log_success "Backup cleanup completed"
}

# Function to display deployment status
show_status() {
    log "Deployment Status:"
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps
    
    echo ""
    log "Service URLs:"
    echo "  Frontend: https://$(hostname)"
    echo "  API: https://$(hostname)/api"
    echo "  Grafana: http://$(hostname):3001"
    echo "  Prometheus: http://$(hostname):9090"
    echo "  Kibana: http://$(hostname):5601"
}

# Main deployment function
main() {
    log "Starting production deployment for $DEPLOYMENT_NAME"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Stop current deployment
    stop_deployment
    
    # Pull latest images
    pull_images
    
    # Start deployment
    start_deployment
    
    # Run migrations
    run_migrations
    
    # Verify deployment
    if verify_deployment; then
        log_success "Production deployment completed successfully!"
        cleanup_backups
        show_status
    else
        log_error "Deployment verification failed, rolling back..."
        rollback
        exit 1
    fi
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "status")
        show_status
        ;;
    "stop")
        stop_deployment
        ;;
    "start")
        start_deployment
        ;;
    "restart")
        stop_deployment
        start_deployment
        ;;
    "rollback")
        rollback
        ;;
    "backup")
        create_backup
        ;;
    "cleanup")
        cleanup_backups
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy    - Full deployment (default)"
        echo "  status    - Show deployment status"
        echo "  stop      - Stop deployment"
        echo "  start     - Start deployment"
        echo "  restart   - Restart deployment"
        echo "  rollback  - Rollback to previous version"
        echo "  backup    - Create backup only"
        echo "  cleanup   - Cleanup old backups"
        echo "  help      - Show this help message"
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
