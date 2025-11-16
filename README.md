# SmartHomeCloud - Intelligent Platform for Smart Homes & Senior Care

An AI-powered cloud platform designed for smart home monitoring and senior care surveillance with real-time audio/video monitoring, IoT device management, and intelligent alert detection.

## Features

### 🏠 Multi-Role Architecture
- **Homeowners**: Monitor their homes, view devices, and receive alerts
- **IoT Team**: Manage and control IoT devices across all houses
- **Cloud Staff**: Full platform administration and user management

### 🔐 Secure Authentication
- Custom email/password authentication with bcrypt hashing
- OAuth2 integration (Google, GitHub, Twitter, Apple)
- Session-based authentication with PostgreSQL persistence
- Role-based access control with privilege escalation prevention

### 📱 IoT Device Management
- Support for cameras, thermostats, locks, motion sensors, and more
- Real-time device status monitoring (online/offline)
- Device health trends and analytics
- Room-based organization

### 🚨 Intelligent Alert System
- AI-powered emergency, safety, and security alerts
- Severity-based classification (critical, high, medium, low)
- Real-time alert notifications
- Alert acknowledgment and resolution tracking

### 🎥 Surveillance & Audio Detection
- Audio/video stream metadata management
- AI-powered audio recognition for emergency detection
- Integration with camera devices

### ⚙️ System Configuration
- Platform settings management
- Security controls (2FA, rate limiting, audit logging)
- User access and role management
- Multi-tenancy configuration

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast builds
- **Shadcn/ui** component library
- **TailwindCSS** for styling
- **Wouter** for routing
- **TanStack Query** for server state management

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Passport.js** for authentication
- **Drizzle ORM** for database operations
- **PostgreSQL** for data storage (Neon/RDS)

### Infrastructure
- **PM2** for process management
- **Nginx** for reverse proxy
- **Let's Encrypt** for SSL/TLS
- **AWS EC2** for deployment

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 14+ database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd smarthomecloud
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

4. **Set up database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open http://localhost:5000 in your browser
   - Create your first user account
   - Manually update the user role to `cloud_staff` in the database for admin access

### Creating First Admin User

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@smarthome.com",
    "password": "secure-password",
    "firstName": "Admin",
    "lastName": "User"
  }'

# Update role to cloud_staff
psql "$DATABASE_URL" -c "UPDATE users SET role = 'cloud_staff' WHERE email = 'admin@smarthome.com';"
```

## Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Complete AWS EC2 deployment instructions
- **[Database Setup](DATABASE_SETUP.md)** - Database configuration and management
- **[Git Setup](GIT_SETUP.md)** - Version control and repository management
- **[Project Documentation](replit.md)** - Detailed architecture and technical notes

## Project Structure

```
smarthomecloud/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main application component
│   └── index.html
├── server/                # Backend Express server
│   ├── routes.ts          # API route definitions
│   ├── customAuth.ts      # Authentication logic
│   └── index.ts           # Server entry point
├── shared/                # Shared code between frontend and backend
│   └── schema.ts          # Database schema (Drizzle ORM)
├── migrations/            # Database migrations
├── DEPLOYMENT.md          # AWS deployment guide
├── DATABASE_SETUP.md      # Database setup guide
├── GIT_SETUP.md          # Git and version control guide
└── README.md             # This file
```

## Available Scripts

### Development
- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm start` - Start production server

### Database
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/database

# Session Security
SESSION_SECRET=your-secure-random-secret

# Server
NODE_ENV=production
PORT=5000

# OAuth (Optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
# ... other OAuth providers
```

## Deployment

### Quick Deploy to AWS EC2

1. **Set up EC2 instance** (Ubuntu 22.04 LTS, t3.small or larger)
2. **Install Node.js 20.x and PM2**
3. **Clone repository and install dependencies**
4. **Configure environment variables**
5. **Set up PostgreSQL database** (RDS or Neon)
6. **Build and start application**
7. **Configure Nginx reverse proxy**
8. **Set up SSL with Let's Encrypt**

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed step-by-step instructions.

## Database Schema

### Main Tables
- `users` - User accounts with roles
- `sessions` - Session storage for authentication
- `houses` - Physical properties/houses
- `devices` - IoT devices (cameras, sensors, etc.)
- `alerts` - AI-generated alerts
- `automation_rules` - User-defined automation
- `sensor_data` - Time-series sensor readings
- `surveillance_feeds` - Audio/video stream metadata
- `user_config_logs` - Audit trail for configuration changes

## Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Session-based authentication with secure cookies
- ✅ Role-based access control (RBAC)
- ✅ Privilege escalation prevention
- ✅ SQL injection protection via Drizzle ORM
- ✅ Input validation with Zod schemas
- ✅ HTTPS/TLS encryption (production)
- ✅ Audit logging for configuration changes
- ✅ Database connection over SSL
- ✅ Environment variable protection

## User Roles & Permissions

### Homeowner
- View own houses, devices, and alerts
- Acknowledge and resolve alerts for own houses
- View surveillance feeds for own cameras
- Cannot modify devices or access other houses

### IoT Team
- View and manage all devices across all houses
- View all alerts and surveillance feeds
- Cannot manage users or system configuration
- Focus on device health and technical operations

### Cloud Staff
- Full system access
- User management and role assignment
- System configuration
- Platform administration
- Cannot promote users to cloud_staff (security measure)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized with React Query caching
- Efficient database queries with proper indexing
- WebSocket support for real-time updates
- CDN-ready static assets
- Lazy loading for routes

## Contributing

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Make your changes and commit: `git commit -m 'Add new feature'`
3. Push to the branch: `git push origin feature/new-feature`
4. Create a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- Review documentation in `/docs` folder
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment issues
- Check [DATABASE_SETUP.md](DATABASE_SETUP.md) for database issues

## Roadmap

- [ ] Real-time WebSocket notifications
- [ ] Mobile app (React Native)
- [ ] Advanced AI audio detection models
- [ ] Automation rule builder UI
- [ ] Historical sensor data analytics
- [ ] Multi-language support
- [ ] Dark mode enhancements
- [ ] Video playback and recording

## Changelog

### Version 1.0.0 (Current)
- ✅ Initial release
- ✅ Multi-role authentication system
- ✅ IoT device management
- ✅ Alert system with severity levels
- ✅ Role-based dashboards
- ✅ System configuration interface
- ✅ OAuth2 integration
- ✅ Privilege escalation prevention
- ✅ AWS deployment ready

---

Built with ❤️ for smart home safety and senior care
