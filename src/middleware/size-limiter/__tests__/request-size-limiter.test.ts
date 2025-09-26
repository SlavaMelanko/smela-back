import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { HttpStatus } from '@/lib/http-status'

import onError from '../../on-error'
import {
  authRequestSizeLimiter,
  createRequestSizeLimiter,
  fileUploadSizeLimiter,
  generalRequestSizeLimiter,
} from '../index'

describe('Request Size Limiter Middleware', () => {
  let app: Hono<AppContext>

  beforeEach(() => {
    app = new Hono<AppContext>()
    app.onError(onError)
  })

  describe('General Request Size Limiter', () => {
    it('should allow requests under 100KB', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      const smallPayload = JSON.stringify({ data: 'x'.repeat(50000) }) // ~50KB
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': smallPayload.length.toString(),
        },
        body: smallPayload,
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('should reject requests over 100KB', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      const largePayload = JSON.stringify({ data: 'x'.repeat(150000) }) // ~150KB
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': largePayload.length.toString(),
        },
        body: largePayload,
      })

      expect(res.status).toBe(HttpStatus.REQUEST_TOO_LONG)
      const json = await res.json()
      expect(json.error).toBe('Request body too large.')
      expect(json.code).toBe('request/too-large')
    })

    it('should allow requests without Content-Length header if body is under limit', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      const smallPayload = JSON.stringify({ data: 'x'.repeat(50000) }) // ~50KB
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: smallPayload,
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('should reject requests without Content-Length header if body exceeds limit', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      const largePayload = JSON.stringify({ data: 'x'.repeat(150000) }) // ~150KB
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: largePayload,
      })

      expect(res.status).toBe(HttpStatus.REQUEST_TOO_LONG)
      const json = await res.json()
      expect(json.error).toBe('Request body too large.')
      expect(json.code).toBe('request/too-large')
    })

    it('should reject requests with invalid Content-Length header', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': 'invalid',
        },
        body: JSON.stringify({ data: 'test' }),
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      const json = await res.json()
      expect(json.error).toBe('Invalid Content-Length header.')
      expect(json.code).toBe('request/invalid-content-length')
    })
  })

  describe('Auth Request Size Limiter', () => {
    it('should allow requests under 10KB', async () => {
      app.use('*', authRequestSizeLimiter)
      app.post('/auth/login', c => c.json({ success: true }))

      const smallPayload = JSON.stringify({ email: 'test@test.com', password: 'Test123!' })
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': smallPayload.length.toString(),
        },
        body: smallPayload,
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('should reject requests over 10KB', async () => {
      app.use('*', authRequestSizeLimiter)
      app.post('/auth/login', c => c.json({ success: true }))

      const largePayload = JSON.stringify({
        email: 'test@test.com',
        password: 'Test123!',
        padding: 'x'.repeat(11000), // >10KB
      })
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': largePayload.length.toString(),
        },
        body: largePayload,
      })

      expect(res.status).toBe(HttpStatus.REQUEST_TOO_LONG)
      const json = await res.json()
      expect(json.error).toBe('Request body too large.')
      expect(json.code).toBe('request/too-large')
    })
  })

  describe('File Upload Size Limiter', () => {
    it('should allow files under 5MB', async () => {
      app.use('*', fileUploadSizeLimiter)
      app.post('/upload', c => c.json({ success: true }))

      const fileSize = 3 * 1024 * 1024 // 3MB
      const res = await app.request('/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Content-Length': fileSize.toString(),
        },
        body: new ArrayBuffer(fileSize),
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('should reject files over 5MB', async () => {
      app.use('*', fileUploadSizeLimiter)
      app.post('/upload', c => c.json({ success: true }))

      const fileSize = 6 * 1024 * 1024 // 6MB
      const res = await app.request('/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Content-Length': fileSize.toString(),
        },
        body: new ArrayBuffer(fileSize),
      })

      expect(res.status).toBe(HttpStatus.REQUEST_TOO_LONG)
      const json = await res.json()
      expect(json.error).toBe('Request body too large.')
      expect(json.code).toBe('request/too-large')
    })
  })

  describe('Custom Size Limiter', () => {
    it('should respect custom size limit', async () => {
      const customLimiter = createRequestSizeLimiter({ maxSize: 1024 }) // 1KB limit
      app.use('*', customLimiter)
      app.post('/test', c => c.json({ success: true }))

      // Test with 500 bytes (should pass).
      const smallPayload = JSON.stringify({ data: 'x'.repeat(400) })
      const smallRes = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': smallPayload.length.toString(),
        },
        body: smallPayload,
      })

      expect(smallRes.status).toBe(HttpStatus.OK)

      // Test with 2KB (should fail).
      const largePayload = JSON.stringify({ data: 'x'.repeat(2000) })
      const largeRes = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': largePayload.length.toString(),
        },
        body: largePayload,
      })

      expect(largeRes.status).toBe(HttpStatus.REQUEST_TOO_LONG)
    })
  })

  describe('Content-Length Mismatch Detection', () => {
    it('should reject when Content-Length is smaller than actual body', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      const payload = JSON.stringify({ data: 'x'.repeat(1000) })
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '100', // Declare smaller size than actual
        },
        body: payload,
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      const json = await res.json()
      expect(json.error).toBe('Content-Length header does not match actual body size.')
      expect(json.code).toBe('request/content-length-mismatch')
    })

    it('should reject when Content-Length is larger than actual body', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      const payload = JSON.stringify({ data: 'test' })
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '10000', // Declare larger size than actual
        },
        body: payload,
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      const json = await res.json()
      expect(json.error).toBe('Content-Length header does not match actual body size.')
      expect(json.code).toBe('request/content-length-mismatch')
    })
  })

  describe('Edge Cases', () => {
    it('should handle Content-Length of 0', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '0',
        },
        body: '',
      })

      expect(res.status).toBe(HttpStatus.OK)
    })

    it('should handle exact size limit', async () => {
      const customLimiter = createRequestSizeLimiter({ maxSize: 1024 })
      app.use('*', customLimiter)
      app.post('/test', c => c.json({ success: true }))

      // Create payload of exactly 1024 bytes.
      const exactPayload = 'x'.repeat(1024)
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': '1024',
        },
        body: exactPayload,
      })

      expect(res.status).toBe(HttpStatus.OK)
    })

    it('should handle negative Content-Length', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      const payload = JSON.stringify({ data: 'test' })
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '-1',
        },
        body: payload,
      })

      // Negative Content-Length is invalid and should be rejected immediately.
      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      const json = await res.json()
      expect(json.error).toBe('Invalid Content-Length header.')
      expect(json.code).toBe('request/invalid-content-length')
    })

    it('should handle GET requests without body', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.get('/test', c => c.json({ success: true }))

      const res = await app.request('/test', {
        method: 'GET',
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('should handle HEAD requests without body', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.all('/test', (c) => {
        if (c.req.method === 'HEAD') {
          return c.body(null, HttpStatus.OK)
        }

        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'HEAD',
      })

      expect(res.status).toBe(HttpStatus.OK)
    })

    it('should handle DELETE requests without body', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.delete('/test', c => c.json({ success: true }))

      const res = await app.request('/test', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('should handle OPTIONS requests without body', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.options('/test', c => c.json({ success: true }))

      const res = await app.request('/test', {
        method: 'OPTIONS',
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })
  })

  describe('Streaming Validation', () => {
    it('should use streaming for large payloads when enabled', async () => {
      const streamingLimiter = createRequestSizeLimiter({
        maxSize: 1024 * 1024, // 1MB
      })

      app.use('*', streamingLimiter)
      app.post('/test', c => c.json({ success: true }))

      // Test with 500KB payload (should use streaming).
      const largePayload = 'x'.repeat(500 * 1024)
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': largePayload.length.toString(),
        },
        body: largePayload,
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('should reject large streaming payloads exceeding limit', async () => {
      const streamingLimiter = createRequestSizeLimiter({
        maxSize: 100 * 1024, // 100KB
      })

      app.use('*', streamingLimiter)
      app.post('/test', c => c.json({ success: true }))

      // Test with 200KB payload (should be rejected).
      const largePayload = 'x'.repeat(200 * 1024)
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': largePayload.length.toString(),
        },
        body: largePayload,
      })

      expect(res.status).toBe(HttpStatus.REQUEST_TOO_LONG)
      const json = await res.json()
      expect(json.error).toBe('Request body too large.')
      expect(json.code).toBe('request/too-large')
    })

    it('should handle streaming validation without Content-Length', async () => {
      const streamingLimiter = createRequestSizeLimiter({
        maxSize: 50 * 1024, // 50KB
      })

      app.use('*', streamingLimiter)
      app.post('/test', c => c.json({ success: true }))

      // Test with 30KB payload without Content-Length.
      const payload = 'x'.repeat(30 * 1024)
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: payload,
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('should detect Content-Length mismatch with streaming', async () => {
      const streamingLimiter = createRequestSizeLimiter({
        maxSize: 100 * 1024, // 100KB
      })

      app.use('*', streamingLimiter)
      app.post('/test', c => c.json({ success: true }))

      const payload = 'x'.repeat(20 * 1024) // 20KB
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': '10000', // Lie about size
        },
        body: payload,
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      const json = await res.json()
      expect(json.error).toBe('Content-Length header does not match actual body size.')
      expect(json.code).toBe('request/content-length-mismatch')
    })

    it('should handle fileUploadSizeLimiter with streaming', async () => {
      app.use('*', fileUploadSizeLimiter)
      app.post('/upload', c => c.json({ success: true }))

      // Test with 2MB file (under 5MB limit).
      const fileSize = 2 * 1024 * 1024
      const fileContent = new ArrayBuffer(fileSize)

      const res = await app.request('/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileSize.toString(),
        },
        body: fileContent,
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
    })
  })

  describe('Security Attack Scenarios', () => {
    it('should prevent bypass via missing Content-Length with large body', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      // Attempt to bypass by not sending Content-Length header.
      const largePayload = 'x'.repeat(200000) // 200KB
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          // No Content-Length header.
        },
        body: largePayload,
      })

      expect(res.status).toBe(HttpStatus.REQUEST_TOO_LONG)
      const json = await res.json()
      expect(json.error).toBe('Request body too large.')
      expect(json.code).toBe('request/too-large')
    })

    it('should prevent bypass via incorrect Content-Length with large body', async () => {
      app.use('*', generalRequestSizeLimiter)
      app.post('/test', c => c.json({ success: true }))

      // Attempt to bypass by sending small Content-Length but large body.
      const largePayload = 'x'.repeat(200000) // 200KB
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': '100', // Lie about size
        },
        body: largePayload,
      })

      // Should be rejected due to actual body size exceeding limit.
      expect(res.status).toBe(HttpStatus.REQUEST_TOO_LONG)
      const json = await res.json()
      expect(json.error).toBe('Request body too large.')
      expect(json.code).toBe('request/too-large')
    })
  })
})
