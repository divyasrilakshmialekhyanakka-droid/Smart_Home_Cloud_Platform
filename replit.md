# SmartHomeCloud - Intelligent Platform for Smart Homes & Senior Care

## Overview

SmartHomeCloud is an AI-powered cloud platform designed for smart home monitoring and senior care surveillance. The system provides real-time audio/video monitoring, IoT device management, and intelligent alert detection for emergency, safety, and security concerns in senior living environments.

The platform serves three distinct user roles:
- **Homeowners**: Configure services, monitor their homes, and receive alerts
- **IoT Team**: Manage and control IoT devices (cameras, sensors) across houses
- **Cloud Staff**: Oversee the entire platform, manage users, monitor system health, and maintain AI service models

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React with TypeScript, using Vite as the build tool

**UI Framework**: Shadcn/ui component library based on Radix UI primitives with Tailwind CSS for styling

**Design Philosophy**: Modern enterprise dashboard aesthetic inspired by Linear, Vercel, and Datadog. The design emphasizes professional restraint, information hierarchy, and role-based clarity suitable for senior care monitoring.

**State Management**: TanStack Query (React Query) for server state management with aggressive caching strategies (staleTime: Infinity) to minimize unnecessary API calls

**Routing**: Wouter for lightweight client-side routing

**Key Design Decisions**:
- Component-based architecture with shared UI components in `/client/src/components/ui`
- Role-based dashboard rendering (homeowner vs cloud staff dashboards)
- Responsive design with mobile-first breakpoints
- Accessibility-focused with semantic HTML and ARIA attributes

### Backend Architecture

**Technology Stack**: Express.js server running on Node.js with TypeScript

**API Design**: RESTful API with role-based access control middleware

**Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple for persistence across server restarts

**Authentication Flow**: 
- Custom email/password authentication using Passport.js with passport-local strategy
- OAuth2 integration for Google, GitHub, X/Twitter, and Apple via respective Passport strategies
- Bcrypt password hashing (10 salt rounds) for secure credential storage
- Session-based authentication with PostgreSQL session store (connect-pg-simple)
- Password management integrated into user administration interface

**Authorization Model**:
- Role-based middleware (`requireRole`) enforces access control at route level
- Three user roles: `homeowner`, `iot_team`, `cloud_staff`
- House ownership validation (`canAccessHouse`) for homeowner-scoped resources
- Cloud staff and IoT team have elevated permissions across all houses
- Production-ready security with zero remaining authorization bypasses (architect-verified)

**Role Permissions Matrix**:

*Homeowners*:
- Read: Own houses, devices, alerts, surveillance feeds
- Create: Alerts (own houses only)
- Update: Alert status (acknowledge/resolve/dismiss own alerts)
- Delete: None

*IoT Team*:
- Read: All houses, devices, alerts, config logs
- Create: Devices
- Update: Devices, alert status
- Delete: Devices

*Cloud Staff*:
- Read: All resources including user management
- Create: All resources
- Update: All resources
- Delete: All resources

**Security Implementation**:
- All API endpoints enforce server-side authorization before data access
- Homeowner data isolation prevents cross-tenant leakage
- Alert creation validates house ownership to prevent spoofing
- Device mutations restricted to technical staff roles
- User management completely restricted to cloud staff
- Database operations restricted to cloud staff and IoT team
- Privilege escalation prevention:
  - Users cannot change their own roles (self-escalation blocked)
  - Promotions to cloud_staff role are blocked (only super-admin can create cloud_staff users)
  - Demotions from cloud_staff role are blocked (prevents unauthorized removal of admins)
  - Cloud_staff users can manage homeowner/iot_team role assignments
  - All blocked role changes logged to userConfigLogs for audit trail
- Input validation using Zod schemas prevents injection attacks
- Session cookies configured with secure flags in production (sameSite: 'lax', httpOnly: true)

**API Structure**:
- `/api/auth/*` - Authentication endpoints (login, logout, user profile)
- `/api/houses` - House management (CRUD operations)
- `/api/devices` - IoT device management
- `/api/alerts` - Alert tracking and acknowledgment
- `/api/users` - User management (cloud staff only)
- `/api/database/*` - Database operations and export functionality

### Data Storage

**Database**: PostgreSQL accessed via Neon serverless driver with WebSocket connections

**ORM**: Drizzle ORM for type-safe database queries with schema-first approach

**Schema Design**:

**Users Table**: Stores user profiles with role-based access levels (homeowner, iot_team, cloud_staff), email/password credentials (bcrypt-hashed), and OAuth provider information (local, google, github, twitter, apple).

**Sessions Table**: Stores session data for authentication persistence across server restarts using connect-pg-simple.

**Houses Table**: Represents physical houses with owner relationships, location data, and property details (square footage, bedrooms, bathrooms).

**Devices Table**: IoT devices with type classification (camera, thermostat, lock, motion_sensor, etc.), status tracking (online/offline), room assignments, and house associations.

**Alerts Table**: AI-generated alerts with severity levels (low, medium, high, critical), types (emergency, safety, security, maintenance, health), status tracking (new, acknowledged, resolved), and device associations.

**Automation Rules**: User-configurable automation rules for device control based on conditions.

**Sensor Data**: Time-series data from IoT sensors for pattern learning.

**Surveillance Feeds**: Metadata for audio/video streams from cameras.

**User Config Logs**: Audit trail for configuration changes made by users.

**Key Schema Decisions**:
- UUID primary keys with `gen_random_uuid()` for distributed scalability
- Nullable `ownerId` on houses to support initial seeding without authentication
- Timestamp tracking (`createdAt`, `updatedAt`) for audit purposes
- Foreign key relationships with cascading deletes where appropriate
- Enum types for constrained values (roles, alert severity, device status)

**Migration Strategy**: Drizzle Kit manages schema migrations with files in `/migrations` directory

### External Dependencies

**Database Service**: Neon serverless PostgreSQL with WebSocket support for connection pooling

**Authentication Providers**: 
- Custom local authentication with email/password
- OAuth2 providers: Google, GitHub, X/Twitter, Apple (configurable via environment variables)
- Session management requires `SESSION_SECRET` environment variable
- OAuth providers require respective client IDs and secrets (optional, falls back to email/password if not configured)

**Deployment Target**: Amazon EC2 (per project requirements)

**UI Components**: Radix UI primitives provide accessible, unstyled components that are styled with Tailwind CSS

**Charts/Visualization**: Recharts library for data visualization (line charts, area charts, bar charts)

**Form Management**: React Hook Form with Zod resolvers for type-safe form validation

**Development Tools**:
- Replit-specific plugins for development environment integration
- Runtime error overlay for debugging
- Hot module replacement via Vite
- TypeScript for type safety across the stack

**Build Process**:
- Frontend: Vite bundles React application to `/dist/public`
- Backend: esbuild bundles Express server to `/dist/index.js`
- Single build command produces production-ready artifacts

**Key Architectural Trade-offs**:
- **Serverless Database**: Chosen for scalability and zero-maintenance PostgreSQL, accepts WebSocket overhead
- **Drizzle ORM**: Lightweight and type-safe, but less feature-rich than Prisma; chosen for simplicity
- **Replit Auth**: Tightly coupled to Replit ecosystem, but provides zero-config authentication
- **Session Storage in DB**: More scalable than in-memory, but adds database load; mitigated by TTL-based cleanup
- **REST over GraphQL**: Simpler to implement for this use case, though GraphQL could reduce over-fetching for complex queries