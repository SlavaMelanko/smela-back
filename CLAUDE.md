# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript backend API built with Bun runtime and Hono framework. It provides authentication, user management, and role-based access control using PostgreSQL (via Neon serverless) with Drizzle ORM.

- **Runtime**: Bun with TypeScript
- **Framework**: Hono web framework
- **Database**: PostgreSQL (serverless)
- **ORM**: Drizzle for type-safe queries
- **Authentication**: JWT, bcrypt password hashing
- **Email**: Transactional email support
- **Validation**: Schema-based validation
- **Security**: Rate limiting, CORS, CSP
- **Testing**: Built-in test runner
- **Code Quality**: ESLint & formatting
- **CI/CD**: GitHub Actions pipeline

## Key Commands

### Development

- `bun run dev` - Start development server with hot reload on port 3000
- `bun run start` - Start production server (NODE_ENV=production)
- `bun run staging` - Start staging server (NODE_ENV=staging)
- `bun test` - Run all tests using Bun's built-in test runner
- `bun test [file]` - Run a specific test file (e.g., `bun test src/routes/auth/login/__tests__/login.test.ts`)
- `bun run email` - Start React Email dev server on port 3001 for email template development

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
- `/src/data/` - Data access layer
  - `/schema/` - Database schema (users, auth, rbac, tokens) with inline enums
  - `/clients/` - Database clients (Neon, future: Redis, S3)
  - `/repositories/` - Repository pattern for data access (auth, token, user)
  - `/migrations/` - Drizzle ORM migrations
  - `seed.ts` - Database seeding script
- `/src/lib/` - Core utilities (cipher, validation, JWT, errors)
- `/src/middleware/` - Express/Hono middleware (auth, logging, rate limiting)
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
- `/api/v1/auth/logout` - User logout (clears JWT cookie)
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

### Database Connection

The project uses **Neon serverless PostgreSQL** with the **WebSocket driver** (`drizzle-orm/neon-serverless`) for full transaction support:

```typescript
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

const pool = new Pool({
  connectionString: env.DB_URL,
  max: env.DB_MAX_CONNECTIONS, // 2 for dev/test, 10 for staging/prod
})
const db = drizzle(pool, { schema, logger: isDevEnv() })
```

**Connection Pool Configuration:**

- **Development/Test**: 2 connections (minimal resource usage, single-user pattern)
- **Staging/Production**: 10 connections (higher throughput for concurrent users)
- Configured via `DB_MAX_CONNECTIONS` environment variable

**Transaction Support:**

```typescript
// Example: Atomic user signup with auth record
await db.transaction(async (tx) => {
  const [user] = await tx.insert(usersTable).values(userData).returning()
  await tx.insert(authTable).values({ userId: user.id, ...authData })
  await tx.insert(tokensTable).values({ userId: user.id, ...tokenData })
})
```

**Important:** The WebSocket driver supports:

- ✅ Interactive transactions
- ✅ Connection pooling with configurable size
- ✅ Prepared statements
- ✅ Session management

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
- Focus on unit tests for critical components (cipher, auth, rate limiting)

#### Testing Philosophy

**Coverage & Focus:**

- Target 60-80% test coverage focusing on **edge cases** rather than 100% coverage
- Prioritize testing error conditions, boundary inputs, and failure scenarios
- Keep tests simple and working - avoid over-engineering test complexity

**Environment Configuration:**

- **Prefer `.env.test` for environment variables** - Let Bun's native environment loading handle test configuration
- **Minimize mocking `@/lib/env`** - Prefer `.env.test` for standard config, but mock when testing edge cases with specific env values
- Only mock business logic dependencies (repositories, cipher, JWT, external services)
- Use global mocks for services (like CAPTCHA) that are already mocked globally

**Self-Contained Tests:**

- Tests should work with `bun install` → set up `.env.test` → `bun test` with env vars
- All required environment variables should be documented in `.env.test`
- No external services or database connections required
- Mock only what's necessary for isolating business logic

**Test Structure & Mocking Conventions:**

Follow this variable declaration order in test `describe` blocks:

