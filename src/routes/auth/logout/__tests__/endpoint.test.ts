import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import logoutRoute from '../index'

// Mock environment
mock.module('@/lib/env', () => ({
  default: {
    JWT_COOKIE_NAME: 'auth-token',
    COOKIE_DOMAIN: 'example.com',
  },
}))

describe('Logout Endpoint', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', logoutRoute)
  })

  describe('POST /auth/logout', () => {
    it('should clear authentication cookie', async () => {
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Cookie: 'auth-token=existing-token',
        },
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)

      // No content returned

      // Check cookie deletion
      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('auth-token=')
      expect(cookies).toContain('Path=/')
      expect(cookies).toContain('Domain=example.com')
      expect(cookies).toContain('Max-Age=0') // Cookie deletion
    })

    it('should work even without existing cookie', async () => {
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)

      // No content returned

      // Cookie deletion header should still be sent
      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('auth-token=')
    })

    it('should handle logout without domain in production', async () => {
      // Mock environment without COOKIE_DOMAIN
      mock.module('@/lib/env', () => ({
        default: {
          JWT_COOKIE_NAME: 'auth-token',
          COOKIE_DOMAIN: undefined,
        },
      }))

      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)

      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('auth-token=')
      expect(cookies).toContain('Path=/')
      expect(cookies).not.toContain('Domain=')
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await app.request('/api/v1/auth/logout', {
          method,
        })

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })

    it('should not require authentication to logout', async () => {
      // Test without any authentication headers/cookies
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)
    })

    it('should not require Content-Type header', async () => {
      // Logout doesn't need a request body
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)
    })

    it('should ignore request body if provided', async () => {
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ someData: 'ignored' }),
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)
      // No content returned
    })
  })

  describe('Cookie Deletion Mechanics', () => {
    it('should set Max-Age=0 to delete cookie', async () => {
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()

      // Max-Age=0 is the standard way to delete a cookie
      expect(cookies).toMatch(/Max-Age=0/)
    })

    it('should match the same path as login cookie', async () => {
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('Path=/')
    })

    it('should match the same domain as login cookie', async () => {
      // Re-mock with domain for this specific test
      mock.module('@/lib/env', () => ({
        default: {
          JWT_COOKIE_NAME: 'auth-token',
          COOKIE_DOMAIN: 'example.com',
        },
      }))

      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('Domain=example.com')
    })
  })
})
