import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { StatusCodes } from 'http-status-codes'

import { createTestApp, doRequest, ModuleMocker, post } from '@/__tests__'

import logoutRoute from '../index'

describe('Logout Endpoint', () => {
  const LOGOUT_URL = '/api/v1/auth/logout'

  let app: Hono
  let mockDeleteAccessCookie: any

  const moduleMocker = new ModuleMocker(import.meta.url)

  beforeEach(async () => {
    mockDeleteAccessCookie = mock(() => {})

    await moduleMocker.mock('@/lib/cookie/access-cookie', () => ({
      deleteAccessCookie: mockDeleteAccessCookie,
      getAccessCookie: mock(() => undefined),
      setAccessCookie: mock(() => {}),
    }))

    await moduleMocker.mock('@/lib/cookie', () => ({
      deleteAccessCookie: mockDeleteAccessCookie,
    }))

    app = createTestApp('/api/v1/auth', logoutRoute)
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('POST /auth/logout', () => {
    it('should delete access cookie and return 204 No Content', async () => {
      const res = await post(app, LOGOUT_URL, undefined, {
        Cookie: 'auth-token=existing-token',
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)
      expect(await res.text()).toBe('')

      // Verify proper 204 headers - no content type, content-length is 0 or null
      expect(res.headers.get('content-type')).toBeNull()
      const contentLength = res.headers.get('content-length')
      expect(contentLength === '0' || contentLength === null).toBe(true)

      // Verify cookie deletion was called
      // Note: In integration testing, you would also verify:
      // expect(res.headers.get('Set-Cookie')).toContain('auth-token=;')
      expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(1)
      expect(mockDeleteAccessCookie).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should handle different cookie headers', async () => {
      const cookieScenarios = [
        { name: 'no cookie header', headers: undefined },
        { name: 'empty cookie header', headers: { Cookie: '' } },
        { name: 'unrelated cookies', headers: { Cookie: 'other=value; session=abc123' } },
        { name: 'auth token cookie', headers: { Cookie: 'auth-token=jwt-token-value' } },
        { name: 'multiple cookies with auth', headers: { Cookie: 'auth-token=jwt-token; other=value' } },
      ]

      let callCount = 0
      for (const scenario of cookieScenarios) {
        const res = await post(app, LOGOUT_URL, undefined, scenario.headers)

        expect(res.status).toBe(StatusCodes.NO_CONTENT)
        expect(await res.text()).toBe('')

        // Verify proper 204 headers - no content type, content-length is 0 or null
        expect(res.headers.get('content-type')).toBeNull()
        const contentLength = res.headers.get('content-length')
        expect(contentLength === '0' || contentLength === null).toBe(true)

        expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(++callCount)
        expect(mockDeleteAccessCookie).toHaveBeenCalledWith(expect.any(Object))
      }
    })

    it('should handle malformed requests', async () => {
      const scenarios = [
        { name: 'no body', headers: { 'Content-Type': 'application/json' }, body: undefined },
        { name: 'valid JSON body (body is ignored)', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ someData: 'ignored' }) },
        { name: 'malformed JSON body', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
      ]

      let callCount = 0
      for (const { headers, body } of scenarios) {
        const res = await post(app, LOGOUT_URL, body, headers)

        expect(res.status).toBe(StatusCodes.NO_CONTENT)
        expect(await res.text()).toBe('')
        expect(res.headers.get('content-type')).toBeNull()
        expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(++callCount)
      }
    })

    it('should handle logout errors gracefully', async () => {
      mockDeleteAccessCookie.mockImplementationOnce(() => {
        throw new Error('Cookie deletion failed')
      })

      const res = await post(app, LOGOUT_URL)

      // Should return an error due to middleware handling
      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

      // Verify the function was called despite the error
      expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple consecutive logout calls gracefully', async () => {
      const numCalls = 3
      const responses = []

      // Simulate rapid consecutive logout button clicks
      for (let i = 0; i < numCalls; i++) {
        const res = await post(app, LOGOUT_URL, undefined, {
          Cookie: 'auth-token=jwt-token-value',
        })

        responses.push(res)

        expect(res.status).toBe(StatusCodes.NO_CONTENT)
        expect(await res.text()).toBe('')
        expect(res.headers.get('content-type')).toBeNull()

        // Verify cookie deletion function is called for each request
        // (checked collectively after the loop)
      }

      // Verify deleteAccessCookie was called for each logout attempt
      expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(numCalls)

      // Verify all calls were made with the correct context
      for (let i = 0; i < numCalls; i++) {
        expect(mockDeleteAccessCookie).toHaveBeenNthCalledWith(i + 1, expect.any(Object))
      }
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

      for (const method of methods) {
        const res = await doRequest(app, LOGOUT_URL, method)

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
        // Verify cookie deletion is NOT called for invalid methods
        expect(mockDeleteAccessCookie).not.toHaveBeenCalled()
      }
    })
  })
})
