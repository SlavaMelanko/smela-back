# Backend

Layered monolithic REST API with authentication and RBAC, focused on security and modularity.

|                                                                            |                                                                     Latest Release                                                                      |                                                                                                    Build Status                                                                                                     |                                                                                 Code Quality                                                                                 |                                                                             Code Coverage                                                                              |
| :------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|  ![dev](https://img.shields.io/badge/%2F_dev-blue?style=flat&logo=GitHub)  |                                                                                                                                                         | [![Ubuntu](https://img.shields.io/github/actions/workflow/status/SlavaMelanko/smela-back/ubuntu.yml?branch=dev&label=ubuntu&logo=ubuntu)](https://github.com/SlavaMelanko/smela-back/actions/workflows/ubuntu.yml)  | [![Codacy](https://img.shields.io/codacy/grade/8f787278c7d043f0b286540625570893/dev?logo=codacy&label=codacy)](https://app.codacy.com/gh/SlavaMelanko/smela-back/dashboard)  | [![codecov](https://codecov.io/gh/SlavaMelanko/smela-back/branch/dev/graph/badge.svg?token=4JM8EMJE4H&label=Coverage)](https://codecov.io/gh/SlavaMelanko/smela-back)  |
| ![main](https://img.shields.io/badge/%2F_main-blue?style=flat&logo=GitHub) | [![GitHub Release](https://img.shields.io/github/v/release/SlavaMelanko/smela-back?label=release)](https://github.com/SlavaMelanko/smela-back/releases) | [![Ubuntu](https://img.shields.io/github/actions/workflow/status/SlavaMelanko/smela-back/ubuntu.yml?branch=main&label=ubuntu&logo=ubuntu)](https://github.com/SlavaMelanko/smela-back/actions/workflows/ubuntu.yml) | [![Codacy](https://img.shields.io/codacy/grade/8f787278c7d043f0b286540625570893/main?logo=codacy&label=codacy)](https://app.codacy.com/gh/SlavaMelanko/smela-back/dashboard) | [![codecov](https://codecov.io/gh/SlavaMelanko/smela-back/branch/main/graph/badge.svg?token=4JM8EMJE4H&label=Coverage)](https://codecov.io/gh/SlavaMelanko/smela-back) |

## 📋 Prerequisites

- [Bun](https://bun.sh/) runtime (latest version)
- PostgreSQL database (local or cloud)
- Email service account ([Resend](https://resend.com/) for production, [Ethereal](https://ethereal.email/) for development)

## 🛠️ Build and Run

### 1. Install dependencies

```bash
bun install
```

### 2. Environment setup

See [`.env.example`](.env.example) to configure required variables.

### 3. Database setup

Run all database setup steps at once (generate → migrate → seed):

```bash
bun db:init
```

Or look at [`package.json`](package.json) for individual steps.

### 4. Start development server

```bash
bun dev
```

Server will start on <http://localhost:3000> by default.

## 🔌 API Endpoints

See [src/routes/README.md](src/routes/README.md) for detailed API endpoints, and [Postman collection](postman.json).
