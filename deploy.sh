#!/bin/bash

# SmartHomeCloud Platform - AWS EC2 Deployment Script
# This script automates the deployment process on a fresh Ubuntu EC2 instance
# 
# Usage:
#   1. SSH into your EC2 instance
#   2. Run: curl -fsSL https://raw.githubusercontent.com/your-repo/deploy.sh | bash
#   OR
#   2. Upload this script to EC2 and run: bash deploy.sh

set -e  # Exit on any error

echo "=========================================="
echo "SmartHomeCloud Platform - AWS Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="smarthomecloud"
APP_DIR="$HOME/$APP_NAME"
NODE_VERSION="20"
PM2_APP_NAME="smarthome"

# Free Tier Notice
echo -e "${YELLOW}=========================================="
echo "AWS FREE TIER DEPLOYMENT"
echo "==========================================${NC}"
echo "This script deploys using 100% Free Tier resources."
echo "Requirements:"
echo "  - EC2: t3.micro or t2.micro (750 hrs/month free)"
echo "  - Database: Neon PostgreSQL (free forever) OR RDS db.t3.micro"
echo ""
echo -e "${YELLOW}Free Tier valid for 12 months from AWS account creation.${NC}"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run this script as root. Run as a regular user (ubuntu).${NC}"
   exit 1
fi

echo -e "${GREEN}Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "${GREEN}Step 2: Installing Node.js ${NODE_VERSION}...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js is already installed: $(node --version)"
fi

echo -e "${GREEN}Step 3: Installing PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 is already installed: $(pm2 --version)"
fi

echo -e "${GREEN}Step 4: Installing build tools...${NC}"
sudo apt install -y build-essential git

echo -e "${GREEN}Step 5: Installing Nginx (for reverse proxy)...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
else
    echo "Nginx is already installed"
fi

echo -e "${GREEN}Step 6: Configuring firewall (UFW)...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000/tcp
sudo ufw --force enable

echo -e "${YELLOW}Step 7: Repository setup${NC}"
echo "Please provide your Git repository URL:"
read -p "Git repository URL (or press Enter to skip): " REPO_URL

if [ -n "$REPO_URL" ]; then
    if [ -d "$APP_DIR" ]; then
        echo "Directory $APP_DIR already exists. Pulling latest changes..."
        cd "$APP_DIR"
        git pull origin main || git pull origin master
    else
        echo "Cloning repository..."
        git clone "$REPO_URL" "$APP_DIR"
        cd "$APP_DIR"
    fi
else
    echo "Skipping repository clone. Please ensure your code is in $APP_DIR"
    if [ ! -d "$APP_DIR" ]; then
        mkdir -p "$APP_DIR"
    fi
    cd "$APP_DIR"
fi

echo -e "${GREEN}Step 8: Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 9: Environment configuration${NC}"
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your actual configuration:${NC}"
        echo "  - DATABASE_URL"
        echo "  - SESSION_SECRET (generate with: openssl rand -base64 32)"
        echo "  - OAuth credentials (optional)"
        echo ""
        read -p "Press Enter after you've configured .env file..."
    else
        echo -e "${RED}Warning: .env.example not found. Creating basic .env file...${NC}"
        cat > .env << EOF
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=5000
EOF
        echo "Please edit .env file with your actual values"
        read -p "Press Enter after you've configured .env file..."
    fi
else
    echo ".env file already exists. Skipping..."
fi

echo -e "${GREEN}Step 10: Setting up database...${NC}"
echo "Pushing database schema..."
npm run db:push || {
    echo -e "${RED}Database push failed. Please check your DATABASE_URL in .env${NC}"
    exit 1
}

echo -e "${GREEN}Step 11: Building application...${NC}"
npm run build

echo -e "${GREEN}Step 12: Configuring PM2...${NC}"
# Stop existing PM2 process if running
pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true

# Start application with PM2
pm2 start npm --name "$PM2_APP_NAME" -- start
pm2 save

# Setup PM2 to start on boot
echo -e "${YELLOW}Setting up PM2 startup script...${NC}"
STARTUP_CMD=$(pm2 startup | grep -oP 'sudo .*' | head -1)
if [ -n "$STARTUP_CMD" ]; then
    eval "$STARTUP_CMD"
fi

echo -e "${GREEN}Step 13: Configuring Nginx reverse proxy...${NC}"
read -p "Enter your domain name (or press Enter to skip Nginx config): " DOMAIN_NAME

if [ -n "$DOMAIN_NAME" ]; then
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    sudo nginx -t && sudo systemctl reload nginx
    
    echo -e "${GREEN}Nginx configured for domain: $DOMAIN_NAME${NC}"
    echo -e "${YELLOW}To set up SSL, run:${NC}"
    echo "  sudo apt install -y certbot python3-certbot-nginx"
    echo "  sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
else
    echo "Skipping Nginx configuration. Application will be accessible on port 5000"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "Application Logs:"
echo "  pm2 logs $PM2_APP_NAME"
echo ""
echo "Application Management:"
echo "  pm2 restart $PM2_APP_NAME  # Restart application"
echo "  pm2 stop $PM2_APP_NAME     # Stop application"
echo "  pm2 monit                  # Monitor in real-time"
echo ""
if [ -n "$DOMAIN_NAME" ]; then
    echo "Access your application at:"
    echo "  http://$DOMAIN_NAME"
    echo ""
    echo "Next steps:"
    echo "  1. Set up SSL certificate: sudo certbot --nginx -d $DOMAIN_NAME"
    echo "  2. Create your first admin user (see DEPLOYMENT.md)"
else
    echo "Access your application at:"
    echo "  http://$(curl -s ifconfig.me):5000"
    echo "  or"
    echo "  http://$(hostname -I | awk '{print $1}'):5000"
fi
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "  1. Ensure your database is accessible from this EC2 instance"
echo "  2. Check security groups allow traffic on ports 80, 443, and 5000"
echo "  3. Review .env file for correct configuration"
echo ""

