# 🔌 API Endpoints

## Authentication Routes

| Method | Endpoint                                 | Description                        | Authentication |
| ------ | ---------------------------------------- | ---------------------------------- | -------------- |
| `POST` | `/api/v1/auth/signup`                    | User registration                  | Public         |
| `POST` | `/api/v1/auth/login`                     | User login                         | Public         |
| `POST` | `/api/v1/auth/verify-email`              | Email verification (token in body) | Public         |
| `POST` | `/api/v1/auth/resend-verification-email` | Resend verification email          | Public         |
| `POST` | `/api/v1/auth/request-password-reset`    | Request password reset             | Public         |
| `POST` | `/api/v1/auth/reset-password`            | Reset password with token          | Public         |

## Protected Routes (Allow New Users)

| Method | Endpoint               | Description              | Authentication      |
| ------ | ---------------------- | ------------------------ | ------------------- |
| `GET`  | `/api/v1/protected/me` | Get current user profile | JWT Required (New+) |
| `POST` | `/api/v1/protected/me` | Update user profile      | JWT Required (New+) |

## Private Routes (Verified Users Only)

| Method | Endpoint | Description     | Authentication           |
| ------ | -------- | --------------- | ------------------------ |
| -      | -        | Currently empty | JWT Required (Verified+) |

## API Testing

A complete Postman collection is available in the repository root:

[`postman.json`](../../postman.json)

Import this collection into Postman to test all API endpoints with pre-configured requests and examples.
