# Rate Limiter Middleware

A comprehensive rate limiting middleware for Hono applications with support for multiple configurations, IP detection, and environment-aware defaults.

## Features

- 🚦 **Flexible Rate Limiting**: Configure limits, windows, and behaviors per endpoint
- 🌍 **Smart IP Detection**: Supports X-Forwarded-For, X-Real-IP, and CF-Connecting-IP headers
- 🎯 **Predefined Presets**: Ready-to-use configurations for common scenarios
- 🧪 **Test-Friendly**: High limits in development/test environments
- 📊 **Standard Headers**: RFC-compliant rate limit headers
- ⚡ **Performance**: Built on top of hono-rate-limiter for optimal performance

## Quick Start

```typescript
import { Hono } from 'hono'

import { authRateLimiter, createRateLimiter, generalRateLimiter } from '@/middleware/rate-limiter'

const app = new Hono()

// Use predefined limiters
app.use('/api/v1/auth/*', authRateLimiter)
app.use('/api/*', generalRateLimiter)

// Create custom limiters
app.use('/upload', createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 uploads per minute
  message: 'Upload limit exceeded. Please wait before uploading again.'
}))
```

## Predefined Rate Limiters

### `authRateLimiter`

For authentication endpoints (login, registration, password reset).

- **Production**: 5 attempts per 15 minutes
- **Development/Test**: 1000 attempts per 15 minutes
- **Use cases**: `/api/v1/auth/login`, `/api/v1/auth/signup`, `/api/v1/auth/reset-password`

```typescript
import { authRateLimiter } from '@/middleware/rate-limiter'

app.use('/api/v1/auth/*', authRateLimiter)
```

### `generalRateLimiter`

For general API endpoints.

- **Production**: 100 requests per 15 minutes
- **Development/Test**: 1000 requests per 15 minutes
- **Use cases**: Most API endpoints

```typescript
import { generalRateLimiter } from '@/middleware/rate-limiter'

app.use('/api/*', generalRateLimiter)
```

## Custom Rate Limiters

### Basic Configuration

```typescript
import { createRateLimiter } from '@/middleware/rate-limiter'

const customLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per window
  message: 'Too many requests from this IP',
  statusCode: 429
})

app.use('/api/custom', customLimiter)
```

### Advanced Configuration

```typescript
const advancedLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,

  // Custom key generator (e.g., by user ID)
  keyGenerator: (c) => {
    const userId = c.get('userId')

    return userId ? `user:${userId}` : getClientIp(c)
  },

  // Skip rate limiting for certain conditions
  skip: (c) => {
    const isAdmin = c.get('isAdmin')

    return isAdmin || c.req.header('X-Skip-Rate-Limit') === 'true'
  },

  // Custom error response
  message: 'Rate limit exceeded. Please slow down.',
  statusCode: 503
})
```

## Configuration Options

| Option         | Type                      | Default                                        | Description                               |
| -------------- | ------------------------- | ---------------------------------------------- | ----------------------------------------- |
| `windowMs`     | `number`                  | `15 * 60 * 1000`                               | Time window in milliseconds               |
| `limit`        | `number`                  | `100` (prod), `1000` (dev/test)                | Max requests per window                   |
| `message`      | `string`                  | `'Too many requests, please try again later.'` | Error message                             |
| `statusCode`   | `StatusCode`              | `429`                                          | HTTP status code for rate limit responses |
| `keyGenerator` | `(c: Context) => string`  | `getClientIp`                                  | Function to generate rate limit keys      |
| `skip`         | `(c: Context) => boolean` | `undefined`                                    | Function to skip rate limiting            |

## IP Detection

The middleware automatically detects client IPs from various headers:

1. **X-Forwarded-For** (takes first IP if multiple)
2. **X-Real-IP**
3. **CF-Connecting-IP** (Cloudflare)
4. **Fallback**: `'unknown-ip'`

```typescript
import { getClientIp } from '@/middleware/rate-limiter'

app.use('*', (c, next) => {
  const clientIp = getClientIp(c)
  // eslint-disable-next-line no-console
  console.log(`Request from IP: ${clientIp}`)

  return next()
})
```

## Response Headers

The middleware adds standard rate limit headers to responses:

- `RateLimit-Limit`: The rate limit ceiling for that given endpoint
- `RateLimit-Remaining`: The number of requests left for the time window
- `RateLimit-Reset`: The time at which the rate limit resets

## Environment Handling

The middleware automatically adjusts limits based on environment:

- **Production**: Uses configured limits for security
- **Development/Test**: Uses high limits (1000) to avoid blocking during development

### Test Environment Skip

All predefined limiters support skipping rate limiting in test environments:

```typescript
// In tests, add this header to bypass rate limiting
const response = await app.request('/api/endpoint', {
  headers: { 'X-Skip-Rate-Limit': 'true' }
})
```

## Error Handling

When rate limit is exceeded, the middleware responds with:

```json
{
  "error": "Too many requests, please try again later."
}
```

Or a custom message if configured.

## Performance Considerations

- **Memory Store**: Uses in-memory storage by default (suitable for single-instance deployments)
- **Distributed Systems**: For multi-instance deployments, consider implementing a custom store with Redis
- **Headers**: Standard headers are included automatically for client awareness

## Examples

### User-Specific Rate Limiting

```typescript
const userRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // 30 requests per minute per user
  keyGenerator: (c) => {
    const userId = c.get('userId')

    return userId || getClientIp(c)
  }
})

app.use('/api/user/*', userRateLimiter)
```

### API Key Rate Limiting

```typescript
const apiKeyLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 1000, // Higher limit for API keys
  keyGenerator: (c) => {
    const apiKey = c.req.header('X-API-Key')

    return apiKey ? `api:${apiKey}` : getClientIp(c)
  }
})

app.use('/api/v1/*', apiKeyLimiter)
```

### Progressive Rate Limiting

```typescript
// Different limits for different endpoints
app.use('/api/search', createRateLimiter({ limit: 100 }))
app.use('/api/upload', createRateLimiter({ limit: 10 }))
app.use('/api/process', createRateLimiter({ limit: 5 }))
```

## Testing

The rate limiter includes comprehensive tests for all functionality:

```bash
# Run all rate limiter tests
bun test src/middleware/rate-limiter/__tests__/

# Run specific test files
bun test src/middleware/rate-limiter/__tests__/core.test.ts
bun test src/middleware/rate-limiter/__tests__/presets.test.ts
bun test src/middleware/rate-limiter/__tests__/utils.test.ts
```

## Module Structure

```
src/middleware/rate-limiter/
├── README.md          # This documentation
├── config.ts          # Type definitions and interfaces
├── utils.ts           # Utility functions (IP detection)
├── core.ts            # Core rate limiter creation logic
├── presets.ts         # Predefined rate limiters
├── index.ts           # Main exports
└── __tests__/         # Comprehensive test suite
    ├── utils.test.ts
    ├── core.test.ts
    └── presets.test.ts
```
