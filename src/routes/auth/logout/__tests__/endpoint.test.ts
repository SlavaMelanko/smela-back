import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import logoutRoute from '../index'

describe('Logout Endpoint', () => {
  let app: Hono
  let mockDeleteAccessCookie: any

  const createApp = () => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', logoutRoute)
  }

  const postRequest = (headers?: Record<string, string>, body?: string, method = 'POST') =>
    app.request('/api/v1/auth/logout', {
      method,
      ...(headers && { headers }),
      ...(body && { body }),
    })

  beforeEach(() => {
    mockDeleteAccessCookie = mock(() => {})

    mock.module('@/lib/cookie/access-cookie', () => ({
      deleteAccessCookie: mockDeleteAccessCookie,
      getAccessCookie: mock(() => undefined),
      setAccessCookie: mock(() => {}),
    }))

    mock.module('@/lib/cookie', () => ({
      deleteAccessCookie: mockDeleteAccessCookie,
    }))

    createApp()
  })

  describe('POST /auth/logout', () => {
    it('should delete access cookie and return 204 No Content', async () => {
      const res = await postRequest({
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

    it('should work without existing cookie', async () => {
      const res = await postRequest()

      expect(res.status).toBe(StatusCodes.NO_CONTENT)
      expect(await res.text()).toBe('')

      // Verify proper 204 headers - no content type
      expect(res.headers.get('content-type')).toBeNull()

      // Cookie deletion should still be called
      expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(1)
      expect(mockDeleteAccessCookie).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should handle request with body (body is ignored)', async () => {
      const res = await postRequest({
        'Content-Type': 'application/json',
      }, JSON.stringify({ someData: 'ignored' }))

      expect(res.status).toBe(StatusCodes.NO_CONTENT)
      expect(await res.text()).toBe('')

      // Verify proper 204 headers - no content type in response, despite JSON input
      expect(res.headers.get('content-type')).toBeNull()
      const contentLength = res.headers.get('content-length')
      expect(contentLength === '0' || contentLength === null).toBe(true)

      // Cookie deletion should still work
      expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(1)
    })

    it('should handle malformed JSON body gracefully', async () => {
      const res = await postRequest({
        'Content-Type': 'application/json',
      }, '{ invalid json')

      expect(res.status).toBe(StatusCodes.NO_CONTENT)
      expect(await res.text()).toBe('')

      // Verify proper 204 headers even with malformed input
      expect(res.headers.get('content-type')).toBeNull()

      expect(mockDeleteAccessCookie).toHaveBeenCalled()
    })

    it('should handle logout errors gracefully', async () => {
      mockDeleteAccessCookie.mockImplementationOnce(() => {
        throw new Error('Cookie deletion failed')
      })

      const res = await postRequest()

      // Should return an error due to middleware handling
      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

      // Verify the function was called despite the error
      expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(1)
    })

    it('should handle various request configurations', async () => {
      const requestConfigs: Array<{ name: string, headers?: Record<string, string>, expectStatus: number }> = [
        { name: 'minimal request', headers: undefined, expectStatus: StatusCodes.NO_CONTENT },
        { name: 'with user agent', headers: { 'User-Agent': 'Test Browser' }, expectStatus: StatusCodes.NO_CONTENT },
        { name: 'with accept header', headers: { Accept: 'application/json' }, expectStatus: StatusCodes.NO_CONTENT },
        { name: 'with custom headers', headers: { 'X-Custom-Header': 'test' }, expectStatus: StatusCodes.NO_CONTENT },
      ]

      for (const config of requestConfigs) {
        const res = await postRequest(config.headers)

        expect(res.status).toBe(config.expectStatus)
        if (config.expectStatus === StatusCodes.NO_CONTENT) {
          expect(await res.text()).toBe('')

          // Verify proper 204 headers for all successful requests
          expect(res.headers.get('content-type')).toBeNull()

          expect(mockDeleteAccessCookie).toHaveBeenCalled()
        }
      }
    })

    it('should handle multiple consecutive logout calls gracefully', async () => {
      const numCalls = 3
      const responses = []

      // Simulate rapid consecutive logout button clicks
      for (let i = 0; i < numCalls; i++) {
        const res = await postRequest({
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
  })

  it('should only accept POST method', async () => {
    const methods = ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

    for (const method of methods) {
      const res = await postRequest(undefined, undefined, method)

      expect(res.status).toBe(StatusCodes.NOT_FOUND)
      // Verify cookie deletion is NOT called for invalid methods
      expect(mockDeleteAccessCookie).not.toHaveBeenCalled()
    }
  })

  it('should work with different cookie scenarios', async () => {
    const cookieScenarios = [
      { name: 'no cookie header', headers: undefined },
      { name: 'empty cookie header', headers: { Cookie: '' } },
      { name: 'unrelated cookies', headers: { Cookie: 'other=value; session=abc123' } },
      { name: 'auth token cookie', headers: { Cookie: 'auth-token=jwt-token-value' } },
      { name: 'multiple cookies with auth', headers: { Cookie: 'auth-token=jwt-token; other=value' } },
    ]

    for (const scenario of cookieScenarios) {
      const res = await postRequest(scenario.headers)

      expect(res.status).toBe(StatusCodes.NO_CONTENT)
      expect(await res.text()).toBe('')

      // Verify proper 204 headers for all cookie scenarios
      expect(res.headers.get('content-type')).toBeNull()

      expect(mockDeleteAccessCookie).toHaveBeenCalledWith(expect.any(Object))
    }
  })
})
