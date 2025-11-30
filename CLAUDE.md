# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript backend API built with Bun runtime and Hono framework. It provides authentication, user management, and role-based access control using PostgreSQL with Drizzle ORM.

- **Runtime**: Bun with TypeScript
- **Framework**: Hono web framework
- **Database**: PostgreSQL (Docker)
- **ORM**: Drizzle for type-safe queries
- **Authentication**: JWT, bcrypt password hashing
- **Email**: Transactional email support
- **Validation**: Schema-based validation
- **Security**: Rate limiting, CORS, CSP
- **Testing**: Built-in test runner
- **Code Quality**: ESLint & formatting
- **CI/CD**: GitHub Actions pipeline

## Key Commands

All available commands are defined in [package.json](package.json#L3-L23). Key commands include:

- **Development**: `bun run dev` (hot reload on port 3000), `bun run start` (production), `bun run staging`
- **Testing**: `bun test` (all tests), `bun test [file]` (specific test file), `bun run coverage`, `bun run test:with-db` (start test DB and run tests)
- **Database Dev**: `bun run db:up:dev` (start dev DB), `bun run db:down:dev` (stop dev DB), `bun run db:reset:dev` (reset dev DB), `bun run db:init` (generate + migrate + seed), `bun run db:ui` (Drizzle Studio)
- **Database Test**: `bun run db:up:test` (start test DB on port 5433), `bun run db:down:test` (stop test DB), `bun run db:reset:test` (reset test DB)
- **Code Quality**: `bun run lint`, `bun run lint:fix`, `bun run check` (lint + test)
- **Email Dev**: `bun run emails` (React Email dev server on port 3001)

## Architecture Overview

**For detailed architecture documentation, see [src/README.md](src/README.md)** - Describes the layered architecture, module organization, and dependency rules.

### Directory Structure

- `/src/app.ts` - Application entry point
- `/src/server.ts` - Server configuration with middleware setup
- `/src/data/` - Data access layer
  - `/schema/` - Database schema (users, auth, rbac, tokens) with inline enums
  - `/clients/` - Database clients (PostgreSQL via postgres.js)
  - `/repositories/` - Repository pattern for data access (auth, token, user)
  - `/migrations/` - Drizzle ORM migrations
  - `seed.ts` - Database seeding script
- `/src/security/` - Security-related utilities
  - `/jwt/` - JWT token generation and validation with claims
  - `/password/` - Password hashing, validation, and regex patterns
  - `/token/` - Token generation for email verification and password reset
- `/src/crypto/` - Low-level cryptographic primitives (hashing, random bytes)
- `/src/services/` - External service integrations
  - `/email/` - Email provider abstraction (Ethereal, Resend)
  - `/captcha/` - CAPTCHA verification (reCAPTCHA)
- `/src/emails/` - Email templates and rendering
  - `/templates/` - React Email templates and components
  - `/renderers/` - Email renderer implementations
  - `/content/` - Localized email content (en, uk)
  - `/styles/` - Email styling utilities
- `/src/middleware/` - Hono middleware stack
  - `/auth/` - JWT access token authentication via Authorization header
  - `/captcha/` - CAPTCHA verification middleware
  - `/rate-limiter/` - Rate limiting per endpoint
  - `/size-limiter/` - Request size limits
  - `/secure-headers/` - Security headers (CSP, HSTS, etc.)
  - `/cors/` - CORS configuration
  - `/request-validator/` - Request validation middleware
- `/src/routes/` - API endpoint handlers organized by domain
  - `/@shared/` - Shared route utilities (data validation rules)
  - `/auth/` - Authentication routes (login, signup, password reset, email verification)
  - `/user/` - User-specific routes (profile management)
- `/src/lib/` - Shared utilities (email sender)
- `/src/utils/` - Generic, reusable utilities
  - `/async.ts` - Async/promise utilities (withTimeout, sleepFor, exponentialBackoffDelay)
- `/src/net/http/` - HTTP utilities (cookie handling, status codes)
- `/src/env/` - Environment variable configuration and validation
- `/src/errors/` - Custom error classes
- `/src/handlers/` - Global error handlers
- `/src/logging/` - Pino logger configuration and transports
- `/src/types/` - Shared TypeScript type definitions

### Route Organization

- Public routes: `/` (currently empty)
- Auth routes: `/api/v1/auth/*` (login, signup, email verification, resend verification, password reset)
- User routes: `/api/v1/user/*` (JWT-protected endpoints, allows new users)
- User verified routes: `/api/v1/user/verified/*` (JWT-protected endpoints, requires verified users)
- Admin routes: `/api/v1/admin/*` (JWT-protected endpoints, admin roles only)

### Auth Routes Details

All auth routes accept POST requests:

- `/api/v1/auth/signup` - User registration
- `/api/v1/auth/login` - User authentication
- `/api/v1/auth/logout` - User logout (clears JWT cookie)
- `/api/v1/auth/refresh-token` - Refresh access token (requires refresh token in cookie)
- `/api/v1/auth/verify-email` - Email verification (accepts token in JSON body)
- `/api/v1/auth/resend-verification-email` - Resend verification email
- `/api/v1/auth/request-password-reset` - Request password reset
- `/api/v1/auth/reset-password` - Reset password with token

### Database Schema

Key tables:

- `users` - User accounts with roles and status
- `auth` - Authentication providers (email/password)
- `permissions` - Available actions and resources (e.g., read:user, write:post)
- `role_permissions` - Maps roles to permissions for RBAC
- `tokens` - Email verification and password reset tokens

### Database Connection

The project uses **PostgreSQL running in Docker** with connection pooling via postgres.js (2 connections for dev/test, 10 for staging/prod). Database client is configured in [src/data/clients/db.ts](src/data/clients/db.ts) using Drizzle ORM with full transaction support.

#### Separate Dev and Test Databases

The project maintains separate Docker Compose configurations for development and testing:

- **Development Database** (`docker-compose-dev.yml`)
  - Port: 5432
  - Container: `smela-dev-db`
  - Credentials from `.env.development`
  - Volume: `postgres_data`

- **Test Database** (`docker-compose-test.yml`)
  - Port: 5433 (different from dev to avoid conflicts)
  - Container: `smela-db-test`
  - Credentials from `.env.test`
  - Volume: `postgres_test_data`

This separation allows:
- Running tests while dev server is active
- Independent database states
- Parallel execution in CI/CD pipelines
- Clean test isolation without affecting development data

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

### Testing Philosophy

🧪 Testing Guidelines
• Use bun:test as the testing framework.
• Place test files as `*.test.ts` inside `__tests__` directories.
• Target 60–80% coverage — focus on important logic and edge cases, not full 100%.
• Prioritize testing:
  • Correct scenario(s)
  • Error handling
  • Boundary inputs
  • Failure scenarios
• Keep tests simple, clear, and reliable — avoid over-engineering or redundant mocks.

⚙️ Environment & Configuration
• Use `.env.test` for test-specific environment variables.
• Let Bun’s native env loading handle configuration — no manual dotenv setup needed.
• Minimize mocking `@/env` — rely on `.env.test` by default.
• Only mock env values when testing special or invalid configurations.
• Document all required variables inside `.env.test`.
• Tests should run with: `bun install` -> `bun test` (after .env.test is set up).

🧱 Mocking & Isolation
• Mock only business logic dependencies, e.g.:
  • Repositories
  • External APIs or integrations
• Use global mocks for shared services (e.g., CAPTCHA, email, etc.) — don’t redefine them in each test.
• Avoid real database or network calls — all I/O must be mocked.
• Keep mocks minimal: only mock what’s needed to isolate the logic under test.

✅ Additional Suggestions
• Use factories or fixtures for repetitive test data.
• Prefer unit + integration tests for business logic over full E2E when not necessary.
• Keep one clear arrange → act → assert structure per test.
• Use descriptive test names.
• Always clean up side effects (reset mocks, restore spies) after each test.

👍 Type Safety in Tests
• **Minimize use of `any` type**: Prefer proper TypeScript types even in test files
• **Use type inference**: Let TypeScript infer types when possible instead of explicit `any`
• **Type mock data**: Create proper interfaces or use `Partial<T>` for mock objects
• **Exception**: Use `any` only for complex mocks where full typing would add unnecessary complexity

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

   let mockToken: string // @/security/token module group
   let mockExpiresAt: Date
   let mockGenerateToken: any

   let mockEmailAgent: any // @/lib/email-agent module group
   ```

2. **Initial Mock Setup in `beforeEach`**:
   - **Core Principle**: Use `const` at top level for static test data that never changes, use `let` + `beforeEach` for mocks that need re-initialization
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
   describe('Signup', () => {
     const moduleMocker = new ModuleMocker(import.meta.url)

     // Static test data - never changes across tests
     const VALID_EMAIL = 'test@example.com'
     const VALID_PASSWORD = 'SecurePass123!'
     const HASHED_PASSWORD = '$2b$10$hash123'

     // Mocks that need re-initialization
     let mockSignupParams: any
     let mockNewUser: any
     let mockUserRepo: any
     let mockHashPassword: any

     beforeEach(async () => {
       // Test data
       mockSignupParams = { firstName: 'John', email: VALID_EMAIL, ... }

       // @/data module group
       mockNewUser = { id: 1, email: VALID_EMAIL, ... }
       mockUserRepo = { findByEmail: mock(() => ...) }

       await moduleMocker.mock('@/data', () => ({
         userRepo: mockUserRepo,
       }))

       // @/crypto module group
       mockHashPassword = mock(async () => HASHED_PASSWORD)

       await moduleMocker.mock('@/crypto', () => ({
         hashPassword: mockHashPassword,
       }))
     })
   })
   ```

3. **Module Mocking Rules**:
   - Use `moduleMocker.mock()` ONLY in `beforeEach` for initial module mocking
   - Never use `moduleMocker.mock()` in individual test cases
   - Always define the mock object variable before calling `moduleMocker.mock()` with it
   - Call `moduleMocker.mock()` immediately after defining all related mock objects
   - **Don't mock encapsulated dependencies**: Only mock the public API/wrapper, not the underlying implementation details
     - Example: If you have a wrapper `@/net/http/cookie` that uses `hono/cookie`, only mock the wrapper, not `hono/cookie`
     - This prevents tight coupling to implementation details and makes tests more maintainable

4. **Updating Mock Behavior**:
   - Use `mockImplementation()` to update mock behavior in individual tests
   - Use other mock utilities (`mockReturnValue`, `mockResolvedValue`, etc.) as needed
   - This keeps tests clean and prevents mock setup duplication

**Example Dependency Chain**:

```typescript
// Good: Clear dependency chain from small to large
mockUser = { id: 1, email: 'test@example.com' }
mockUserRepo = { findByEmail: mock(async () => mockUser) }
await moduleMocker.mock('@/data', () => ({ userRepo: mockUserRepo }))

mockJwtToken = 'token-123'
mockJwt = { default: { sign: mock(async () => mockJwtToken) } }
await moduleMocker.mock('@/lib/jwt', () => mockJwt)
```

### Security Considerations

#### Authentication & Authorization

- JWT tokens with role-based access control (User, Enterprise, Admin, Owner)
- **Token Expiration Strategy**:
  - Access tokens: 15 minutes (configurable via JWT_EXPIRATION) - Short-lived for security
  - Refresh tokens: 30 days (configurable via COOKIE_REFRESH_TOKEN_EXPIRATION) - Stored in httpOnly cookies
  - Token rotation: New refresh token generated on each use, old token revoked
  - Rationale: Reduces attack surface, aligns with OAuth 2.0 best practices
- **JWT Secret Rotation Strategy**:
  - Two-secret pattern: `JWT_SECRET` (current) and `JWT_SECRET_PREVIOUS` (optional)
  - Signing: Always uses current secret (`JWT_SECRET`)
  - Verification: Tries current secret first, falls back to previous secret if set
  - Recommended rotation period: 90 days (2-3x longest token lifetime)
  - Grace period: 37 days (30 days max refresh token lifetime + 7 day buffer)
  - Rotation process:
    1. Generate new secret and set as `JWT_SECRET`
    2. Move old secret to `JWT_SECRET_PREVIOUS`
    3. Deploy changes
    4. Wait grace period (37 days)
    5. Remove `JWT_SECRET_PREVIOUS`
  - Zero breaking changes: System works without `JWT_SECRET_PREVIOUS` for backward compatibility
- Flexible authentication support (cookies for web, Bearer tokens for API/mobile)
- bcrypt password hashing with configurable salt rounds (default: 10 rounds)
- Email verification and secure password reset flows
- One-time use tokens for password reset with expiration
- Email enumeration attack prevention (consistent error responses)
- Environment variable validation on startup

#### Request Protection

- Rate limiting: 5 auth attempts/15min (production), 100 requests/15min (general)
- Request size limits: 10KB (auth), 100KB (general), 5MB (uploads)
- CORS with environment-specific origin validation
- Input validation using Zod schemas
- CAPTCHA protection: Google reCAPTCHA v2 (invisible) on auth endpoints

#### Security Headers

- Content Security Policy (CSP) with strict directives
- HSTS, X-Frame-Options, X-Content-Type-Options
- Permissions Policy restricting browser features
- Environment-specific configurations (dev/staging/production)

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
export const createCaptchaVerifier = (): Captcha => {
  return new Recaptcha(recaptchaConfig)
}
```

#### 6. Encapsulation Strategy

Export only public API via index.ts:

```typescript
// index.ts - Public API only
export type { Captcha } from './captcha'
export { createCaptchaVerifier } from './factory'
// Implementation details (Recaptcha class) NOT exported
```

#### 7. Usage Pattern

Services should be consumed via factory methods and generic interfaces:

```typescript
// middleware/captcha.ts
import { createCaptchaVerifier } from '@/services/captcha'

export const captchaMiddleware = (): MiddlewareHandler => {
  const captchaVerifier = createCaptchaVerifier() // Single instance for performance

  return async (c, next) => {
    const { captchaToken } = await c.req.json<CaptchaRequestBody>()
    await captchaVerifier.validate(captchaToken)
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
- **Class Member Ordering**: Enforced via `@typescript-eslint/member-ordering` (see `eslint.config.mjs` for exact ordering)

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

#### Utils Directory Guidelines

The `/src/utils/` directory is for **generic, reusable utilities** that meet strict acceptance criteria to prevent it from becoming a dumping ground.

**Acceptance Criteria for New Utilities:**

1. **Genuinely Generic**: Must not be domain-specific or tied to business logic
2. **Multiple Usage**: Must be used in 2+ places across different modules
3. **Single Responsibility**: Each utility file must have a clear, focused purpose
4. **Well-Documented**: Must include JSDoc with examples and clear parameter descriptions

**Organization Rules:**

- Name files by specific domain: `async.ts`, `string.ts`, `date.ts`
- Avoid vague names like `helpers.ts`, `common.ts`, or `utils.ts`
- One file per utility domain (e.g., all async/promise utilities in `async.ts`)
- Reject utilities that are only used once - co-locate with primary usage instead

**Current Utilities:**

- `async.ts` - Async/promise utilities (`withTimeout`, `sleepFor`, `exponentialBackoffDelay`)

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
8. **User route auth** (for `/api/v1/user/*`): JWT validation, allows new users
9. **User verified route auth** (for `/api/v1/user/verified/*`): JWT validation, requires verified users
10. **Admin route auth** (for `/api/v1/admin/*`): JWT validation, admin roles only

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
