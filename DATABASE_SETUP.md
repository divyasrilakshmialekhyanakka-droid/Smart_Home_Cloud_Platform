# Database Setup Guide

This guide covers database setup for both development and production environments.

## Database Schema Overview

The SmartHomeCloud platform uses PostgreSQL with the following main tables:

- **users** - User accounts with roles (homeowner, iot_team, cloud_staff)
- **sessions** - Session data for authentication persistence
- **houses** - Physical houses/properties
- **devices** - IoT devices (cameras, sensors, thermostats, etc.)
- **alerts** - AI-generated alerts for emergencies and safety
- **automation_rules** - User-configured automation rules
- **sensor_data** - Time-series sensor data
- **surveillance_feeds** - Audio/video stream metadata
- **user_config_logs** - Audit trail for configuration changes

## Prerequisites

- PostgreSQL 14 or higher
- Node.js 20.x
- Database connection URL

## Quick Start

### 1. Set Database Connection

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

### 2. Push Schema to Database

```bash
# Install dependencies first
npm install

# Push schema to database
npm run db:push
```

This command will:
- Connect to your PostgreSQL database
- Create all tables based on the schema in `shared/schema.ts`
- Set up foreign key relationships
- Create necessary indexes

### 3. Verify Schema

```bash
# Connect to your database
psql "$DATABASE_URL"

# List all tables
\dt

# Describe users table
\d users

# Exit psql
\q
```

## Database Options

### Option 1: Neon PostgreSQL (Recommended for Development)

**Pros:**
- Serverless and scalable
- Free tier available
- WebSocket support (required by this app)
- Automatic backups
- Zero maintenance

**Setup:**
1. Go to https://neon.tech
2. Create account and new project
3. Copy connection string
4. Add to `.env` as `DATABASE_URL`

**Connection String Format:**
```
postgresql://username:password@hostname/database?sslmode=require
```

### Option 2: AWS RDS PostgreSQL (Recommended for Production)

**Pros:**
- Fully managed by AWS
- Automatic backups and snapshots
- Multi-AZ deployment for high availability
- Integrated with AWS ecosystem

**Setup:**
See DEPLOYMENT.md for detailed RDS setup instructions.

**Connection String Format:**
```
postgresql://username:password@rds-endpoint.region.rds.amazonaws.com:5432/dbname
```

### Option 3: Self-Hosted PostgreSQL

**Pros:**
- Full control
- No vendor lock-in
- Cost-effective for large deployments

**Setup on Ubuntu:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

postgres=# CREATE DATABASE smarthomecloud;
postgres=# CREATE USER smarthome WITH PASSWORD 'your-secure-password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE smarthomecloud TO smarthome;
postgres=# \q
```

**Connection String:**
```
postgresql://smarthome:your-secure-password@localhost:5432/smarthomecloud
```

## Schema Management

### Understanding the Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM.

Key features:
- Type-safe schema definitions
- Automatic TypeScript types generation
- Support for complex relationships
- Zod validation schemas

### Making Schema Changes

1. **Edit the schema:**
   ```typescript
   // shared/schema.ts
   export const myNewTable = pgTable("my_new_table", {
     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
     name: text("name").notNull(),
     createdAt: timestamp("created_at").defaultNow(),
   });
   ```

2. **Push changes to database:**
   ```bash
   npm run db:push
   ```

3. **If you encounter conflicts:**
   ```bash
   npm run db:push --force
   ```
   ⚠️ **Warning:** `--force` will drop and recreate tables, losing data!

### Production Migrations

For production, use proper migrations instead of `db:push`:

```bash
# Generate migration
npx drizzle-kit generate:pg

# Review the generated migration in /migrations

# Apply migration
npx drizzle-kit push:pg
```

## Seeding Initial Data

### Create First Admin User

After setting up the database, create an admin user:

```bash
# Using curl (if app is running)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@smarthome.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User"
  }'

# Then update role to cloud_staff
psql "$DATABASE_URL" -c "UPDATE users SET role = 'cloud_staff' WHERE email = 'admin@smarthome.com';"
```

### Seed Sample Data (Optional)

For development/testing, you can seed sample houses and devices:

```sql
-- Connect to database
psql "$DATABASE_URL"

-- Insert sample house
INSERT INTO houses (id, name, address, city, state, zip_code, owner_id, square_footage, bedrooms, bathrooms)
VALUES (gen_random_uuid(), 'Smith Residence', '123 Main St', 'Boston', 'MA', '02101', 
        (SELECT id FROM users WHERE email = 'admin@smarthome.com'), 2500, 3, 2);

