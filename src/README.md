# Source Code Architecture

This document describes the modular architecture and layer organization of the application.

## Architectural Style

The application follows **Layered Architecture** (also known as Onion Architecture) with strict dependency rules:

- Each layer can only depend on layers below it
- Lower layers have no knowledge of higher layers
- Dependency flow: Layer 4 → Layer 3 → Layer 2 → Layer 1.5 → Layer 1

## Layer Overview

### 🌐 Layer 4: Presentation Layer (HTTP Interface)

**Purpose**: Handle HTTP requests and responses, translate between HTTP and application logic.

**Modules**:

- `routes/` - HTTP route handlers (thin wrappers around use cases)
- `middleware/` - HTTP middleware (authentication, validation, rate limiting, security headers, CORS)
- `handlers/` - Global error handlers (Hono-specific)

**Key Principle**: Routes should be thin HTTP adapters with no business logic.

---

### 🎯 Layer 3: Application Layer (Business Workflows)

**Purpose**: Orchestrate business workflows and use cases, coordinate between infrastructure services.

**Modules**:

- `use-cases/` - Business logic and application workflows
  - `use-cases/auth/` - Authentication workflows (login, signup, password reset, email verification)
  - `use-cases/user/` - User management workflows (profile operations)

**Key Principle**: Use cases are framework-agnostic and can be called from routes, CLI, background jobs, or any other interface.

---

### 🔌 Layer 2: Infrastructure Layer (External Integrations)

**Purpose**: Integrate with external systems and manage data persistence.

#### Layer 2a: External Services

**Modules**:

- `services/` - External service adapters
  - `services/captcha/` - CAPTCHA verification (reCAPTCHA)
  - `services/email/` - Email providers (Ethereal for dev, Resend for prod) + `emails/` - Email templates and rendering (React Email components)

**Key Principle**: Services are "dumb adapters" that don't contain business logic.

#### Layer 2b: Persistence

**Modules**:

- `data/` - Database layer
  - `data/schema/` - Database schemas (users, auth, permissions, tokens)
  - `data/repositories/` - Repository pattern for data access
  - `data/clients/` - Database clients (Neon serverless PostgreSQL)
  - `data/migrations/` - Drizzle ORM migrations

**Key Principle**: Persistence layer encapsulates all database concerns.

---

### 🛠️ Layer 1.5: Technical Capabilities Layer (Reusable Technical Utilities)

**Purpose**: Provide infrastructure-level primitives (HTTP, security) that are reusable across the application.

**Modules**:

- `net/` - Networking primitives
  - `net/http/` - HTTP client, cookie handling, status codes
- `security/` - Security primitives
  - `security/jwt/` - JWT token generation and validation
  - `security/password/` - Password hashing and validation
  - `security/token/` - Token generation for email verification and password reset

**Key Principle**: Technical layer provides reusable infrastructure building blocks.

---

### 🧱 Layer 1: Foundation Layer (Pure Primitives)

**Purpose**: Provide fundamental primitives with zero internal dependencies (only external packages).

**Modules**:

- `env/` - Environment configuration and validation
- `errors/` - Custom error classes and error registry
- `types/` - Shared TypeScript type definitions (HttpStatus, Role, Status, Action, Resource)
- `utils/` - Generic reusable utilities (async helpers, date utilities)
- `crypto/` - Low-level cryptographic primitives (hashing, random bytes)
- `logging/` - Core logger configuration (Pino with console transport)

**Key Principle**: Foundation modules are the most stable and reusable parts of the codebase.

---

## Special Modules

### Context

- `context/` - Hono application context type definitions (shared across layers)

---

## Module Dependency Rules

### ✅ Allowed Dependencies

```text
Layer 4 (routes, middleware)
  ↓ can depend on
Layer 3 (use-cases)
  ↓ can depend on
Layer 2 (services, data)
  ↓ can depend on
Layer 1.5 (net, security)
  ↓ can depend on
Layer 1 (env, errors, types, utils, crypto, logging)
  ↓ can depend on
External Packages (npm, bun)
```

### ❌ Forbidden Dependencies

- Foundation layer (Layer 1) **cannot** import from any higher layer
- Technical layer (Layer 1.5) **cannot** import from Layer 2, 3, or 4
- Infrastructure layer (Layer 2) **cannot** import from Layer 3 or 4
- Application layer (Layer 3) **cannot** import from Layer 4

---

## Architecture Benefits

1. **Maintainability**: Clear separation of concerns, easy to locate code
2. **Testability**: Test business logic without HTTP/database dependencies
3. **Flexibility**: Easy to swap frameworks, databases, or external services
4. **Scalability**: Modular structure supports growth and team collaboration
5. **Reusability**: Foundation and technical layers are highly reusable
6. **Framework Independence**: Business logic has no framework dependencies

---

## Example: Request Flow

```text
1. HTTP Request
   ↓
2. Middleware (Layer 4)
   ↓ (authentication, validation, rate limiting)
3. Route Handler (Layer 4)
   ↓ (extract request data, call use case)
4. Use Case (Layer 3)
   ↓ (business logic, orchestration)
5. Repository / Service (Layer 2)
   ↓ (data access, external calls)
6. Database / External API
   ↓
7. Response flows back up the stack
   ↓
8. HTTP Response
```

---

## Adding New Features

When adding new features, follow this pattern:

1. **Define types** in `types/` (Layer 1) if needed
2. **Create use case** in `use-cases/` (Layer 3) with business logic
3. **Add route handler** in `routes/` (Layer 4) as thin HTTP wrapper
4. **Add tests** for both use case (business logic) and endpoint (HTTP interface)
5. **Update barrel exports** in relevant `index.ts` files

**Never put business logic in route handlers** - always extract to use cases.
