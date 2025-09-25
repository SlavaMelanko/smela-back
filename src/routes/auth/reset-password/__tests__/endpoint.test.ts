import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { TOKEN_LENGTH } from '@/lib/token/constants'
import { loggerMiddleware, onError } from '@/middleware'

import resetPasswordRoute from '../index'

describe('Reset Password Endpoint', () => {
  let app: Hono
  let mockResetPassword: any

  const createApp = () => {
    app = new Hono()
    app.use(loggerMiddleware)
    app.onError(onError)
    app.route('/api/v1/auth', resetPasswordRoute)
  }

  const postRequest = (
    body: any,
    headers: Record<string, string> = { 'Content-Type': 'application/json' },
    method: string = 'POST',
  ) =>
    app.request('/api/v1/auth/reset-password', {
      method,
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  beforeEach(() => {
    mockResetPassword = mock(() => Promise.resolve({ success: true }))

    mock.module('../reset-password', () => ({
      default: mockResetPassword,
    }))

    createApp()
  })

  const validPayload = {
    token: '1'.repeat(TOKEN_LENGTH),
    password: 'NewSecure@123',
  }

  describe('POST /auth/reset-password', () => {
    it('should reset password and return success', async () => {
      const res = await postRequest(validPayload)

      expect(res.status).toBe(StatusCodes.OK)

      const data = await res.json()
      expect(data).toEqual({ success: true })

      expect(mockResetPassword).toHaveBeenCalledWith({
        token: validPayload.token,
        password: validPayload.password,
      })
      expect(mockResetPassword).toHaveBeenCalledTimes(1)
    })

    it('should validate token requirements', async () => {
      const invalidTokens = [
        { name: 'short token', token: 'short-token' },
        { name: 'long token', token: 'a'.repeat(100) },
        { name: 'missing token', token: null },
      ]

      for (const testCase of invalidTokens) {
        const payload: any = { ...validPayload }
        if (testCase.token !== null) {
          payload.token = testCase.token
        } else {
          delete payload.token
        }

        const res = await postRequest(payload)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        expect(mockResetPassword).not.toHaveBeenCalled()
      }
    })

    it('should validate password requirements', async () => {
      const invalidPasswords = [
        { name: 'short password', password: 'short' },
        { name: 'no special chars', password: 'NoSpecialChars123' },
        { name: 'no numbers', password: 'NoNumbers@Special' },
        { name: 'no letters', password: '12345678@#$' },
        { name: 'missing password', password: null },
      ]

      for (const testCase of invalidPasswords) {
        const payload: any = { ...validPayload }
        if (testCase.password !== null) {
          payload.password = testCase.password
        } else {
          delete payload.password
        }

        const res = await postRequest(payload)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        expect(mockResetPassword).not.toHaveBeenCalled()
      }
    })

    it('should handle malformed requests', async () => {
      const malformedRequests: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: validPayload },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{invalid json}' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const testCase of malformedRequests) {
        const res = testCase.name === 'missing Content-Type'
          ? await app.request('/api/v1/auth/reset-password', {
              method: 'POST',
              headers: testCase.headers,
              body: JSON.stringify(testCase.body),
            })
          : await postRequest(testCase.body, testCase.headers)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        expect(mockResetPassword).not.toHaveBeenCalled()
      }
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await postRequest(validPayload, { 'Content-Type': 'application/json' }, method)

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })

    it('should handle different valid password formats', async () => {
      const testCases = [
        { token: 'a'.repeat(TOKEN_LENGTH), password: 'SimplePass123!' },
        { token: 'b'.repeat(TOKEN_LENGTH), password: 'Complex@Pass456#' },
        { token: 'c'.repeat(TOKEN_LENGTH), password: 'Secure$Pass789&' },
      ]

      for (const testCase of testCases) {
        const res = await postRequest(testCase)

        expect(res.status).toBe(StatusCodes.OK)
        expect(mockResetPassword).toHaveBeenCalledWith(testCase)
      }
    })

    it('should handle reset password errors', async () => {
      mockResetPassword.mockImplementationOnce(() => {
        throw new Error('Password reset failed')
      })

      const res = await postRequest(validPayload)

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(mockResetPassword).toHaveBeenCalledTimes(1)
    })
  })
})
