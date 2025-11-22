#!/bin/bash

# ================================
# SSL Certificate Initialization Script
# For first-time SSL setup (before deploy.sh)
# ================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "================================"
echo "   SSL Certificate Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    log_error ".env file not found!"
    log_info "Please create .env from .env.production.example first"
    exit 1
fi

# Load environment
source .env

if [ -z "$DOMAIN" ]; then
    log_error "DOMAIN not set in .env"
    exit 1
fi

log_info "Domain: $DOMAIN"
log_info "API Domain: api.$DOMAIN"
echo ""

# Check DNS
log_info "Checking DNS records..."

MAIN_IP=$(dig +short $DOMAIN | tail -n1)
API_IP=$(dig +short api.$DOMAIN | tail -n1)

if [ -z "$MAIN_IP" ]; then
    log_error "$DOMAIN does not resolve to an IP address"
    log_info "Please configure your DNS A record first"
    exit 1
fi

if [ -z "$API_IP" ]; then
    log_error "api.$DOMAIN does not resolve to an IP address"
    log_info "Please configure your DNS A record first"
    exit 1
fi

log_success "$DOMAIN → $MAIN_IP"
log_success "api.$DOMAIN → $API_IP"
echo ""

# Create directories
mkdir -p infra/certbot/conf
mkdir -p infra/certbot/www

# Create temporary Nginx config for ACME challenge
log_info "Creating temporary Nginx configuration..."

mkdir -p infra/nginx/temp

cat > infra/nginx/temp/default.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN api.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'ACME challenge ready';
        add_header Content-Type text/plain;
    }
}
EOF

# Start temporary Nginx
log_info "Starting temporary Nginx for ACME challenge..."

docker run -d \
    --name temp-nginx \
    -p 80:80 \
    -v $(pwd)/infra/nginx/temp/default.conf:/etc/nginx/conf.d/default.conf:ro \
    -v $(pwd)/infra/certbot/www:/var/www/certbot:ro \
    nginx:alpine

sleep 3

# Obtain certificates
log_info "Requesting SSL certificates from Let's Encrypt..."

docker run --rm \
    -v $(pwd)/infra/certbot/conf:/etc/letsencrypt \
    -v $(pwd)/infra/certbot/www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d api.$DOMAIN

if [ $? -eq 0 ]; then
    log_success "SSL certificates obtained successfully!"
else
    log_error "Failed to obtain SSL certificates"
    docker stop temp-nginx
    docker rm temp-nginx
    exit 1
fi

# Cleanup
log_info "Cleaning up temporary Nginx..."
docker stop temp-nginx
docker rm temp-nginx
rm -rf infra/nginx/temp

log_success "SSL setup complete!"
echo ""
log_info "You can now run: ./scripts/deploy.sh"
