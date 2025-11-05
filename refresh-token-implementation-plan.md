# Refresh Token Implementation Plan

## Overview
Implement refresh token support with automatic token rotation, multi-device support, and comprehensive device tracking.

## Configuration (Based on User Choices)
- **Token Rotation**: Yes, rotate on every refresh
- **Token Lifetime**: 30 days
- **Multi-Device**: Yes, allow multiple devices
- **Device Tracking**: IP address, User agent, Device fingerprint, Last used timestamp

---

## 1. Database Schema

### Create `src/data/schema/refresh-tokens.ts`
```typescript
export const refreshTokensTable = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(), // hashed refresh token
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceFingerprint: text('device_fingerprint'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('refresh_tokens_user_id_index').on(table.userId),
  index('refresh_tokens_expires_at_index').on(table.expiresAt),
  index('refresh_tokens_revoked_at_index').on(table.revokedAt),
])
```

### Update `src/data/schema/index.ts`
Export the new table.

---

## 2. Repository Layer

### Create `src/data/repositories/refresh-token/` module
- **types.ts**: Define `CreateRefreshTokenInput`, `UpdateRefreshTokenInput`, `RefreshToken` types
- **mutations.ts**: `create`, `update`, `revokeById`, `revokeAllByUserId`
- **queries.ts**: `findByTokenHash`, `findActiveByUserId`, `deleteExpired`
- **index.ts**: Export `refreshTokenRepo` with all operations

---

## 3. Security Layer

### Create `src/security/refresh-token/`
- **token.ts**: Generate cryptographically secure random tokens
- **hash.ts**: Hash tokens using SHA-256 before storage
- **extractor.ts**: Extract refresh token from cookies
- **device.ts**: Extract device info (IP, user agent, fingerprint) from request

---

## 4. Cookie Management

### Update `src/net/http/cookie/`
- Create `refresh-cookie.ts` with `setRefreshCookie`, `getRefreshCookie`, `deleteRefreshCookie`
- Cookie config: HttpOnly, Secure, SameSite=Strict, 30 days maxAge
- Export from `src/net/http/cookie/index.ts`

---

## 5. Environment Variables

### Update `.env.example`
```bash
JWT_ACCESS_SECRET=your-secret-key-min-10-chars
JWT_ACCESS_EXPIRATION=900  # 15 minutes (short-lived)
JWT_ACCESS_SIGNATURE_ALGORITHM=HS256

# Refresh tokens (30 days = 2592000 seconds)
REFRESH_TOKEN_EXPIRATION=2592000
REFRESH_COOKIE_NAME=refresh_token
```

### Update `src/env/env.ts`
Add validation for new environment variables.

---

## 6. Auth Endpoints

### Update `src/routes/auth/login/handler.ts`
- Generate both access token (JWT) and refresh token
- Set access token in response body (for API/mobile clients)
- Set refresh token in HttpOnly cookie (for web clients)
- Store hashed refresh token in database with device info

### Create `src/routes/auth/refresh/`
- **schema.ts**: Validation schema (no body needed, uses cookie)
- **handler.ts**:
  1. Extract refresh token from cookie
  2. Validate and find in database
  3. Check expiration and revocation
  4. Generate new access token
  5. Rotate: Create new refresh token, revoke old one
  6. Return new access token in body, new refresh token in cookie
  7. Update `lastUsedAt` timestamp
- **index.ts**: Export route with POST method

### Update `src/routes/auth/logout/handler.ts`
- Revoke refresh token from database
- Delete refresh token cookie
- Keep access token deletion (existing behavior)

---

## 7. Use Cases

### Create `src/use-cases/auth/refresh.ts`
- Business logic for token refresh
- Validates refresh token hash
- Checks expiration and revocation
- Generates new tokens (both access and refresh)
- Handles token rotation in transaction

### Update `src/use-cases/auth/login.ts`
- Add refresh token generation logic
- Store refresh token with device info

---

## 8. Middleware (Optional Enhancement)

### Create `src/middleware/auth/fallback.ts`
- Try Authorization header first (existing behavior)
- If missing/invalid and refresh token cookie exists, auto-refresh
- Useful for seamless web experience
- **Note**: This is optional and can be added later

---

## 9. Database Migration

### Generate migration
```bash
bun run db:generate
```

### Review and apply
```bash
bun run db:migrate:dev
```

---

## 10. Testing

### Create tests
- `src/data/repositories/refresh-token/__tests__/mutations.test.ts`
- `src/data/repositories/refresh-token/__tests__/queries.test.ts`
- `src/routes/auth/refresh/__tests__/endpoint.test.ts`
- `src/use-cases/auth/__tests__/refresh.test.ts`
- Update existing `login.test.ts` to verify refresh token creation

---

## 11. Documentation

### Update `CLAUDE.md`
- Document new `/api/v1/auth/refresh` endpoint
- Explain dual-token auth flow (access + refresh)
- Document cookie vs header usage
- Add security considerations section

---

## Implementation Order

1. Database schema + migration
2. Repository layer (refresh-token repo)
3. Security utilities (token generation, hashing, device extraction)
4. Cookie management (refresh-cookie utilities)
5. Environment variables
6. Use case logic (refresh + update login)
7. Route handlers (refresh endpoint + update login/logout)
8. Testing
9. Documentation

---

## Security Considerations

- Refresh tokens are hashed (SHA-256) before storage
- HttpOnly + Secure + SameSite=Strict cookies prevent XSS/CSRF
- Token rotation limits damage from stolen tokens
- Device tracking enables security monitoring
- Multi-device support for better UX
- Automatic cleanup of expired tokens (background job can be added later)

---

**Estimated Complexity**: Medium-High (15-20 files to create/modify)
**Estimated Time**: 2-3 hours for full implementation with tests
