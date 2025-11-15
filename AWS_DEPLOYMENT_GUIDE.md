# AWS EC2 Deployment Guide for SmartHomeCloud

## Database Migration Strategy

### Important: Replit Database vs AWS Database

**Replit's PostgreSQL database is NOT portable to AWS EC2.** It's hosted on Replit's infrastructure (Google Cloud Platform) and cannot be directly accessed from external servers in a production-ready manner.

### Migration Options

#### Option 1: Export and Import Data (Recommended)

1. **Export data from Replit PostgreSQL:**
   ```bash
   # From Replit shell, export all tables
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Set up PostgreSQL on AWS:**
   - **Option A:** Use AWS RDS PostgreSQL (managed, recommended)
   - **Option B:** Install PostgreSQL on EC2 instance (self-managed)

3. **Import data to AWS database:**
   ```bash
   # On AWS, import the backup
   psql $NEW_AWS_DATABASE_URL < backup.sql
   ```

4. **Update environment variables:**
   ```bash
   DATABASE_URL=postgresql://user:password@aws-rds-endpoint:5432/dbname
   ```

#### Option 2: AWS RDS Setup (Recommended for Production)

1. Create RDS PostgreSQL instance in AWS Console
2. Configure security groups to allow EC2 access
3. Note connection details (endpoint, port, username, password)
4. Update `DATABASE_URL` in your EC2 environment

### Schema Migration

The application uses Drizzle ORM for schema management. After deploying to AWS:

```bash
# Push schema to new AWS database
npm run db:push
```

This will create all tables based on your `shared/schema.ts` definitions.

## Authentication Migration: Replit Auth → Google OAuth

### Why Change Authentication?

Replit Auth (`ISSUER_URL: https://replit.com/oidc`) only works within Replit's hosting environment. For AWS EC2 deployment, you need a standard OAuth provider.

### Google OAuth Setup

**Implementation Details**: Google OAuth tokens (access_token, refresh_token) are stored in the session, enabling API calls to Google services on behalf of users if needed.

1. **Create Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to Credentials → Create OAuth 2.0 Client ID
   - Set authorized redirect URI: `https://your-domain.com/api/auth/google/callback`
   - Note your Client ID and Client Secret

2. **Environment Variables for AWS EC2:**
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   SESSION_SECRET=your-random-session-secret
   DATABASE_URL=postgresql://user:pass@aws-rds:5432/db
   ```

3. **Application Changes:**
   The application now supports both:
   - Replit Auth (for development on Replit)
   - Google OAuth (for AWS EC2 production deployment)

### Deployment Checklist

- [ ] Export Replit database to SQL file
- [ ] Create AWS RDS PostgreSQL instance
- [ ] Import data to AWS database
- [ ] Set up Google OAuth credentials
- [ ] Configure EC2 environment variables
- [ ] Deploy application code to EC2
- [ ] Run `npm run db:push` to sync schema
- [ ] Test Google OAuth login flow
- [ ] Verify all data migrated correctly

## Data Persistence

Your data structure is defined in `shared/schema.ts` and includes:
- Users (with roles)
- Houses
- Devices
- Alerts
- Maintenance records
- Sensor data
- Surveillance feeds

All of this data will migrate cleanly using `pg_dump` and `psql` import commands.

## Production Considerations

1. **Database Backups:** Set up automated RDS snapshots
2. **Security Groups:** Restrict database access to EC2 security group
3. **SSL/TLS:** Enable SSL connections to RDS
4. **Monitoring:** Use CloudWatch for RDS metrics
5. **Scaling:** Consider RDS read replicas for high traffic
