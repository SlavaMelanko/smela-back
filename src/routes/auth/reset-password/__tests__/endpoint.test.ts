import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, ModuleMocker, post } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { TOKEN_LENGTH } from '@/security/token'

import resetPasswordRoute from '../index'

describe('Reset Password Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const RESET_PASSWORD_URL = '/api/v1/auth/reset-password'

  let app: Hono
  let mockResetPassword: any

  beforeEach(async () => {
    mockResetPassword = mock(async () => ({ data: { success: true } }))

    await moduleMocker.mock('@/use-cases/auth/reset-password', () => ({
      default: mockResetPassword,
    }))

    app = createTestApp('/api/v1/auth', resetPasswordRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  const validPayload = {
    data: {
      token: '1'.repeat(TOKEN_LENGTH),
      password: 'NewSecure@123',
    },
  }

  describe('POST /auth/reset-password', () => {
    it('should reset password and return success', async () => {
      const res = await post(app, RESET_PASSWORD_URL, validPayload)

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data).toEqual({ success: true })

      expect(mockResetPassword).toHaveBeenCalledWith({
        token: validPayload.data.token,
        password: validPayload.data.password,
      })
      expect(mockResetPassword).toHaveBeenCalledTimes(1)
    })

    it('should handle reset password errors', async () => {
      mockResetPassword.mockImplementationOnce(() => {
        throw new Error('Password reset failed')
      })

      const res = await post(app, RESET_PASSWORD_URL, validPayload)

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockResetPassword).toHaveBeenCalledTimes(1)
    })

    it('should validate token requirements', async () => {
      const invalidTokens = [
        { name: 'short token', token: 'short-token' },
        { name: 'long token', token: 'a'.repeat(100) },
        { name: 'missing token', token: null },
      ]

      for (const testCase of invalidTokens) {
        const payload: any = { data: { ...validPayload.data } }
        if (testCase.token !== null) {
          payload.data.token = testCase.token
        } else {
          delete payload.data.token
        }

        const res = await post(app, RESET_PASSWORD_URL, payload)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
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
        const payload: any = { data: { ...validPayload.data } }
        if (testCase.password !== null) {
          payload.data.password = testCase.password
        } else {
          delete payload.data.password
        }

        const res = await post(app, RESET_PASSWORD_URL, payload)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockResetPassword).not.toHaveBeenCalled()
      }
    })

    it('should handle malformed requests', async () => {
      const scenarios: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: validPayload },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{invalid json}' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, RESET_PASSWORD_URL, body, headers)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockResetPassword).not.toHaveBeenCalled()
      }
    })
  })
})
