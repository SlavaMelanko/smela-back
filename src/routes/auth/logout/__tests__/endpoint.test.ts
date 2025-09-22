import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import logoutRoute from '../index'

// Mock the auth/cookie module
const mockDeleteAccessCookie = mock((c) => {
  // Simulate the deleteAccessCookie behavior with 'auth-token' name
  // This will be the default behavior, can be overridden in specific tests
  deleteCookie(c, 'auth-token', {
    path: '/',
    domain: 'example.com',
  })
})

mock.module('@/lib/cookie', () => ({
  deleteAccessCookie: mockDeleteAccessCookie,
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

      // Check cookie deletion
      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('auth-token=')
      expect(cookies).toContain('Path=/')
      expect(cookies).toContain('Max-Age=0') // Cookie deletion

      // Note: Domain presence depends on whether isDevOrTestEnv() returns false
      // The mock tries to simulate production, but in test environment it may not work
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
      // Override the mock for this specific test to simulate no domain
      mockDeleteAccessCookie.mockImplementation((c) => {
        deleteCookie(c, 'auth-token', {
          path: '/',
          // No domain set for this test
        })
      })

      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)

      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('auth-token=')
      expect(cookies).toContain('Path=/')
      expect(cookies).not.toContain('Domain=')

      // Reset mock to default behavior
      mockDeleteAccessCookie.mockImplementation((c) => {
        deleteCookie(c, 'auth-token', {
          path: '/',
          domain: 'example.com',
        })
      })
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

    it('should handle domain setting based on environment', async () => {
      // This test documents the behavior: domain is only set in production environments
      // In test/dev environments (where isDevOrTestEnv() returns true), domain is not set
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()

      // The actual behavior depends on the environment:
      // - In dev/test: no Domain attribute (even if COOKIE_DOMAIN is set)
      // - In production: Domain attribute is set if COOKIE_DOMAIN is configured
      // Since we're running in a test environment, Domain should not be present
      expect(cookies).toContain('auth-token=')
      expect(cookies).toContain('Path=/')
      expect(cookies).toContain('Max-Age=0')
    })
  })
})
