# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portal Backend V2 is a TypeScript backend API built with Bun runtime and Hono framework. It provides authentication, user management, and role-based access control using PostgreSQL (via Neon serverless) with Drizzle ORM.

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
- `/src/routes/` - API endpoint handlers
- `/src/types/` - TypeScript type definitions

### Route Organization

- Public routes: `/` (currently empty)
- Auth routes: `/auth/*` (login, signup, email verification, resend verification, password reset)
- Private routes: `/api/v1/*` (JWT-protected endpoints)

### Auth Routes Details

All auth routes accept POST requests:
- `/auth/signup` - User registration
- `/auth/login` - User authentication
- `/auth/verify-email` - Email verification (accepts token in JSON body)
- `/auth/resend-verification-email` - Resend verification email
- `/auth/request-password-reset` - Request password reset
- `/auth/reset-password` - Reset password with token

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

Required environment variables:

- `NODE_ENV` - development/production/test
- `DB_URL` - PostgreSQL connection string (Note: uses DB_URL, not DATABASE_URL)
- `JWT_SECRET` - Secret for JWT signing
- `EMAIL_SENDER_PROFILES` - JSON object defining sender profiles for different email types

Optional environment variables with defaults:

- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (default: info)

Additional optional environment variables:

- `BASE_URL` - Base URL for email templates (default: <http://localhost:3000>)
- `COMPANY_NAME` - Company name for emails (default: The Company)
- `EMAIL_RESEND_API_KEY` - Resend service API key for sending emails
- `COMPANY_SOCIAL_LINKS` - JSON object containing social media links for email footers

  ```json
  {
    "twitter": "https://twitter.com/company",
    "facebook": "https://facebook.com/company",
    "linkedin": "https://linkedin.com/company",
    "github": "https://github.com/company"
  }
  ```

#### EMAIL_SENDER_PROFILES Format

Required JSON structure for sender profiles:

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
  },
  "ceo": {
    "email": "ceo@company.com",
    "name": "CEO Name",
    "use": ["announcements", "company-updates"]
  },
  "marketing": {
    "email": "marketing@company.com",
    "name": "Marketing Team",
    "use": ["newsletters", "promotions"]
  }
}
```

### Static File Serving

- Static files served from `/static/*` using built-in Hono/Bun `serveStatic`
- Files located in `./static/` directory
- Includes proper MIME type detection and caching headers
- CORS configured per environment with appropriate origins
