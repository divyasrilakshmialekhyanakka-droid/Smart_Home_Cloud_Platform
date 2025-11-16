# AWS Deployment Guide - SmartHomeCloud Platform

**Minimal step-by-step guide for deploying on AWS EC2 with Amazon RDS (100% Free Tier)**

## Overview

- **EC2**: t3.micro (free tier - 750 hrs/month)
- **RDS**: db.t3.micro (free tier - 750 hrs/month)
- **Cost**: $0/month (first 12 months)
- **Time**: 30-45 minutes

---

## Step 1: Set Up Billing Alert

1. AWS Console → Billing → Billing preferences
2. Enable "Receive Billing Alerts"
3. CloudWatch → Alarms → Create alarm
4. Select "Billing" metric, threshold $0.01
5. Create alarm

---

## Step 2: Create RDS Database

1. AWS Console → RDS → Create database
2. **Engine**: PostgreSQL 14+
3. **Template**: Dev/Test (NOT Production)
4. **Settings**:
   - DB identifier: `smarthome-db`
   - Username: `postgres`
   - Password: Auto-generate (SAVE IT!)
   - Instance: **db.t3.micro** ONLY (free tier)
   - Storage: 20 GB
   - **Disable**: Storage autoscaling, Multi-AZ, Performance Insights, Enhanced Monitoring
   - Backup: 0-1 days
5. **Connectivity**: 
   - Public access: No
   - Security group: Create new `smarthome-rds-sg`
6. Click "Create database"
7. **Wait 5-15 minutes**, then note the **Endpoint**

**Connection string format**:
```
postgresql://postgres:Password@Endpoint:5432/postgres?sslmode=require
```

---

## Step 3: Create EC2 Instance

1. AWS Console → EC2 → Launch instance
2. **Name**: `smarthomecloud-server`
3. **AMI**: Ubuntu Server 22.04 LTS
4. **Instance**: **t3.micro** ONLY (free tier)
5. **Key pair**: Create new `smarthome-key` (download .pem file)
6. **Security group**: Create new `smarthome-ec2-sg`
   - SSH (22): My IP
   - HTTP (80): Anywhere (0.0.0.0/0)
   - HTTPS (443): Anywhere (0.0.0.0/0)
   - Custom TCP (5000): Anywhere (0.0.0.0/0)
7. **Storage**: 20 GB
8. Launch instance
9. Note the **Public IP**

---

## Step 4: Configure Security Groups

1. EC2 → Security Groups → `smarthome-rds-sg`
2. Edit inbound rules → Add rule
3. Type: PostgreSQL, Port: 5432
4. Source: Security group → Select `smarthome-ec2-sg`
5. Save rules

---

## Step 5: Connect to EC2

**Why?** The EC2 instance is just an empty server. You need to SSH into it to:
- Install Node.js, PM2, and other software
- Deploy your application code
- Configure environment variables
- Start the application

```bash
# Set permissions
chmod 400 smarthome-key.pem

# SSH into EC2 (this gives you command line access to the server)
ssh -i smarthome-key.pem ubuntu@YOUR-EC2-IP
```

---

## Step 6: Install Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 and tools
sudo npm install -g pm2
sudo apt install -y build-essential git postgresql-client
```

---

## Step 7: Deploy Application

```bash
# Clone repository
cd ~
git clone <your-repo-url> smarthomecloud
cd smarthomecloud

# Install dependencies
npm install

# Create .env file
nano .env
```

**Add to .env** (replace with your values):
```env
DATABASE_URL=postgresql://postgres:Password@Endpoint:5432/postgres?sslmode=require
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=5000
```

**Save**: `Ctrl+X`, `Y`, `Enter`

```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT version();"

# Set up database schema
npm run db:push

# Build application
npm run build

# Start with PM2
pm2 start npm --name "smarthome" -- start
pm2 save
pm2 startup  # Copy and run the sudo command shown
```

---

## Step 8: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

---

## Step 9: Create Admin User

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"SecurePass123!","firstName":"Admin","lastName":"User"}'

# Promote to admin
psql "$DATABASE_URL" -c "UPDATE users SET role = 'cloud_staff' WHERE email = 'admin@test.com';"
```

---

## Step 10: Access Application

Open browser: `http://YOUR-EC2-IP:5000`

Login with admin credentials from Step 9.

**Done!** 🎉

---

## Optional: Domain & SSL

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/smarthomecloud
```

**Add**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smarthomecloud /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Install SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Useful Commands

```bash
# Application
pm2 status
pm2 logs smarthome
pm2 restart smarthome

# Updates
cd ~/smarthomecloud && git pull && npm install && npm run build && pm2 restart smarthome

# Database
psql "$DATABASE_URL"
npm run db:push
```

---

## Troubleshooting

**App won't start**: `pm2 logs smarthome --err`

**Database connection fails**: 
- Check DATABASE_URL in .env
- Verify security groups allow connection
- Test: `psql "$DATABASE_URL" -c "SELECT 1"`

**Can't access from browser**:
- Check EC2 security group allows port 5000
- Verify app is running: `pm2 status`
- Test locally: `curl http://localhost:5000`

**Unexpected charges**:
- Verify EC2 is t3.micro, RDS is db.t3.micro
- Check RDS: Multi-AZ, Performance Insights, Enhanced Monitoring all disabled
- Monitor in AWS Free Tier dashboard

---

## Cost

**Free Tier (12 months)**: $0/month
- EC2 t3.micro: 750 hrs/month
- RDS db.t3.micro: 750 hrs/month

**After free tier**: ~$22-30/month

---

**That's it! Follow these steps to deploy your application.**
