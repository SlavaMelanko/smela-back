import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import { dev, test } from '../env'

describe('CORS Middleware', () => {
  describe('Development Environment', () => {
    const app = new Hono()
    app.use('*', dev())
    app.get('/test', c => c.json({ success: true }))

    it('should allow localhost origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'http://localhost:3000',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })

    it('should allow 127.0.0.1 origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'http://127.0.0.1:5173',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:5173')
    })

    it('should allow https localhost', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://localhost:8080',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://localhost:8080')
    })

    it('should reject non-localhost origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://example.com',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should handle requests without origin header', async () => {
      const response = await app.request('/test')

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should handle preflight requests', async () => {
      const response = await app.request('/test', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('600')
    })
  })

  describe('Test Environment', () => {
    const app = new Hono()
    app.use('*', test())
    app.get('/test', c => c.json({ success: true }))

    it('should allow all origins', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://any-domain.com',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should not send credentials', async () => {
      const response = await app.request('/test', {
        headers: {
          Origin: 'https://any-domain.com',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull()
    })
  })
})