```typescript
describe('Test Suite Name', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockPrimitiveConstant: string
  let mockAnotherPrimitive: Date

  let mockUser: any
  let mockUserRepo: any
  let mockTokenRepo: any
  let mockDb: any
  let mockEmailAgent: any

  beforeEach(async () => {
    // Step 1: Initialize primitive constants and base mock data
    mockPrimitiveConstant = 'value'
    mockAnotherPrimitive = new Date()

    // Step 2: Initialize data objects (used by repositories)
    mockUser = { /* ... */ }
    // Step 3: Initialize repository mocks (depend on data objects)
    mockUserRepo = {
      findByEmail: mock(() => Promise.resolve(mockUser)),
    }

    // Step 4: Setup module mocks (depend on repository mocks)
    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
      tokenRepo: mockTokenRepo,
    }))

    // Step 5: Initialize service mocks (small to large)
    mockCipher = {
      comparePasswords: mock(() => Promise.resolve(true)),
    }

    // Step 6: Setup service module mocks
    await moduleMocker.mock('@/lib/cipher', () => mockCipher)
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  it('should update mock behavior', async () => {
    // Update mocks using mockImplementation, NOT moduleMocker.mock()
    mockUserRepo.findByEmail.mockImplementation(() => Promise.resolve(null))
  })
})
```

**Mocking Best Practices:**

1. **Variable Declaration Order & Grouping**:
   - First: `moduleMocker` instance (if needed)
   - Then: Group variables by module/domain with blank lines between groups
   - Order groups to match their initialization order in `beforeEach`
   - Within each group, order variables by their dependency chain (small → large)

   Example:

   ```typescript
   const moduleMocker = new ModuleMocker(import.meta.url)

   let mockSignupParams: any // Test data group

   let mockNewUser: any // @/data module group
   let mockUserRepo: any
   let mockAuthRepo: any
   let mockTransaction: any

   let mockHashedPassword: string // @/lib/cipher module group
   let mockHashPassword: any

   let mockToken: string // @/lib/token module group
   let mockExpiresAt: Date
   let mockGenerateToken: any

   let mockEmailAgent: any // @/lib/email-agent module group
   ```

2. **Initial Mock Setup in `beforeEach`**:
   - **Core Principle**: Define each variable immediately before its first usage
   - **Pattern**: Follow small → large dependency chain within each module group
   - **Goal**: Create a clear, readable flow where dependencies are obvious

   Setup sequence:
   - **Step 1**: Initialize test data and primitive constants
   - **Step 2**: Initialize base data objects that will be used by mocks
   - **Step 3**: Initialize mock objects that depend on the data
   - **Step 4**: Call `moduleMocker.mock()` immediately after defining related mocks
   - **Step 5**: Repeat for each module: primitives → mock objects → `moduleMocker.mock()`

   Example:

   ```typescript
   beforeEach(async () => {
     // Test data
     mockSignupParams = { firstName: 'John', ... }

     // @/data module group
     mockNewUser = { id: 1, ... }
     mockUserRepo = { findByEmail: mock(() => ...) }
     mockAuthRepo = { create: mock(() => ...) }
     await moduleMocker.mock('@/data', () => ({
       userRepo: mockUserRepo,
       authRepo: mockAuthRepo,
     }))

     // @/lib/cipher module group. We don't need to use blank lines within group definition
     mockHashedPassword = '$2b$10$hash123'
     mockHashPassword = mock(() => Promise.resolve(mockHashedPassword))
     // But before `moduleMocker.mock` we should add a blank line
     await moduleMocker.mock('@/lib/cipher', () => ({
       hashPassword: mockHashPassword,
     }))
     // And after `moduleMocker.mock` we need blank line too
     // @/lib/token module group. Again within group no blank lines.
     mockToken = 'token-123'
     mockExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
     mockGenerateToken = mock(() => ({ token: mockToken, expiresAt: mockExpiresAt }))

     await moduleMocker.mock('@/lib/token', () => ({
       generateToken: mockGenerateToken,
     }))
   })
   ```

3. **Module Mocking Rules**:
   - Use `moduleMocker.mock()` ONLY in `beforeEach` for initial module mocking
   - Never use `moduleMocker.mock()` in individual test cases
   - Always define the mock object variable before calling `moduleMocker.mock()` with it
   - Call `moduleMocker.mock()` immediately after defining all related mock objects
   - **Don't mock encapsulated dependencies**: Only mock the public API/wrapper, not the underlying implementation details
     - Example: If you have a wrapper `@/lib/cookie/access-cookie` that uses `hono/cookie`, only mock the wrapper, not `hono/cookie`
     - This prevents tight coupling to implementation details and makes tests more maintainable

