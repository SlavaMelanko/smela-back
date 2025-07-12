# Rate Limiting

This application implements comprehensive rate limiting to protect against abuse and ensure fair usage of the API.

## Overview

Rate limiting is implemented using the `hono-rate-limiter` package with environment-aware configuration. Different endpoints have different rate limits based on their sensitivity and typical usage patterns.

## Rate Limiting Strategy

### General Rate Limiting

- **Limit**: 100 requests per 15 minutes (production) / 1000 requests per 15 minutes (development/test)
- **Applied to**: All routes
- **Purpose**: Prevent general API abuse

### Authentication Rate Limiting

- **Limit**: 5 requests per 15 minutes (production) / 1000 requests per 15 minutes (development/test)
- **Applied to**: `/login`, `/signup`, `/verify-email`
- **Purpose**: Prevent brute force attacks and account enumeration

## Configuration

### Environment-Based Limits

The rate limiter automatically adjusts based on the environment:

```typescript
// Production
NODE_ENV=production
- General: 100 requests/15min
- Auth: 5 requests/15min

// Development/Test
NODE_ENV=development|test
- General: 1000 requests/15min
- Auth: 1000 requests/15min
```

### Client Identification

Clients are identified by IP address using the following header priority:

1. `X-Forwarded-For` (first IP in comma-separated list)
2. `X-Real-IP`
3. `CF-Connecting-IP` (Cloudflare)
4. Fallback: `"unknown-ip"`

## Rate Limit Headers

The API returns standard rate limiting headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 900
RateLimit-Policy: 100;w=900
Retry-After: 900 (when rate limited)
```

## Testing Considerations

### High Limits in Test Environment

Test environments use very high limits (1000 requests) to accommodate automated testing, including Playwright tests that may make many requests quickly.

### Skip Rate Limiting for Tests

Tests can skip rate limiting by including a special header:

```javascript
// Skip rate limiting in test environment
headers: {
  'X-Skip-Rate-Limit': 'true'
}
```

This only works in development and test environments for security reasons.

## Error Responses

When rate limited, the API returns:

```json
{
  "error": "Too many requests, please try again later.",
  "status": 429
}
```

Custom error messages for authentication endpoints:

```json
{
  "error": "Too many authentication attempts, please try again later.",
  "status": 429
}
```

## Implementation Details

### Middleware Setup

Rate limiting is applied in the server middleware stack:

```typescript
// server.ts
private setupMiddleware() {
  this.app
    .use(cors())
    .use(requestId())
    .use(loggerMiddleware)
    .use(generalRateLimiter) // Apply to all routes
    .use('/login', authRateLimiter) // Strict limits for auth
    .use('/signup', authRateLimiter)
    .use('/verify-email', authRateLimiter)
    .use('/api/v1/*', jwtMiddleware)
}
```

### Pre-configured Rate Limiters

Three pre-configured rate limiters are available:

1. **`generalRateLimiter`**: Standard limits for general API usage
2. **`authRateLimiter`**: Strict limits for authentication endpoints
3. **`strictRateLimiter`**: Very strict limits (10 requests/5min) for sensitive operations

### Custom Rate Limiter

You can create custom rate limiters:

```typescript
import rateLimiterMiddleware from '@/middleware/rate-limiter'

const customLimiter = rateLimiterMiddleware({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 20, // 20 requests per window
  message: 'Custom rate limit exceeded',
  statusCode: 429,
  keyGenerator: c => c.req.header('User-ID') || 'anonymous',
  skip: c => c.req.header('X-Admin') === 'true'
})
```

## Security Considerations

1. **IP-based tracking**: Clients behind the same NAT/proxy share rate limits
2. **Header spoofing**: X-Forwarded-For headers can be spoofed, but this is mitigated by:
   - Using multiple header sources
   - Applying rate limiting at the application level (after reverse proxy)
3. **Distributed systems**: Current implementation uses in-memory storage
   - For distributed deployments, consider Redis-backed storage

## Monitoring

Rate limiting events are logged with structured logging:

```json
{
  "level": "warn",
  "msg": "Rate limit exceeded",
  "clientIp": "192.168.1.1",
  "endpoint": "/login",
  "limit": 5,
  "window": "15min"
}
```

## Future Enhancements

1. **Redis Integration**: For distributed rate limiting across multiple instances
2. **User-based Rate Limiting**: Different limits for authenticated users
3. **Dynamic Rate Limiting**: Adjust limits based on system load
4. **Whitelist/Blacklist**: IP-based allow/deny lists
5. **Rate Limiting Analytics**: Dashboard for monitoring abuse patterns

## Troubleshooting

### Common Issues

1. **Tests failing due to rate limiting**:

   - Ensure `NODE_ENV=test` is set
   - Use `X-Skip-Rate-Limit: true` header in tests
   - Use different IP addresses for different test scenarios

2. **Legitimate users being rate limited**:

   - Check if users are behind shared proxy/NAT
   - Consider user-based rate limiting instead of IP-based
   - Monitor rate limiting logs for patterns

3. **Rate limits not applying**:
   - Verify middleware order in server.ts
   - Check environment configuration
   - Ensure headers are being set correctly

### Debug Rate Limiting

Enable debug logging to see rate limiting decisions:

```typescript
// In development
console.log('Rate limit status:', {
  limit: res.headers.get('RateLimit-Limit'),
  remaining: res.headers.get('RateLimit-Remaining'),
  reset: res.headers.get('RateLimit-Reset')
})
```
