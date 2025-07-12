import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import { createRateLimiter } from '../core'

describe('Rate Limiter Core', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
  })

  describe('Basic Rate Limiting', () => {
    it('should allow requests under the limit', async () => {
      app.use(createRateLimiter({
        windowMs: 60000, // 1 minute
        limit: 3, // 3 requests per minute
        keyGenerator: () => 'test-key',
      }))

      app.get('/test', c => c.text('OK'))

      const res1 = await app.request('/test', { method: 'GET' })
      const res2 = await app.request('/test', { method: 'GET' })
      const res3 = await app.request('/test', { method: 'GET' })

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
      expect(res3.status).toBe(200)
    })

    it('should block requests over the limit', async () => {
      app.use(createRateLimiter({
        windowMs: 60000, // 1 minute
        limit: 2, // 2 requests per minute - explicitly set low limit
        keyGenerator: () => 'test-key',
      }))

      app.get('/test', c => c.text('OK'))

      // First two requests should pass
      const res1 = await app.request('/test', { method: 'GET' })
      const res2 = await app.request('/test', { method: 'GET' })

      // Third request should be rate limited
      const res3 = await app.request('/test', { method: 'GET' })

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
      expect(res3.status).toBe(429) // Too Many Requests
    })

    it('should include rate limit headers', async () => {
      app.use(createRateLimiter({
        windowMs: 60000,
        limit: 5,
        keyGenerator: () => 'test-key',
      }))

      app.get('/test', c => c.text('OK'))

      const res = await app.request('/test', { method: 'GET' })

      expect(res.headers.get('RateLimit-Limit')).toBe('5')
      expect(res.headers.get('RateLimit-Remaining')).toBe('4')
      expect(res.headers.has('RateLimit-Reset')).toBe(true)
    })
  })

  describe('Key Generation', () => {
    it('should allow different keys to have separate limits', async () => {
      let keyCounter = 0

      app.use(createRateLimiter({
        windowMs: 60000,
        limit: 1, // 1 request per minute per key
        keyGenerator: () => `key-${keyCounter++}`,
      }))

      app.get('/test', c => c.text('OK'))

      // Each request gets a different key, so all should pass
      const res1 = await app.request('/test', { method: 'GET' })
      const res2 = await app.request('/test', { method: 'GET' })
      const res3 = await app.request('/test', { method: 'GET' })

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
      expect(res3.status).toBe(200)
    })

    it('should use IP address as default key when available', async () => {
      app.use(createRateLimiter({
        windowMs: 60000,
        limit: 2,
        // No keyGenerator - should use IP
      }))

      app.get('/test', c => c.text('OK'))

      const headers = { 'X-Forwarded-For': '192.168.1.1' }

      const res1 = await app.request('/test', { method: 'GET', headers })
      const res2 = await app.request('/test', { method: 'GET', headers })
      const res3 = await app.request('/test', { method: 'GET', headers })

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
      expect(res3.status).toBe(429)
    })
  })

  describe('Configuration Options', () => {
    it('should allow custom error message', async () => {
      const customMessage = 'Rate limit exceeded! Please try again later.'

      app.use(createRateLimiter({
        windowMs: 60000,
        limit: 1,
        message: customMessage,
        keyGenerator: () => 'test-key',
      }))

      app.get('/test', c => c.text('OK'))

      await app.request('/test', { method: 'GET' }) // First request
      const res = await app.request('/test', { method: 'GET' }) // Second request (blocked)

      expect(res.status).toBe(429)
      const body = await res.text()
      expect(body).toContain(customMessage)
    })

    it('should work with custom status code', async () => {
      app.use(createRateLimiter({
        windowMs: 60000,
        limit: 1,
        statusCode: 503, // Service Unavailable
        keyGenerator: () => 'test-key',
      }))

      app.get('/test', c => c.text('OK'))

      await app.request('/test', { method: 'GET' }) // First request
      const res = await app.request('/test', { method: 'GET' }) // Second request (blocked)

      expect(res.status).toBe(503)
    })

    it('should have high limits in test environment', async () => {
      // This test simulates what we need for Playwright tests
      app.use(createRateLimiter({
        windowMs: 60000,
        limit: 1000, // High limit for tests
        keyGenerator: () => 'test-key',
      }))

      app.get('/test', c => c.text('OK'))

      // Make many requests quickly (simulating test suite)
      const requests = Array.from({ length: 50 }, (_, _i) =>
        app.request('/test', { method: 'GET' }))

      const responses = await Promise.all(requests)

      // All should pass with high limits
      responses.forEach((res) => {
        expect(res.status).toBe(200)
      })
    })
  })

  describe('Skip Function', () => {
    it('should skip rate limiting when skip function returns true', async () => {
      app.use(createRateLimiter({
        windowMs: 60000,
        limit: 1,
        keyGenerator: () => 'test-key',
        skip: c => c.req.header('X-Skip-Rate-Limit') === 'true',
      }))

      app.get('/test', c => c.text('OK'))

      // First request without skip header - should be counted
      await app.request('/test', { method: 'GET' })

      // Second request without skip header - should be blocked
      const res1 = await app.request('/test', { method: 'GET' })
      expect(res1.status).toBe(429)

      // Request with skip header - should pass
      const res2 = await app.request('/test', {
        method: 'GET',
        headers: { 'X-Skip-Rate-Limit': 'true' },
      })
      expect(res2.status).toBe(200)
    })
  })

  describe('Default Configuration', () => {
    it('should work with no configuration provided', async () => {
      app.use(createRateLimiter())

      app.get('/test', c => c.text('OK'))

      const res = await app.request('/test', { method: 'GET' })

      expect(res.status).toBe(200)
      expect(res.headers.has('RateLimit-Limit')).toBe(true)
    })

    it('should use environment-appropriate default limits', async () => {
      app.use(createRateLimiter({
        keyGenerator: () => 'test-key',
      }))

      app.get('/test', c => c.text('OK'))

      const res = await app.request('/test', { method: 'GET' })

      // In test environment, should have high default limit (1000)
      expect(res.headers.get('RateLimit-Limit')).toBe('1000')
    })
  })
})
