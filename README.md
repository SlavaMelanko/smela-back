# Backend

Backend API with authentication, user management, and role-based access control. Built with focus on security and clean architecture.

|                                                                            |                                                                     Latest Release                                                                      |                                                                                                    Build Status                                                                                                     |                                                                                 Code Quality                                                                                 |                                                                             Code Coverage                                                                              |
| :------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|  ![dev](https://img.shields.io/badge/%2F_dev-blue?style=flat&logo=GitHub)  |                                                                                                                                                         | [![Ubuntu](https://img.shields.io/github/actions/workflow/status/SlavaMelanko/smela-back/ubuntu.yml?branch=dev&label=ubuntu&logo=ubuntu)](https://github.com/SlavaMelanko/smela-back/actions/workflows/ubuntu.yml)  | [![Codacy](https://img.shields.io/codacy/grade/8f787278c7d043f0b286540625570893/dev?logo=codacy&label=codacy)](https://app.codacy.com/gh/SlavaMelanko/smela-back/dashboard)  | [![codecov](https://codecov.io/gh/SlavaMelanko/smela-back/branch/dev/graph/badge.svg?token=4JM8EMJE4H&label=Coverage)](https://codecov.io/gh/SlavaMelanko/smela-back)  |
| ![main](https://img.shields.io/badge/%2F_main-blue?style=flat&logo=GitHub) | [![GitHub Release](https://img.shields.io/github/v/release/SlavaMelanko/smela-back?label=release)](https://github.com/SlavaMelanko/smela-back/releases) | [![Ubuntu](https://img.shields.io/github/actions/workflow/status/SlavaMelanko/smela-back/ubuntu.yml?branch=main&label=ubuntu&logo=ubuntu)](https://github.com/SlavaMelanko/smela-back/actions/workflows/ubuntu.yml) | [![Codacy](https://img.shields.io/codacy/grade/8f787278c7d043f0b286540625570893/main?logo=codacy&label=codacy)](https://app.codacy.com/gh/SlavaMelanko/smela-back/dashboard) | [![codecov](https://codecov.io/gh/SlavaMelanko/smela-back/branch/main/graph/badge.svg?token=4JM8EMJE4H&label=Coverage)](https://codecov.io/gh/SlavaMelanko/smela-back) |

## 📋 Prerequisites

- [Bun](https://bun.sh/) runtime (latest version)
- PostgreSQL database (local or cloud)
- Email service account ([Resend](https://resend.com/) for production, [Ethereal](https://ethereal.email/) for development)

## 🛠️ Installation

### 1. Install

```bash
bun install
```

### 2. Environment Setup

See [`.env.example`](.env.example) to configure required variables.

### 3. Database Setup

```bash
# Generate migration files from schema
bun db:generate

# Apply migrations to database
bun db:migrate

# Seed database with initial data
bun db:seed

# Or run all database setup steps at once
bun db:setup
```

### 4. Start Development Server

```bash
bun dev
```

Server will start on <http://localhost:3000>

## 🔌 API Endpoints

See [src/routes/README.md](src/routes/README.md) for detailed API endpoint documentation.

## 🔐 Security Features

### Authentication & Authorization

- JWT tokens with role-based access control (User, Enterprise, Admin, Owner)
- Dual authentication support (cookies for web, Bearer tokens for API/mobile)
- bcrypt password hashing with configurable salt rounds
- Email verification and secure password reset flows

### Request Protection

- Rate limiting: 5 auth attempts/15min (production), 100 requests/15min (general)
- Request size limits: 10KB (auth), 100KB (general), 5MB (uploads)
- CORS with environment-specific origin validation
- Input validation using Zod schemas
- CAPTCHA protection: Google reCAPTCHA v2 (invisible) on auth endpoints

### Security Headers

- Content Security Policy (CSP) with strict directives
- HSTS, X-Frame-Options, X-Content-Type-Options
- Permissions Policy restricting browser features
- Environment-specific configurations (dev/staging/production)
