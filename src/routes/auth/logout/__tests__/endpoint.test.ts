import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import logoutRoute from '../index'

describe('Logout Endpoint', () => {
  let app: Hono
  let mockDeleteAccessCookie: any

  beforeEach(() => {
    mockDeleteAccessCookie = mock((c) => {
      deleteCookie(c, 'auth-token', {
        path: '/',
        domain: 'example.com',
      })
    })

    mock.module('@/lib/cookie', () => ({
      deleteAccessCookie: mockDeleteAccessCookie,
    }))

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

    it('should handle logout without domain setting', async () => {
      mockDeleteAccessCookie.mockImplementationOnce((c: any) => {
        deleteCookie(c, 'auth-token', {
          path: '/',
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

    it('should handle requests without authentication or body', async () => {
      const testCases = [
        { name: 'without auth or headers', headers: undefined, body: undefined },
        { name: 'with ignored request body', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ someData: 'ignored' }) },
      ]

      for (const testCase of testCases) {
        const res = await app.request('/api/v1/auth/logout', {
          method: 'POST',
          ...(testCase.headers && { headers: testCase.headers }),
          ...(testCase.body && { body: testCase.body }),
        })

        expect(res.status).toBe(StatusCodes.NO_CONTENT)
      }
    })
  })

  describe('Cookie Deletion Mechanics', () => {
    it('should set correct cookie deletion attributes', async () => {
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('auth-token=')
      expect(cookies).toContain('Path=/')
      expect(cookies).toContain('Max-Age=0')
    })
  })
})
