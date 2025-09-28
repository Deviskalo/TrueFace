#!/bin/bash

# TrueFace Production Deployment Script
# This script deploys TrueFace to a production environment using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker and try again."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose and try again."
fi

log "Starting TrueFace Production Deployment"

# Check if .env.prod exists
if [[ ! -f .env.prod ]]; then
    warn ".env.prod file not found"
    info "Copying .env.prod.example to .env.prod"
    cp .env.prod.example .env.prod
    warn "Please edit .env.prod with your actual production values before running this script again"
    info "Key values to change:"
    echo "  - JWT_SECRET (use: openssl rand -hex 32)"
    echo "  - MONGO_ROOT_PASSWORD"
    echo "  - REDIS_PASSWORD" 
    echo "  - GRAFANA_PASSWORD"
    echo "  - CORS_ORIGINS (your actual domain)"
    exit 1
fi

# Source the production environment
source .env.prod

# Validate required environment variables
required_vars=("JWT_SECRET" "MONGO_ROOT_PASSWORD" "REDIS_PASSWORD")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        error "Required environment variable $var is not set in .env.prod"
    fi
done

# Check if JWT_SECRET is secure (at least 32 characters)
if [[ ${#JWT_SECRET} -lt 32 ]]; then
    error "JWT_SECRET must be at least 32 characters long for security"
fi

log "Environment validation passed"

# Create necessary directories
log "Creating directory structure"
mkdir -p nginx/ssl
mkdir -p monitoring
mkdir -p scripts
mkdir -p logs/{nginx,backend,frontend}
mkdir -p backups

# Generate self-signed SSL certificate if it doesn't exist
if [[ ! -f nginx/ssl/cert.pem ]] || [[ ! -f nginx/ssl/private.key ]]; then
    warn "SSL certificates not found. Generating self-signed certificate..."
    info "For production, replace with certificates from a trusted CA"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/private.key \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN_NAME:-localhost}"
    
    chmod 600 nginx/ssl/private.key
    chmod 644 nginx/ssl/cert.pem
    
    log "Self-signed SSL certificate generated"
fi

# Stop existing containers
log "Stopping existing containers"
docker-compose -f docker-compose.prod.yml down || true

# Pull latest images
log "Pulling latest base images"
docker-compose -f docker-compose.prod.yml pull

# Build application images
log "Building application images"
docker-compose -f docker-compose.prod.yml build

# Start services
log "Starting production services"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
log "Waiting for services to start..."
sleep 30

# Check service health
log "Checking service health"
services=("trueface_mongo_prod" "trueface_redis_prod" "trueface_backend_prod" "trueface_frontend_prod")

for service in "${services[@]}"; do
    info "Checking $service..."
    if docker ps --filter "name=$service" --filter "status=running" | grep -q $service; then
        log "$service is running"
    else
        error "$service failed to start"
    fi
done

# Test API endpoints
log "Testing API endpoints"
sleep 10

# Test backend health
if curl -f -s http://localhost:8000/health > /dev/null; then
    log "Backend health check passed"
else
    warn "Backend health check failed - check logs with: docker logs trueface_backend_prod"
fi

# Test frontend
if curl -f -s http://localhost:3000 > /dev/null; then
    log "Frontend health check passed"
else
    warn "Frontend health check failed - check logs with: docker logs trueface_frontend_prod"
fi

log "Production deployment completed successfully!"

echo ""
info "Service URLs:"
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs:    http://localhost:8000/docs"
echo "  MongoDB:     localhost:27017"
echo "  Redis:       localhost:6379"
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana:     http://localhost:3001 (admin/${GRAFANA_PASSWORD})"

echo ""
info "Useful commands:"
echo "  View logs:           docker-compose -f docker-compose.prod.yml logs -f [service]"
echo "  Stop services:       docker-compose -f docker-compose.prod.yml down"
echo "  Restart service:     docker-compose -f docker-compose.prod.yml restart [service]"
echo "  View service status: docker-compose -f docker-compose.prod.yml ps"

echo ""
warn "Security Notes:"
echo "  1. Change default passwords in .env.prod"
echo "  2. Use proper SSL certificates from a trusted CA"
echo "  3. Configure firewall to restrict access to necessary ports only"
echo "  4. Regularly update Docker images and dependencies"
echo "  5. Monitor logs and set up alerting"

echo ""
log "Deployment complete! 🚀"