4. **Updating Mock Behavior**:
   - Use `mockImplementation()` to update mock behavior in individual tests
   - Use other mock utilities (`mockReturnValue`, `mockResolvedValue`, etc.) as needed
   - This keeps tests clean and prevents mock setup duplication

**Example Dependency Chain**:

```typescript
// Good: Clear dependency chain from small to large
mockUser = { id: 1, email: 'test@example.com' }
mockUserRepo = { findByEmail: mock(() => Promise.resolve(mockUser)) }
await moduleMocker.mock('@/data', () => ({ userRepo: mockUserRepo }))

mockJwtToken = 'token-123'
mockJwt = { default: { sign: mock(() => Promise.resolve(mockJwtToken)) } }
await moduleMocker.mock('@/lib/jwt', () => mockJwt)
```

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

### Service Architecture Patterns

**Modular Service Design Pattern** - Use this pattern for external service integrations (CAPTCHA, payment, SMS, file storage, etc.):

#### 1. Feature Isolation

Create isolated service modules under `/src/services/[service-name]/`:

```text
src/services/captcha/
├── index.ts           # Public API exports only
├── captcha.ts         # Generic interface
├── factory.ts         # Factory method
├── config.ts          # General configuration interface
└── [provider]/        # Provider-specific implementation
    ├── index.ts       # Provider exports
    ├── [provider].ts  # Concrete implementation
    ├── config.ts      # Provider-specific config
    └── [types].ts     # Provider-specific types
```

#### 2. Interface Abstraction

Define generic interfaces that support multiple implementations:

```typescript
// captcha.ts - Generic interface
export interface Captcha {
  validate: (token: string) => Promise<void>
}

// config.ts - General configuration
export interface Config {
  baseUrl: string
  path: string
  headers: Record<string, string>
  secret: string
}
```

#### 3. Helper Interfaces

Create supporting interfaces for data types and configurations:

```typescript
// Provider-specific types
export interface Result {
  'success': boolean
  'challenge_ts'?: string
  'hostname'?: string
  'error-codes'?: string[]
}
```

#### 4. Concrete Implementation

Implement the generic interface with provider-specific logic:

```typescript
// recaptcha/recaptcha.ts
export class Recaptcha implements Captcha {
  constructor(private config: Config) {}

  async validate(token: string): Promise<void> {
    // Provider-specific implementation
  }
}
```

#### 5. Factory Pattern

Provide factory method for service creation:

```typescript
// factory.ts
export const createCaptcha = (): Captcha => {
  return new Recaptcha(recaptchaConfig)
}
```

#### 6. Encapsulation Strategy

Export only public API via index.ts:

```typescript
// index.ts - Public API only
export type { Captcha } from './captcha'
export { createCaptcha } from './factory'
// Implementation details (Recaptcha class) NOT exported
```

#### 7. Usage Pattern

Services should be consumed via factory methods and generic interfaces:

```typescript
// middleware/captcha.ts
import { createCaptcha } from '@/services/captcha'

export const captchaMiddleware = (): MiddlewareHandler => {
  const captcha = createCaptcha() // Single instance for performance

  return async (c, next) => {
    const { captchaToken } = await c.req.json<CaptchaRequestBody>()
    await captcha.validate(captchaToken)
    await next()
  }
}
```

**Benefits:**

- **Extensibility**: Easy to add new providers (hCaptcha, Turnstile)
- **Testability**: Mock interfaces for testing
- **Maintainability**: Clear separation of concerns
- **Performance**: Reusable service instances via closure pattern
- **Type Safety**: Full TypeScript support with proper abstractions

**Use this pattern for:** Payment processors, Email providers, SMS services, File storage, Analytics services, etc.

### Coding Standards

- **ESLint Configuration**: Using @antfu/eslint-config with strict rules
- **File Naming**: Kebab-case for all files (except README.md, CLAUDE.md)
- **Import Style**: Path aliases using `@/` for src directory imports
- **Function Style**: Arrow functions preferred (`const funcName = () => {}`)
- **Code Style**: 2-space indentation, no semicolons, single quotes
- **Curly Braces**: Always required, even for single-line blocks
- **Environment Variables**: Access via `env` object, not `process.env` directly
- **Variable Naming Conventions**:
  - **camelCase**: Objects, arrays, and complex data structures (e.g., `tokenTypeOptions`, `userConfig`)
  - **SCREAMING_SNAKE_CASE**: Primitives and simple constants (e.g., `MAX_RETRY_COUNT`, `API_TIMEOUT`)
  - **PascalCase**: Classes, types, interfaces, and enums (e.g., `UserService`, `Status`, `EmailRenderer`)
