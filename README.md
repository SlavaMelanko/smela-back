# Portal Backend V2

A modern TypeScript backend API built with Bun runtime and Hono framework, providing comprehensive authentication, user management, and role-based access control capabilities.

## 🚀 Features

- **Authentication System**: Complete user registration, login, email verification, and password reset
- **Role-Based Access Control**: Flexible permissions system with user roles
- **Modern Stack**: Bun runtime, Hono framework, PostgreSQL with Drizzle ORM
- **Security First**: bcrypt password hashing, JWT tokens, rate limiting, email enumeration protection
- **Developer Experience**: Hot reload, comprehensive testing, ESLint integration
- **Database Management**: Migrations, seeding, and studio interface

## 📋 Prerequisites

- [Bun](https://bun.sh/) runtime (latest version)
- PostgreSQL database (or Neon serverless)
- Node.js 18+ (for compatibility)

## 🛠️ Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd portal-back-v2
bun install
```

### 2. Environment Setup

Bun automatically loads environment files based on `NODE_ENV`. Create the following files:

#### Base Configuration (`.env`)

Create a `.env` file for sensitive values (never commit this to git):

```env
# Sensitive values - NEVER commit this file
JWT_SECRET=your-super-secret-jwt-key
DB_URL=postgresql://user:password@localhost:5432/portal_db
EMAIL_RESEND_API_KEY=your-resend-api-key

# Shared configuration (can be overridden per environment)
EMAIL_SENDER_PROFILES={"system":{"email":"noreply@yourcompany.com","name":"Your Company"}}
COMPANY_NAME=Your Company Name
COMPANY_SOCIAL_LINKS={"twitter": "https://twitter.com/yourcompany", "github": "https://github.com/yourcompany"}
```

#### Environment-Specific Files

Create environment-specific files for different configurations:

**`.env.development`** (for local development):

```env
LOG_LEVEL=debug
BE_BASE_URL=http://localhost:3000
FE_BASE_URL=http://localhost:5173
```

**`.env.production`** (for production):

```env
LOG_LEVEL=info
BE_BASE_URL=https://api.yourcompany.com
FE_BASE_URL=https://app.yourcompany.com
```

**`.env.staging`** (for staging):

```env
LOG_LEVEL=info
BE_BASE_URL=https://api-staging.yourcompany.com
FE_BASE_URL=https://app-staging.yourcompany.com
```

**`.env.test`** (for testing):

```env
LOG_LEVEL=error
BE_BASE_URL=http://localhost:3000
FE_BASE_URL=http://localhost:5173
# Optionally use a separate test database
# DB_URL=postgresql://test_user:test_pass@localhost:5432/testdb
```

#### Environment File Loading Order

Bun loads files in this order (later files override earlier ones):

1. `.env` (base configuration)
2. `.env.{NODE_ENV}` (environment-specific)
3. `.env.local` (local overrides, not in git)
4. `.env.{NODE_ENV}.local` (environment-specific local overrides, not in git)

**Note:** The `NODE_ENV` variable determines which environment file is loaded. See `.env.example` for a complete template.

### 3. Database Setup

```bash
# Generate migration files from schema
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Seed database with initial data
bun run db:seed

# Or run all database setup steps at once
bun run db:setup
```

### 4. Start Development Server

```bash
bun run dev
```

Server will start on <http://localhost:3000>

## 🔌 API Endpoints

### Authentication Routes

| Method | Endpoint                                 | Description                        | Authentication |
| ------ | ---------------------------------------- | ---------------------------------- | -------------- |
| `POST` | `/api/v1/auth/signup`                    | User registration                  | Public         |
| `POST` | `/api/v1/auth/login`                     | User login                         | Public         |
| `POST` | `/api/v1/auth/verify-email`              | Email verification (token in body) | Public         |
| `POST` | `/api/v1/auth/resend-verification-email` | Resend verification email          | Public         |
| `POST` | `/api/v1/auth/request-password-reset`    | Request password reset             | Public         |
| `POST` | `/api/v1/auth/reset-password`            | Reset password with token          | Public         |

### Protected Routes (Allow New Users)

| Method | Endpoint               | Description              | Authentication      |
| ------ | ---------------------- | ------------------------ | ------------------- |
| `GET`  | `/api/v1/protected/me` | Get current user profile | JWT Required (New+) |
| `POST` | `/api/v1/protected/me` | Update user profile      | JWT Required (New+) |

### Private Routes (Verified Users Only)

| Method | Endpoint | Description     | Authentication           |
| ------ | -------- | --------------- | ------------------------ |
| -      | -        | Currently empty | JWT Required (Verified+) |

### API Testing

A complete Postman collection is available in the repository root:

📁 **`portal-v2.postman_collection.json`**

Import this collection into Postman to test all API endpoints with pre-configured requests and examples.

## 🏗️ Architecture

### Directory Structure

```text
src/
├── app.ts                 # Application entry point
├── server.ts              # Server configuration and middleware setup
├── db/                    # Database layer
│   ├── schema.ts          # Database schema definitions
│   ├── migrations/        # Database migration files
│   └── seed.ts            # Database seeding script
├── lib/                   # Core utilities
│   ├── crypto/            # Password hashing and token generation
│   ├── validation/        # Request validation schemas
│   ├── errors/            # Custom error classes
│   ├── jwt.ts             # JWT token handling
│   └── logger.ts          # Logging configuration
├── middleware/            # Hono middleware
│   ├── auth.ts            # JWT authentication middleware
│   ├── logger.ts          # Request logging middleware
│   ├── on-error.ts        # Error handling middleware
│   └── rate-limiter/      # Rate limiting implementation
├── repositories/          # Data access layer
│   ├── user/              # User repository
│   ├── auth/              # Authentication repository
│   └── token/             # Token repository
├── routes/                # API endpoint handlers
│   ├── auth/              # Authentication routes
│   └── user/              # User-related routes
└── types/                 # TypeScript type definitions
```

### Frontend-Backend Architecture

The API is designed to work with a separate frontend application:

1. **Email Links**: Verification and password reset emails contain links to the frontend application
2. **Frontend Handling**: The frontend extracts tokens from URL parameters and makes POST requests to the backend
3. **API Security**: Backend accepts tokens in JSON request body (not URL parameters) for better security
4. **Token Format**: All tokens are 64-character hexadecimal strings

### Technology Stack

- **Runtime**: Bun (JavaScript/TypeScript runtime)
- **Framework**: Hono (Web framework)
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM with Drizzle Kit
- **Authentication**: JWT tokens, bcrypt password hashing
- **Validation**: Zod schemas with @hono/zod-validator
- **Logging**: Pino with hono-pino integration
- **Rate Limiting**: hono-rate-limiter
- **Testing**: Bun's built-in test runner
- **Code Quality**: ESLint with @antfu/eslint-config

## 🔐 Security Features

### Password Security

- **bcrypt Hashing**: 10 rounds for optimal security/performance balance
- **Password Validation**: Minimum strength requirements

### Authentication

- **JWT Tokens**: Stateless authentication with configurable expiration
- **Email Verification**: Required before account activation
- **Password Reset**: Secure one-time token system with expiration
- **Email Enumeration Protection**: Consistent error responses prevent user discovery
- **Rate Limiting**: Protection against brute force attacks

### Database Security

- **Parameterized Queries**: Protection against SQL injection
- **Connection Pooling**: Secure database connection management
- **Environment Variables**: Sensitive data stored securely

## 🧪 Development

### Available Scripts

```bash
# Development
bun run dev              # Start development server with hot reload
bun test                 # Run all tests
bun test [file]          # Run specific test file

# Database Operations
bun run db:generate      # Generate migration files from schema changes
bun run db:migrate       # Apply migrations to database
bun run db:seed          # Seed database with initial data
bun run db:setup         # Run all database setup steps
bun run db:studio        # Open Drizzle Studio for database management

# Code Quality
bun run lint             # Run ESLint checks
bun run lint:fix         # Auto-fix ESLint issues
```

### Testing Strategy

- **Unit Tests**: Critical components (crypto, auth, rate limiting)
- **Integration Tests**: API endpoints and database operations
- **Test Location**: `__tests__` directories alongside source code
- **Test Pattern**: `*.test.ts` files using Bun's test runner

### Development Patterns

- **Repository Pattern**: Clean separation between data access and business logic
- **Middleware Pipeline**: Structured request processing with Hono middleware
- **Error Handling**: Centralized error handling with custom error classes
- **Validation**: Request/response validation using Zod schemas
- **Logging**: Comprehensive logging with structured data

## 🚀 Deployment

### Running in Production

1. **Configure environment files** as described in the [Environment Setup](#2-environment-setup) section
2. **Update production URLs** in `.env.production` with your actual domains
3. **Set sensitive values** in `.env` on your production server

```bash
# Run in production mode
NODE_ENV=production bun run src/app.ts

# Run in staging mode
NODE_ENV=staging bun run src/app.ts
```

### Database Setup

```bash
# Production database setup
bun run db:migrate
bun run db:seed  # Optional: only if you need initial data
```

### Health Check

The server exposes basic health endpoints for monitoring:

- Server status: `GET /` (currently returns empty response)
- Database connectivity: Implicit through API endpoints

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the established patterns
4. **Run tests**: `bun test`
5. **Run linting**: `bun run lint:fix`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Code Standards

- Follow TypeScript best practices
- Use ESLint configuration provided
- Write tests for new features
- Follow repository pattern for data access
- Use Zod for validation schemas

## 📞 Support

For questions, issues, or contributions:

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Documentation**: Check CLAUDE.md for detailed technical information
- **Testing**: Run `bun test` to verify your changes
