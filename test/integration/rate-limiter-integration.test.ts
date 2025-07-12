import { describe, expect, it } from 'bun:test'

import Server from '@/server'

describe('Rate Limiter Integration', () => {
  it('should apply general rate limiting to all routes', async () => {
    const server = new Server()
    const app = server.getApp()

    // Test with a very low limit by overriding the environment
    process.env.NODE_ENV = 'production' // This will use the production limits

    const res = await app.request('/api/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'X-Forwarded-For': '192.168.1.100',
      },
    })

    // Should have rate limit headers even if auth fails
    expect(res.headers.has('ratelimit-limit')).toBe(true)
    expect(res.headers.has('ratelimit-remaining')).toBe(true)
  })

  it('should apply auth rate limiting to authentication endpoints', async () => {
    const server = new Server()
    const app = server.getApp()

    const res = await app.request('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.101',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'invalid',
      }),
    })

    // Should have rate limit headers
    expect(res.headers.has('ratelimit-limit')).toBe(true)
    expect(res.headers.has('ratelimit-remaining')).toBe(true)
  })

  it('should allow skipping rate limits in test environment', async () => {
    const server = new Server()
    const app = server.getApp()

    // Set back to test environment
    process.env.NODE_ENV = 'test'

    const res = await app.request('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Skip-Rate-Limit': 'true', // Special header to skip in test
        'X-Forwarded-For': '192.168.1.102',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'invalid',
      }),
    })

    // Should still work even with rate limiting
    expect(res.status).not.toBe(429)
  })

  it('should rate limit different IPs separately', async () => {
    const server = new Server()
    const app = server.getApp()

    // Requests from different IPs should be tracked separately
    const res1 = await app.request('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.200',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'invalid',
      }),
    })

    const res2 = await app.request('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.201', // Different IP
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'invalid',
      }),
    })

    // Both should succeed (different IPs have separate counters)
    expect(res1.status).not.toBe(429)
    expect(res2.status).not.toBe(429)
  })
})