- **Export Style**: Use direct exports on declarations instead of collecting exports at the bottom of files
  - Prefer `export interface MyInterface` over `interface MyInterface` + `export { MyInterface }`
  - Prefer `export const myFunction = () => {}` over `const myFunction = () => {}` + `export { myFunction }`
  - Prefer `export default class MyClass` over `class MyClass` + `export { MyClass as default }`
  - Use direct re-exports like `export type { default as TypeName } from './module'` when possible
  - ESLint rule enforces blank lines between export statements for readability

#### Comment Formatting Standards

**Primary Rule**: Prefer descriptive and meaningful names for variables, functions, and classes instead of comments.

**When comments are necessary:**

- **Trailing Comments**: Keep short, no uppercase letter at beginning, no dot at end

  ```typescript
  const timeout = 5000 // milliseconds
  const isValid = checkAuth() // validates JWT token
  ```

- **Full-Line Comments (Single Sentence)**: Start with uppercase letter, no dot at end

  ```typescript
  // Validate user permissions before processing request
  const hasPermission = await checkUserRole(userId)
  ```

- **Full-Line Comments (Multiple Sentences)**: Start with uppercase letter, use dots between sentences but not at the end:

  ```typescript
  // Initialize database connection pool. This ensures optimal performance
  // for concurrent requests. The pool size is configured via environment variables
  const pool = createConnectionPool()
  ```

#### Interface Implementation Naming Convention

When creating interfaces with multiple implementations, follow this naming pattern:

**Interface Files:**

- **Filename**: Use kebab-case ending with the interface concept (e.g., `email-renderer.ts`)
- **Interface Name**: Use PascalCase matching the concept (e.g., `EmailRenderer`)

**Implementation Files:**

- **Filename**: Start with interface filename + implementation name (e.g., `email-renderer-password-reset.ts`, `email-renderer-welcome.ts`)
- **Class Name**: Use PascalCase ending with interface name (e.g., `PasswordResetEmailRenderer`, `WelcomeEmailRenderer`)

**Example Structures:**

_Email Renderers (following new convention):_

```text
src/emails/renderers/
├── email-renderer.ts                    # Interface: EmailRenderer
├── email-renderer-password-reset.ts     # Class: PasswordResetEmailRenderer
├── email-renderer-welcome.ts            # Class: WelcomeEmailRenderer
└── helper.ts                            # Utilities
```

_Email Providers (existing pattern):_

```text
src/services/email/providers/
├── provider.ts                          # Interface: EmailProvider
├── provider-ethereal.ts                 # Class: EtherealEmailProvider
├── provider-resend.ts                   # Class: ResendEmailProvider
├── payload.ts                           # Supporting types
├── factory.ts                           # Factory function
└── index.ts                             # Public exports
```

This convention groups implementations together alphabetically and makes the relationship to the interface explicit.

### Environment Configuration

**Bun Native Environment Loading:**
Bun automatically loads environment files based on `NODE_ENV` without requiring the `dotenv` package. See `.env.example` for complete environment variable documentation, supported environments, and configuration examples.

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

### Middleware Stack Order

Middleware is applied in this specific order in `server.ts`:

1. **Security Headers** - CSP, HSTS, X-Frame-Options, etc.
2. **CORS** - Cross-origin resource sharing configuration
3. **Request ID** - Unique ID generation for request tracking
4. **Logger** - Pino request/response logging
5. **General Size Limiter** - 100KB default request size limit
6. **General Rate Limiter** - 100 requests per 15 minutes
7. **Auth-specific middleware** (for `/api/v1/auth/*`):
   - Size Limiter: 10KB for auth endpoints
   - Rate Limiter: 5 attempts per 15 minutes
8. **Protected route auth** (for `/api/v1/protected/*`): JWT validation, allows new users
9. **Private route auth** (for `/api/v1/private/*`): JWT validation, requires verified users

### CORS Configuration

- **Development**: Automatically allows all localhost ports (`http://localhost:*`, `http://127.0.0.1:*`)
- **Test**: All origins allowed with credentials disabled
- **Staging/Production**: Strict validation requiring `ALLOWED_ORIGINS` environment variable
- **Important**: In production/staging, `ALLOWED_ORIGINS` must be a comma-separated list of allowed frontend URLs

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
ALWAYS remember our specified rules about trailing vs full-line comments formatting
