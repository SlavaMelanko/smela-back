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
- Auth routes: `/auth/*` (login, signup, email verification, resend verification)
- Private routes: `/api/v1/*` (JWT-protected endpoints)

### Database Schema

Key tables:

- `users` - User accounts with roles and status
- `auth` - Authentication providers (email/password)
- `permissions` - Role-based access control
- `tokens` - Email verification and password reset tokens

### Authentication Flow

1. Signup creates user + auth record + verification token
2. Email verification required before login
3. JWT tokens used for authenticated requests
4. Rate limiting applied to auth endpoints

### Testing Approach

- Tests use `bun:test` framework
- Test files follow `*.test.ts` pattern in `__tests__` directories
- Focus on unit tests for critical components (crypto, auth, rate limiting)

### Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for session management
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
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `LOG_LEVEL` - Logging level (default: info)

### Static File Serving

- Static files served from `/static/*` using built-in Hono/Bun `serveStatic`
- Files located in `./static/` directory
- Includes proper MIME type detection and caching headers
- CORS configured per environment with appropriate origins
