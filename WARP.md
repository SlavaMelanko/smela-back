# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
- `bun run dev` - Start development server with hot reload on port 3000
- `bun test` - Run all tests using Bun's built-in test runner
- `bun test [file]` - Run a specific test file

### Database Operations
- `bun run db:generate` - Generate migration files from schema changes
- `bun run db:migrate` - Apply migrations to database
- `bun run db:seed` - Seed database with initial data
- `bun run db:setup` - Run all database setup steps (generate, migrate, seed)
- `bun run db:studio` - Open Drizzle Studio for database management

### Code Quality
- `bun run lint` - Run ESLint checks
- `bun run lint:fix` - Auto-fix ESLint issues

### Email Development
- `bun run email` - Start React Email development server on port 3001

## Architecture Overview

### Technology Stack
- **Runtime**: Bun (JavaScript/TypeScript runtime)
- **Framework**: Hono (Web framework) 
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod schemas
- **Emails**: React Email with Resend service
- **Testing**: Bun's built-in test runner

### Application Structure

**Core Files**:
- `src/app.ts` - Application entry point
- `src/server.ts` - Server setup with middleware pipeline
- `drizzle.config.ts` - Database configuration

**Key Directories**:
- `src/db/` - Database schema, migrations, and seeding
- `src/lib/` - Core utilities (crypto, validation, JWT, environment)
- `src/middleware/` - Hono middleware (auth, CORS, rate limiting, logging)
- `src/routes/` - API route handlers organized by domain
- `src/repositories/` - Data access layer following repository pattern
- `src/types/` - TypeScript type definitions and enums
- `src/emails/` - React Email templates and configuration

### Route Architecture

**Middleware Pipeline**:
1. CORS middleware
2. Request ID middleware  
3. Logger middleware
4. General rate limiter
5. Auth-specific rate limiter (`/api/v1/auth/*`)
6. Authentication middleware for protected routes

**Route Categories**:
- **Public**: `/api/v1/auth/*` - Authentication endpoints (signup, login, email verification, password reset)
- **Protected (Allow New)**: `/api/v1/protected/*` - Requires JWT, allows new users
- **Private (Verified Only)**: `/api/v1/private/*` - Requires JWT and verified status
- **Static**: `/static/*` - Static file serving

### Authentication System

**User Status Flow**:
1. `new` - Just registered, needs email verification
2. `verified` - Email verified, can access full features  
3. `trial`/`active` - Subscription-based statuses
4. `suspended`/`archived` - Disabled states

**Role Hierarchy**:
- `user` - Standard user access
- `enterprise` - Enhanced user features
- `admin` - Administrative privileges  
- `owner` - Full system control

**Security Features**:
- bcrypt password hashing (10 rounds)
- JWT tokens with configurable expiration
- One-time use tokens for email verification and password reset
- Rate limiting with different presets for auth vs general endpoints
- Email enumeration protection
- Role-based permissions system

### Database Schema Design

**Core Tables**:
- `users` - User profiles with role and status
- `auth` - Authentication providers (email/password, future OAuth)
- `tokens` - Email verification and password reset tokens
- `permissions` - Available actions and resources
- `role_permissions` - Role-based access control mapping

**Key Patterns**:
- Uses PostgreSQL enums for type safety
- Timestamp tracking on all tables
- Proper indexing for performance
- Foreign key constraints for data integrity

### Email System

**Architecture**:
- React Email templates in `src/emails/templates/`
- Resend service integration for delivery
- Configurable sender profiles via `EMAIL_SENDER_PROFILES`
- Frontend-backend token flow (email links point to frontend, frontend posts tokens to backend)

**Token Security**:
- 64-character hexadecimal tokens
- Tokens sent in JSON body (not URL parameters) to prevent log exposure
- One-time use with expiration
- Separate token types for verification vs password reset

### Environment Configuration

**Required Variables**:
- `NODE_ENV` - Environment (development/production/test)
- `DB_URL` - PostgreSQL connection string (note: DB_URL, not DATABASE_URL)
- `JWT_SECRET` - Secret for JWT signing
- `EMAIL_SENDER_PROFILES` - JSON object defining sender profiles

**Email Configuration Example**:
```json
{
  "system": {
    "email": "noreply@company.com", 
    "name": "Company Name",
    "use": ["welcome", "verification", "password-reset"]
  },
  "support": {
    "email": "support@company.com",
    "name": "Support Team", 
    "use": ["help", "feedback", "notifications"]
  }
}
```

### Development Patterns

**Code Organization**:
- Repository pattern separates data access from business logic
- Middleware pipeline with Hono for clean request processing
- Zod schemas for request/response validation
- Custom error classes with centralized error handling
- Structured logging with Pino

**Testing Strategy**:
- Unit tests for critical components (crypto, auth, rate limiting)
- Test files in `__tests__` directories alongside source
- Bun's built-in test runner with `*.test.ts` pattern

**Code Quality**:
- ESLint with @antfu/eslint-config
- No Prettier (ESLint handles formatting)
- TypeScript strict mode enabled
- Path aliases configured (`@/*` maps to `src/*`)

### Frontend Integration Notes

**Email Flow**:
- Backend generates tokens and sends emails with frontend URLs
- Frontend extracts tokens from URL parameters
- Frontend makes POST requests with tokens in JSON body
- This prevents tokens from appearing in server logs

**API Design**:
- RESTful endpoints with consistent response formats
- JWT tokens returned in both response body and Set-Cookie header
- Comprehensive error responses with appropriate HTTP status codes
