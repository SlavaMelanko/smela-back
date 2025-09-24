import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import logoutRoute from '../index'

describe('Logout Handler', () => {
  let app: Hono
  let mockDeleteAccessCookie: any

  beforeEach(() => {
    mockDeleteAccessCookie = mock(() => {})

    mock.module('@/lib/cookie', () => ({
      deleteAccessCookie: mockDeleteAccessCookie,
    }))

    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', logoutRoute)
  })

  describe('POST /auth/logout', () => {
    it('should delete access cookie and return 204', async () => {
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Cookie: 'auth-token=existing-token',
        },
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)
      expect(await res.text()).toBe('')

      expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(1)
      expect(mockDeleteAccessCookie).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should work without existing cookie', async () => {
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)

      expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(1)
    })

    it('should handle logout with request body', async () => {
      const res = await app.request('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ someData: 'ignored' }),
      })

      expect(res.status).toBe(StatusCodes.NO_CONTENT)

      expect(mockDeleteAccessCookie).toHaveBeenCalledTimes(1)
    })
  })
})
