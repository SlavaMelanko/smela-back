# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portal Backend V2 is a TypeScript backend API built with Bun runtime and Hono framework. It provides authentication, user management, and role-based access control using PostgreSQL (via Neon serverless) with Drizzle ORM.

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** JWT tokens, bcrypt password hashing
- **Validation:** Zod
- **Testing:** Bun's built-in test runner
- **Linting:** ESLint

## Key Commands

### Development

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

## Architecture Overview

### Directory Structure

- `/src/app.ts` - Application entry point
- `/src/server.ts` - Server configuration with middleware setup
- `/src/db/` - Database layer (schema, migrations, seed data)
- `/src/lib/` - Core utilities (crypto, validation, JWT, errors)
- `/src/middleware/` - Express/Hono middleware (auth, logging, rate limiting)
- `/src/repositories/` - Data access layer following repository pattern
- `/src/routes/` - API endpoint handlers organized by domain
  - `/auth/` - Authentication routes (login, signup, password reset, etc.)
  - `/user/` - User-specific routes (profile, settings, etc.)
- `/src/types/` - TypeScript type definitions

### Route Organization

- Public routes: `/` (currently empty)
- Auth routes: `/api/v1/auth/*` (login, signup, email verification, resend verification, password reset)
- Protected routes: `/api/v1/protected/*` (JWT-protected endpoints, allows new users)
- Private routes: `/api/v1/private/*` (JWT-protected endpoints, requires verified users)

### Auth Routes Details

All auth routes accept POST requests:

- `/api/v1/auth/signup` - User registration
- `/api/v1/auth/login` - User authentication
- `/api/v1/auth/verify-email` - Email verification (accepts token in JSON body)
- `/api/v1/auth/resend-verification-email` - Resend verification email
- `/api/v1/auth/request-password-reset` - Request password reset
- `/api/v1/auth/reset-password` - Reset password with token

### Database Schema

Key tables:

- `users` - User accounts with roles and status
- `auth` - Authentication providers (email/password)
- `permissions` - Role-based access control
- `tokens` - Email verification and password reset tokens

### Authentication Flow

1. Signup creates user + auth record + verification token
2. Email verification required before login (frontend handles email link, makes POST to backend)
3. JWT tokens used for authenticated requests (returned in Set-Cookie header)
4. Password reset flow with one-time use tokens
5. Rate limiting applied to auth endpoints

### Frontend-Backend Architecture

- Email links point to frontend URLs (e.g., `https://app.example.com/auth/verify-email?token=...`)
- Frontend extracts tokens from URL and makes POST requests to backend API
- Backend API validates tokens sent in JSON body (not URL parameters)
- This approach prevents tokens from appearing in server logs and provides better security

### Testing Approach

- Tests use `bun:test` framework
- Test files follow `*.test.ts` pattern in `__tests__` directories
- Focus on unit tests for critical components (crypto, auth, rate limiting)

### Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for session management
- One-time use tokens for password reset with expiration
- Email enumeration attack prevention (consistent error responses)
- Rate limiting with different presets for auth vs general endpoints
- Environment variable validation on startup
- Role-based permissions system

### Development Patterns

- Repository pattern for data access
- Clean separation between route handlers and business logic
- Zod schemas for request/response validation
- Structured error handling with custom error classes
- Comprehensive logging with Pino

### Environment Configuration

**Bun Native Environment Loading:**
Bun automatically loads environment files based on `NODE_ENV` without requiring the `dotenv` package. Files are loaded in this order:

1. `.env` - Base configuration (always loaded first)
2. `.env.{NODE_ENV}` - Environment-specific configuration (development/production/staging/test)
3. `.env.local` - Local overrides (not committed to git)
4. `.env.{NODE_ENV}.local` - Environment-specific local overrides (not committed to git)

**Supported Environments:**

- `development` - Local development with debug logging and Ethereal email
- `production` - Production deployment with Resend email
- `staging` - Staging environment (uses production-like settings with Resend email)
- `test` - Test environment with minimal logging

**Base `.env` file (sensitive/shared values):**

- `JWT_SECRET` - Secret for JWT signing (required, sensitive)
- `DB_URL` - PostgreSQL connection string (required, sensitive)
- `EMAIL_RESEND_API_KEY` - Resend service API key (required for staging/production, sensitive)
- `EMAIL_SENDER_PROFILES` - JSON object defining sender profiles (required)
- `COMPANY_NAME` - Company name for emails (default: The Company)
- `COMPANY_SOCIAL_LINKS` - JSON object containing social media links

**Environment-specific files (.env.development, .env.production, .env.staging, .env.test):**

- `LOG_LEVEL` - Logging level (debug/info/error)
- `BE_BASE_URL` - Backend base URL for API endpoints
- `FE_BASE_URL` - Frontend base URL for email links
- `PORT` - Server port (default: 3000, optional)

**Development-specific (.env.development):**

- `EMAIL_ETHEREAL_HOST` - Ethereal SMTP host (smtp.ethereal.email)
- `EMAIL_ETHEREAL_PORT` - Ethereal SMTP port (587)
- `EMAIL_ETHEREAL_USERNAME` - Ethereal account username
- `EMAIL_ETHEREAL_PASSWORD` - Ethereal account password

**Note:** The `NODE_ENV` variable is automatically set based on which environment file is being used and determines:

- Which environment-specific `.env` file is loaded
- Whether to show stack traces in errors (hidden in production/staging)
- Logging configuration (pretty printing in development)
- Email provider selection (Ethereal for development, Resend for staging/production)

#### EMAIL_SENDER_PROFILES Format

Required JSON structure for sender profiles (place in base `.env` file):

```json
{
  "system": {
    "email": "noreply@company.com",
    "name": "Company Name"
  },
  "support": {
    "email": "support@company.com",
    "name": "Support Team"
  },
  "ceo": {
    "email": "ceo@company.com",
    "name": "CEO Name"
  },
  "marketing": {
    "email": "marketing@company.com",
    "name": "Marketing Team"
  }
}
```

#### Example Environment File Structure

```
project/
├── .env                    # Sensitive values (JWT_SECRET, DB_URL, etc.)
├── .env.development        # Development settings (LOG_LEVEL=debug, Ethereal email)
├── .env.production        # Production settings (LOG_LEVEL=info, Resend email)
├── .env.staging           # Staging settings (LOG_LEVEL=info, Resend email)
├── .env.test              # Test settings (LOG_LEVEL=error)
├── .env.local             # Local overrides (optional, not in git)
└── .env.example           # Template for environment setup
```

### Email Configuration

**Development (Ethereal):**
- Uses Ethereal email service for development to avoid sending real emails
- All emails are captured and can be viewed via preview URLs logged to console
- Preview URLs are generated for each sent email (e.g., `https://ethereal.email/message/...`)
- No real emails are sent, perfect for testing email flows

**Production/Staging (Resend):**
- Uses Resend email service for actual email delivery
- Requires `EMAIL_RESEND_API_KEY` to be configured
- Supports multiple sender profiles configured via `EMAIL_SENDER_PROFILES`

**Email Provider Selection:**
- Automatically selects Ethereal for development environment
- Automatically selects Resend for staging and production environments
- Can be overridden by passing explicit provider type to `createEmailProvider()`

### Static File Serving

- Static files served from `/static/*` using built-in Hono/Bun `serveStatic`
- Files located in `./static/` directory
- Includes proper MIME type detection and caching headers
- CORS configured per environment with appropriate origins
