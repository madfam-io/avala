#!/bin/bash

# ================================
# AVALA LMS - Production Deployment Script
# Phase 6: Deployment Protocol
# ================================

set -e  # Exit on error

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

# Banner
echo "================================"
echo "   AVALA LMS Deployment Script"
echo "   Phase 6: Production Deploy"
echo "================================"
echo ""

# ================================
# Step 1: Pre-flight Checks
# ================================
log_info "Running pre-flight checks..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    log_warning "Not running as root. Some operations may require sudo."
fi

# Check if .env file exists
if [ ! -f .env ]; then
    log_error ".env file not found!"
    log_info "Please create .env from .env.production.example:"
    log_info "  cp .env.production.example .env"
    log_info "  nano .env  # Edit with your production values"
    exit 1
fi

log_success ".env file found"

# Load environment variables
source .env

# Validate required environment variables
REQUIRED_VARS=("DOMAIN" "POSTGRES_PASSWORD" "JWT_SECRET" "SMTP_HOST" "DATABASE_URL")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

log_success "All required environment variables are set"

# Check for placeholder values
if [[ "$JWT_SECRET" == *"CHANGE_ME"* ]] || [[ "$POSTGRES_PASSWORD" == *"CHANGE_ME"* ]]; then
    log_error "Detected placeholder values in .env file!"
    log_info "Please replace all CHANGE_ME values with actual secrets"
    exit 1
fi

log_success "No placeholder values detected"

# ================================
# Step 2: Check Docker Installation
# ================================
log_info "Checking Docker installation..."

if ! command -v docker &> /dev/null; then
    log_warning "Docker not found. Installing Docker..."

    # Install Docker (Ubuntu/Debian)
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh

    log_success "Docker installed successfully"
else
    log_success "Docker is already installed ($(docker --version))"
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    log_error "Docker Compose not found. Please install Docker Compose."
    log_info "Installation guide: https://docs.docker.com/compose/install/"
    exit 1
fi

log_success "Docker Compose is installed ($(docker compose version))"

# ================================
# Step 3: Setup SSL Certificates
# ================================
log_info "Setting up SSL certificates..."

# Create directories for Certbot
mkdir -p infra/certbot/conf
mkdir -p infra/certbot/www

# Check if certificates already exist
if [ -d "infra/certbot/conf/live/$DOMAIN" ]; then
    log_success "SSL certificates already exist for $DOMAIN"
else
    log_info "Obtaining SSL certificates for $DOMAIN and api.$DOMAIN..."

    # Start Nginx temporarily for ACME challenge
    log_info "Starting Nginx for ACME challenge..."
    docker compose -f docker-compose.deploy.yml up -d nginx

    # Wait for Nginx to be ready
    sleep 5

    # Obtain certificates
    log_info "Running Certbot..."
    docker compose -f docker-compose.deploy.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d api.$DOMAIN

    if [ $? -eq 0 ]; then
        log_success "SSL certificates obtained successfully"
    else
        log_error "Failed to obtain SSL certificates"
        log_info "Please check:"
        log_info "  1. DNS records are correctly pointing to this server"
        log_info "  2. Ports 80 and 443 are open in firewall"
        log_info "  3. Domain name is accessible from the internet"
        exit 1
    fi
fi

# ================================
# Step 4: Build and Deploy
# ================================
log_info "Building Docker images..."

docker compose -f docker-compose.deploy.yml build --no-cache

log_success "Docker images built successfully"

log_info "Pulling latest images..."
docker compose -f docker-compose.deploy.yml pull

log_success "Images pulled successfully"

# ================================
# Step 5: Stop Existing Containers
# ================================
log_info "Stopping existing containers..."

docker compose -f docker-compose.deploy.yml down --remove-orphans

log_success "Existing containers stopped"

# ================================
# Step 6: Start Services
# ================================
log_info "Starting AVALA LMS services..."

docker compose -f docker-compose.deploy.yml up -d

log_success "Services started successfully"

# ================================
# Step 7: Wait for Services
# ================================
log_info "Waiting for services to be healthy..."

# Wait for database
log_info "Waiting for PostgreSQL..."
timeout 60 bash -c 'until docker compose -f docker-compose.deploy.yml exec -T postgres pg_isready -U $POSTGRES_USER; do sleep 2; done' || {
    log_error "PostgreSQL failed to start"
    exit 1
}
log_success "PostgreSQL is healthy"

# Wait for API
log_info "Waiting for API..."
sleep 10
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker compose -f docker-compose.deploy.yml exec -T api node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" 2>/dev/null; then
        log_success "API is healthy"
        break
    fi
    ATTEMPT=$((ATTEMPT+1))
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    log_error "API failed to become healthy"
    docker compose -f docker-compose.deploy.yml logs api
    exit 1
fi

# Wait for Web
log_info "Waiting for Web frontend..."
sleep 5
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker compose -f docker-compose.deploy.yml exec -T web node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" 2>/dev/null; then
        log_success "Web frontend is healthy"
        break
    fi
    ATTEMPT=$((ATTEMPT+1))
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    log_error "Web frontend failed to become healthy"
    docker compose -f docker-compose.deploy.yml logs web
    exit 1
fi

# ================================
# Step 8: Run Database Migrations
# ================================
log_info "Running database migrations..."

docker compose -f docker-compose.deploy.yml exec -T api sh -c "cd /app/packages/db && pnpm exec prisma migrate deploy"

if [ $? -eq 0 ]; then
    log_success "Database migrations completed successfully"
else
    log_error "Database migrations failed"
    exit 1
fi

# ================================
# Step 9: Deployment Summary
# ================================
echo ""
echo "================================"
log_success "AVALA LMS Deployed Successfully!"
echo "================================"
echo ""
log_info "Access your application:"
echo "  Web:  https://$DOMAIN"
echo "  API:  https://api.$DOMAIN"
echo ""
log_info "Service Status:"
docker compose -f docker-compose.deploy.yml ps
echo ""
log_info "Useful Commands:"
echo "  View logs:        docker compose -f docker-compose.deploy.yml logs -f"
echo "  Restart services: docker compose -f docker-compose.deploy.yml restart"
echo "  Stop services:    docker compose -f docker-compose.deploy.yml down"
echo "  Update app:       git pull && ./scripts/deploy.sh"
echo ""
log_warning "Next Steps:"
echo "  1. Create your first admin user via API"
echo "  2. Configure your tenant settings"
echo "  3. Set up regular database backups"
echo "  4. Configure monitoring and alerting"
echo ""