-- Insert sample devices
INSERT INTO devices (id, house_id, name, type, status, location)
VALUES 
  (gen_random_uuid(), (SELECT id FROM houses LIMIT 1), 'Living Room Camera', 'camera', 'online', 'Living Room'),
  (gen_random_uuid(), (SELECT id FROM houses LIMIT 1), 'Front Door Lock', 'lock', 'online', 'Front Door'),
  (gen_random_uuid(), (SELECT id FROM houses LIMIT 1), 'Thermostat', 'thermostat', 'online', 'Hallway');
```

## Database Maintenance

### Backups

**Automated Backups (RDS):**
- Configure in AWS Console
- Retention: 7-30 days recommended

**Manual Backups:**
```bash
# Backup entire database
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
pg_dump "$DATABASE_URL" -t users -t houses > backup_critical.sql

# Restore from backup
psql "$DATABASE_URL" < backup_file.sql
```

**Automated Backup Script:**
```bash
#!/bin/bash
# Save as backup.sh

BACKUP_DIR="$HOME/db_backups"
mkdir -p "$BACKUP_DIR"

# Create backup
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# Delete backups older than 7 days
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $(date)"
```

Add to crontab for daily backups:
```bash
crontab -e
# Add this line for daily backup at 2 AM
0 2 * * * /home/ubuntu/backup.sh >> /home/ubuntu/backup.log 2>&1
```

### Monitoring

**Check Database Size:**
```sql
SELECT pg_size_pretty(pg_database_size('smarthomecloud')) as db_size;
```

**Check Table Sizes:**
```sql
SELECT 
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

**Check Active Connections:**
```sql
SELECT count(*) FROM pg_stat_activity;
```

### Performance Optimization

**Add Indexes:**
```sql
-- Index on frequently queried columns
CREATE INDEX idx_devices_house_id ON devices(house_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
```

**Analyze Tables:**
```sql
ANALYZE users;
ANALYZE devices;
ANALYZE alerts;
```

**Vacuum Database:**
```sql
VACUUM ANALYZE;
```

## Troubleshooting

### Connection Issues

**Error: Connection timeout**
```bash
# Check if database is accessible
psql "$DATABASE_URL" -c "SELECT 1"

# Check firewall/security groups
# Verify port 5432 is open
```

**Error: SSL required**
```bash
# Add sslmode to connection string
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

**Error: Too many connections**
```sql
-- Check max connections
SHOW max_connections;

-- View current connections
SELECT * FROM pg_stat_activity;

-- Terminate idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < current_timestamp - INTERVAL '5 minutes';
```

### Schema Sync Issues

**Error: Table already exists**
```bash
# Force push schema (⚠️ this will drop existing tables)
npm run db:push -- --force
```

**Error: Column type mismatch**
```bash
# Check current schema
psql "$DATABASE_URL" -c "\d table_name"

# Update schema in shared/schema.ts to match
# Then run db:push
```

### Migration Issues

**Rollback Migration:**
```sql
-- Manual rollback (be careful!)
DROP TABLE IF EXISTS new_table;
ALTER TABLE old_table RENAME TO new_name;
```

## Security Best Practices

1. **Use Strong Passwords:**
   - Minimum 20 characters
   - Mix of letters, numbers, symbols
   - Use password generator

2. **Restrict Access:**
   - Limit database access to application servers only
   - Use security groups/firewall rules
   - Never expose database publicly

3. **Enable SSL:**
   - Always use `sslmode=require` in connection string
   - Use SSL certificates for RDS

4. **Regular Backups:**
   - Automated daily backups
   - Test restore procedures
   - Store backups in separate location

5. **Monitor Access:**
   - Enable query logging
   - Review audit logs regularly
   - Set up alerts for unusual activity

## Connection Pooling

The application uses `@neondatabase/serverless` which includes built-in connection pooling for WebSocket connections.

Configuration is automatic, but you can monitor:

```typescript
// Check pool status in application logs
// Look for connection warnings/errors
```

## Useful SQL Queries

**User Statistics:**
```sql
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
```

**Device Status Summary:**
```sql
SELECT status, COUNT(*) as count 
FROM devices 
GROUP BY status;
```

**Recent Alerts:**
```sql
SELECT * FROM alerts 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Active Sessions:**
```sql
SELECT 
  COUNT(*) as active_sessions,
  COUNT(DISTINCT sess->>'user_id') as unique_users
FROM sessions
WHERE expire > NOW();
```

---

For deployment-specific database setup, see **DEPLOYMENT.md**.
