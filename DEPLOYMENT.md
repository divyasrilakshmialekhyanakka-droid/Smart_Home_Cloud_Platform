# AWS Deployment Guide - SmartHomeCloud Platform

This guide walks you through deploying the SmartHomeCloud intelligent platform to AWS EC2.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [EC2 Instance Setup](#ec2-instance-setup)
- [Application Deployment](#application-deployment)
- [Environment Configuration](#environment-configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### Required Tools
- AWS Account with EC2 access
- Git installed locally
- SSH key pair for EC2 access
- PostgreSQL database (RDS or external like Neon)
- Domain name (optional, for production)

### Local Setup
```bash
# Clone your repository
git clone <your-repo-url>
cd smarthomecloud

# Install dependencies
npm install
```

## Database Setup

### Option 1: AWS RDS PostgreSQL (Recommended for Production)

1. **Create RDS PostgreSQL Instance:**
   ```
   - Go to AWS Console > RDS
   - Click "Create database"
   - Choose PostgreSQL (version 14 or higher)
   - Template: Production or Dev/Test
   - DB instance identifier: smarthome-db
   - Master username: postgres
   - Master password: <create strong password>
   - Instance class: db.t3.micro (or larger for production)
   - Storage: 20 GB SSD (auto-scaling enabled)
   - VPC: Same as your EC2 instance
   - Public access: No (unless needed)
   - Security group: Allow PostgreSQL (5432) from EC2 security group
   ```

2. **Note the Connection Details:**
   ```
   Endpoint: smarthome-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
   Port: 5432
   Database: postgres
   ```

### Option 2: Neon PostgreSQL (Serverless)

1. **Create Neon Database:**
   - Visit https://neon.tech
   - Create new project: "SmartHomeCloud"
   - Select region closest to your EC2 instance
   - Copy connection string

2. **Connection String Format:**
   ```
   postgres://username:password@hostname/database?sslmode=require
   ```

### Database Migration

Once your database is set up, run migrations:

```bash
# Set your DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Push schema to database
npm run db:push
```

## EC2 Instance Setup

### 1. Launch EC2 Instance

```
- AMI: Ubuntu Server 22.04 LTS
- Instance type: t3.small (minimum) or t3.medium (recommended)
- Key pair: Create or use existing
- Security group:
  - SSH (22) - Your IP only
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0
  - Custom TCP (5000) - 0.0.0.0/0 (if not using reverse proxy)
- Storage: 20 GB gp3
```

### 2. Connect to EC2 Instance

```bash
ssh -i your-key.pem ubuntu@ec2-xx-xx-xx-xx.compute-1.amazonaws.com
```

### 3. Install Node.js and Required Tools

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install build tools
sudo apt install -y build-essential
```

### 4. Configure Firewall (UFW)

```bash
# Enable firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

## Application Deployment

### 1. Clone Repository on EC2

```bash
# Clone your repository
cd ~
git clone <your-repo-url> smarthomecloud
cd smarthomecloud
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Application

```bash
npm run build
```

### 4. Set Environment Variables

Create a `.env` file in the project root:

```bash
nano .env
```

Add the following (replace with your actual values):

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Session
SESSION_SECRET=generate-strong-random-secret-here-use-openssl-rand-base64-32

# OAuth Providers (Optional - for Google, GitHub, Twitter, Apple login)
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback

# Twitter OAuth
TWITTER_CONSUMER_KEY=your-twitter-consumer-key
TWITTER_CONSUMER_SECRET=your-twitter-consumer-secret
TWITTER_CALLBACK_URL=https://yourdomain.com/api/auth/twitter/callback

# Apple OAuth (if needed)
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey.p8
APPLE_CALLBACK_URL=https://yourdomain.com/api/auth/apple/callback

# Server Configuration
NODE_ENV=production
PORT=5000
```

Generate a secure session secret:
```bash
openssl rand -base64 32
```

### 5. Run Database Migrations

```bash
npm run db:push
```

### 6. Start Application with PM2

```bash
# Start the application
pm2 start npm --name "smarthome" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command
```

### 7. Verify Application is Running

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs smarthome

# Test the application
curl http://localhost:5000
```

## SSL/TLS Setup (Production)

### Option 1: Using Nginx + Let's Encrypt (Recommended)

1. **Install Nginx:**
```bash
sudo apt install -y nginx
```

2. **Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/smarthome
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/smarthome /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Install SSL Certificate (Let's Encrypt):**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Option 2: AWS Application Load Balancer (ALB)

1. Create ALB in AWS Console
2. Configure target group pointing to EC2 instance on port 5000
3. Request SSL certificate via AWS Certificate Manager (ACM)
4. Configure ALB listener for HTTPS (443) using ACM certificate
5. Update security groups to allow ALB → EC2 communication

## Environment Configuration

### Create Admin User

After deployment, create your first admin user:

```bash
# SSH into EC2 instance
# Use the API to create admin user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "secure-password-here",
    "firstName": "Admin",
    "lastName": "User"
  }'

# Then manually update the user role in database
# Connect to your database and run:
# UPDATE users SET role = 'cloud_staff' WHERE email = 'admin@yourdomain.com';
```

Or use the PostgreSQL client:

```bash
# Install psql if needed
sudo apt install -y postgresql-client

# Connect to database
psql "$DATABASE_URL"

# Update user role
UPDATE users SET role = 'cloud_staff' WHERE email = 'admin@yourdomain.com';
\q
```

## Monitoring & Maintenance

### PM2 Management

```bash
# View application status
pm2 status

# View logs
pm2 logs smarthome

# Restart application
pm2 restart smarthome

# Stop application
pm2 stop smarthome

# Monitor in real-time
pm2 monit
```

### Application Updates

```bash
# Pull latest changes
cd ~/smarthomecloud
git pull origin main

# Install any new dependencies
npm install

# Rebuild application
npm run build

# Restart with PM2
pm2 restart smarthome
```

### Database Backups

**For RDS:**
- Enable automated backups in RDS console
- Configure backup retention period (7-30 days recommended)

**For Manual Backups:**
```bash
# Backup database
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql "$DATABASE_URL" < backup_file.sql
```

### Log Management

```bash
# PM2 logs are stored in ~/.pm2/logs/
# View logs
pm2 logs --lines 100

# Clear logs
pm2 flush
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart if kernel updated
sudo reboot
```

## Troubleshooting

### Application Won't Start

1. Check PM2 logs: `pm2 logs smarthome --err`
2. Verify environment variables: `cat .env`
3. Test database connection: `npm run db:push`
4. Check port availability: `sudo netstat -tulpn | grep 5000`

### Database Connection Errors

1. Verify DATABASE_URL format
2. Check security group allows connection
3. Test connection: `psql "$DATABASE_URL"`
4. Verify database exists and is accessible

### OAuth Not Working

1. Verify callback URLs match your domain
2. Check OAuth credentials are correct
3. Ensure HTTPS is configured for production
4. Review application logs for OAuth errors

## Security Checklist

- [ ] DATABASE_URL is secure and not exposed
- [ ] SESSION_SECRET is strong and unique
- [ ] SSH access is restricted to your IP
- [ ] Firewall (UFW) is enabled
- [ ] SSL/TLS certificate is configured
- [ ] Regular database backups enabled
- [ ] PM2 startup script configured
- [ ] OAuth credentials are secured
- [ ] Application runs as non-root user
- [ ] Security groups properly configured

## Cost Optimization

### EC2 Instance Sizing
- **Development:** t3.micro ($7-10/month)
- **Small Production:** t3.small ($15-20/month)
- **Medium Production:** t3.medium ($30-40/month)

### RDS Database
- **Development:** db.t3.micro ($15-20/month)
- **Production:** db.t3.small ($30-40/month)

### Alternative: Use Neon PostgreSQL
- Serverless PostgreSQL
- Free tier available
- Pay only for usage
- Automatic scaling

## Support & Resources

- **AWS Documentation:** https://docs.aws.amazon.com
- **PM2 Documentation:** https://pm2.keymetrics.io
- **Nginx Documentation:** https://nginx.org/en/docs/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

---

**Note:** This is a production-grade deployment guide. For development/testing, you can use simpler setups. Always follow security best practices for production deployments.
