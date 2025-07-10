# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a backend API server built with Bun runtime and Hono framework, featuring user authentication, role-based access control, and email verification. The project uses PostgreSQL with Drizzle ORM for data persistence and follows a clean, layered architecture.

## Key Commands

### Development

```bash
bun run dev          # Start development server with hot reload on http://localhost:3000
bun run lint         # Run ESLint to check code quality
bun run lint:fix     # Auto-fix linting issues
```

### Database Management

```bash
bun run db:generate  # Generate new migration files from schema changes
bun run db:migrate   # Apply pending migrations to database
bun run db:seed      # Seed database with initial data
bun run db:setup     # Full database setup (generate + migrate + seed)
bun run db:studio    # Open Drizzle Studio for visual database management
```

### Environment Setup

Create a `.env` file with:

```bash
NODE_ENV=development
JWT_SECRET=your-secret-key-at-least-10-chars
DB_URL=postgresql://user:pass@host/dbname
LOG_LEVEL=info
```

## Architecture Overview

### Core Technologies

- **Runtime**: Bun (not Node.js)
- **Framework**: Hono (lightweight web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with Bearer tokens (1-hour expiration)
- **Validation**: Zod schemas
- **Logging**: Pino structured logging

### Project Structure

- `src/routes/` - API endpoints organized by feature
- `src/repositories/` - Data access layer with type-safe queries
- `src/middleware/` - Auth, logging, and error handling middleware to simplify dev life
- `src/lib/` - Core utilities (crypto, validation, JWT, env config)
- `src/db/` - Database schema and migrations
- `src/types/` - TypeScript type definitions

### Key Patterns

1. **Controller-Service-Repository Pattern**

- **Controller (a.k.a. Handler)**
  Each route has a `handler.js` (or `.ts`) file that acts as the entry point for an API request. It:

  - Has access to the request `context`
  - Parses and validates query/body parameters using Zod
  - Calls the corresponding service function with clean, validated data
  - Sends the final response using the same `context`
  - **Note**: Error handling is centralized via the `onError` middleware, so no `try/catch` is needed in the handler

- **Service**
  The service file shares the route name and contains the business logic. It:

  - Coordinates multiple repositories
  - Applies any domain-specific rules
  - Returns pure data without concern for HTTP or response formatting

- **Repository**
  All DB interactions go through repositories located in `src/repositories/`. Repositories:
  - Contain SQL queries or ORM logic
  - Define and export query result types
  - Assume data is already validated — no need to validate input again

1. **Middleware Pipeline**

- Use middlewares for cross-cutting concerns like:

  - Authentication (`authMiddleware`)
  - Logging
  - Error handling (`onError`)
  - Request timing, rate limiting, etc.

- Middleware order matters; `authMiddleware` must come before private route logic.

1. **Factory Pattern**

- Used for:
  - Creating token generators (`createTokenGenerator`)
  - Encoding/decoding utilities (e.g., for crypto, base64, etc.)
- Promotes testability and encapsulates implementation details

1. **Strict TypeScript**

- Type safety is enforced project-wide
- Use `@/` as a path alias for `src/`
- Zod schemas act as a bridge between runtime validation and static typing
- Always prefer `unknown` over `any` when input shape is uncertain

### Authentication Flow

1. **Signup**: Creates user + auth record, sends verification email token
2. **Email Verification**: Validates secure token, activates user account
3. **Login**: Validates credentials, returns JWT token
4. **Protected Routes**: JWT middleware validates Bearer token

### Database Schema

- **Users**: Core user data with roles (User/Admin) and status (Active/Inactive/Suspended)
- **Auth**: Supports multiple auth providers (Local, Google, GitHub, etc.)
- **Permissions**: RBAC with actions, resources, and role mappings
- **Secure Tokens**: Email verification and password reset tokens

### Important Notes

- No testing framework currently configured
- Use Drizzle migrations for all schema changes
- Environment variables are validated with Zod on startup
- All timestamps use UTC timezone
- Password hashing uses bcrypt with configurable rounds

### API Testing

A Postman collection is available at `portal-v2.postman_collection.json` with example requests for all endpoints.

## Standard Workflow

1. **Understand the Problem**

   - Start by reading the relevant parts of the codebase.
   - Write a plan in `tasks/todo.md` describing what needs to be done.

2. **Plan with Todo List**

   - Include a checklist of specific, actionable TODO items.
   - Structure the list so each item represents a small, testable change.

3. **Get Plan Approval**

   - Before coding, check in with me for plan review and approval.

4. **Work Iteratively**

   - Start with the first TODO item only.
   - After completing it, submit the change for review.
   - Wait for feedback. I’ll let you know whether to proceed to the next item or revise.
   - We may iterate on each item before moving forward.

5. **Explain As You Go**

   - For each step, write a short, high-level summary of what changed and why.
   - Optionally list possible future improvements or known limitations (no need to implement them yet).

6. **Keep It Simple**

   - Apply the [SOLID principles](https://en.wikipedia.org/wiki/SOLID) — especially the Single Responsibility Principle.
   - Favor clean, readable, and minimal changes.
   - Avoid premature abstractions or over-engineering.
   - Be intentional with naming (variables, functions, components) — clear naming matters!
   - No secrets and any sensitive data in the code - use `.env` file.

7. **Document Final Summary**

   - Add a `## Review` section at the bottom of `tasks/todo.md`:
     - List completed tasks
     - Summarize key changes
     - Note trade-offs or follow-up suggestions

8. **Post-Work Reflection (Optional but encouraged)**
   - After completing all items, write a short debrief on what went well and what could be improved in future iterations.
