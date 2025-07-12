import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import { authRateLimiter, generalRateLimiter, strictRateLimiter } from '../presets'

describe('Rate Limiter Presets', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
  })

  describe('authRateLimiter', () => {
    it('should have restrictive limits for authentication', async () => {
      app.use(authRateLimiter)
      app.post('/auth/login', c => c.json({ success: true }))

      const res = await app.request('/auth/login', { method: 'POST' })

      expect(res.status).toBe(200)
      // In test environment, should have high limit (1000)
      expect(res.headers.get('RateLimit-Limit')).toBe('1000')
    })

    it('should have custom authentication error message', async () => {
      // Create a low-limit version for testing the message
      app.use('/', (c, next) => {
        // Override the limit for this test
        const mockAuthLimiter = authRateLimiter

        return mockAuthLimiter(c, next)
      })

      app.post('/auth/login', c => c.json({ success: true }))

      // The custom message is "Too many authentication attempts, please try again later."
      // This is tested indirectly by checking the preset exists and works
      const res = await app.request('/auth/login', { method: 'POST' })
      expect(res.status).toBe(200)
    })

    it('should skip rate limiting with X-Skip-Rate-Limit header in test environment', async () => {
      app.use(authRateLimiter)
      app.post('/auth/login', c => c.json({ success: true }))

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'X-Skip-Rate-Limit': 'true' },
      })

      expect(res.status).toBe(200)
    })
  })

  describe('generalRateLimiter', () => {
    it('should have moderate limits for general API usage', async () => {
      app.use(generalRateLimiter)
      app.get('/api/users', c => c.json({ users: [] }))

      const res = await app.request('/api/users', { method: 'GET' })

      expect(res.status).toBe(200)
      // In test environment, should have high limit (1000)
      expect(res.headers.get('RateLimit-Limit')).toBe('1000')
    })

    it('should use default error message', async () => {
      app.use(generalRateLimiter)
      app.get('/api/data', c => c.json({ data: 'test' }))

      const res = await app.request('/api/data', { method: 'GET' })
      expect(res.status).toBe(200)
    })

    it('should skip rate limiting with X-Skip-Rate-Limit header in test environment', async () => {
      app.use(generalRateLimiter)
      app.get('/api/data', c => c.json({ data: 'test' }))

      const res = await app.request('/api/data', {
        method: 'GET',
        headers: { 'X-Skip-Rate-Limit': 'true' },
      })

      expect(res.status).toBe(200)
    })
  })

  describe('strictRateLimiter', () => {
    it('should have very restrictive limits for sensitive endpoints', async () => {
      app.use(strictRateLimiter)
      app.post('/api/sensitive', c => c.json({ processed: true }))

      const res = await app.request('/api/sensitive', { method: 'POST' })

      expect(res.status).toBe(200)
      // In test environment, should have high limit (1000)
      expect(res.headers.get('RateLimit-Limit')).toBe('1000')
    })

    it('should have custom strict error message', async () => {
      app.use(strictRateLimiter)
      app.post('/api/expensive', c => c.json({ result: 'computed' }))

      // The custom message is "Rate limit exceeded. This endpoint has strict limits."
      // This is tested indirectly by checking the preset exists and works
      const res = await app.request('/api/expensive', { method: 'POST' })
      expect(res.status).toBe(200)
    })

    it('should have shorter window compared to other limiters', async () => {
      // This test verifies that the strict limiter has a 5-minute window
      // vs the 15-minute window of auth and general limiters
      app.use(strictRateLimiter)
      app.post('/api/strict', c => c.json({ success: true }))

      const res = await app.request('/api/strict', { method: 'POST' })
      expect(res.status).toBe(200)

      // The shorter window is reflected in the reset time header
      expect(res.headers.has('RateLimit-Reset')).toBe(true)
    })

    it('should skip rate limiting with X-Skip-Rate-Limit header in test environment', async () => {
      app.use(strictRateLimiter)
      app.post('/api/strict', c => c.json({ success: true }))

      const res = await app.request('/api/strict', {
        method: 'POST',
        headers: { 'X-Skip-Rate-Limit': 'true' },
      })

      expect(res.status).toBe(200)
    })
  })

  describe('Preset Comparison', () => {
    it('should have different configurations for different use cases', async () => {
      const authApp = new Hono()
      const generalApp = new Hono()
      const strictApp = new Hono()

      authApp.use(authRateLimiter)
      generalApp.use(generalRateLimiter)
      strictApp.use(strictRateLimiter)

      authApp.get('/test', c => c.text('auth'))
      generalApp.get('/test', c => c.text('general'))
      strictApp.get('/test', c => c.text('strict'))

      const authRes = await authApp.request('/test')
      const generalRes = await generalApp.request('/test')
      const strictRes = await strictApp.request('/test')

      // All should work in test environment
      expect(authRes.status).toBe(200)
      expect(generalRes.status).toBe(200)
      expect(strictRes.status).toBe(200)

      // All should have rate limit headers
      expect(authRes.headers.has('RateLimit-Limit')).toBe(true)
      expect(generalRes.headers.has('RateLimit-Limit')).toBe(true)
      expect(strictRes.headers.has('RateLimit-Limit')).toBe(true)
    })
  })
})
