import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import resetPasswordRoute from '../index'
import resetPasswordSchema from '../schema'

// Mock the reset password function
const mockResetPassword = mock(() => Promise.resolve({ success: true }))

mock.module('../reset-password', () => ({
  default: mockResetPassword,
}))

describe('Reset Password Endpoint', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', resetPasswordRoute)
    mockResetPassword.mockClear()
  })

  const validPayload = {
    token: '1234567890123456789012345678901234567890123456789012345678901234',
    password: 'NewSecure@123',
  }

  describe('POST /auth/reset-password', () => {
    it('should reset password successfully with valid input', async () => {
      const res = await app.request('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPayload),
      })

      expect(res.status).toBe(StatusCodes.OK)

      const data = await res.json()
      expect(data).toEqual({ success: true })

      expect(mockResetPassword).toHaveBeenCalledWith({
        token: validPayload.token,
        password: validPayload.password,
      })
      expect(mockResetPassword).toHaveBeenCalledTimes(1)
    })

    describe('token validation', () => {
      it('should reject short token', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...validPayload,
            token: 'short-token',
          }),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)

        const data = await res.json()
        expect(data.error).toContain('Token must be exactly 64 characters long')

        expect(mockResetPassword).not.toHaveBeenCalled()
      })

      it('should reject long token', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...validPayload,
            token: 'a'.repeat(100),
          }),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)

        const data = await res.json()
        expect(data.error).toContain('Token must be exactly 64 characters long')

        expect(mockResetPassword).not.toHaveBeenCalled()
      })

      it('should reject missing token', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: validPayload.password,
          }),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        expect(mockResetPassword).not.toHaveBeenCalled()
      })
    })

    describe('password validation', () => {
      it('should reject short password', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...validPayload,
            password: 'short',
          }),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)

        const data = await res.json()
        expect(data.error).toContain('String must contain at least 8 character(s)')

        expect(mockResetPassword).not.toHaveBeenCalled()
      })

      it('should reject password without special characters', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...validPayload,
            password: 'NoSpecialChars123',
          }),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)

        const data = await res.json()
        expect(data.error).toContain('Minimum eight characters, at least one letter, one number and one special character')

        expect(mockResetPassword).not.toHaveBeenCalled()
      })

      it('should reject password without numbers', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...validPayload,
            password: 'NoNumbers@Special',
          }),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)

        const data = await res.json()
        expect(data.error).toContain('Minimum eight characters, at least one letter, one number and one special character')

        expect(mockResetPassword).not.toHaveBeenCalled()
      })

      it('should reject password without letters', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...validPayload,
            password: '12345678@#$',
          }),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)

        const data = await res.json()
        expect(data.error).toContain('Minimum eight characters, at least one letter, one number and one special character')

        expect(mockResetPassword).not.toHaveBeenCalled()
      })

      it('should reject missing password', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: validPayload.token,
          }),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        expect(mockResetPassword).not.toHaveBeenCalled()
      })
    })

    describe('request validation', () => {
      it('should reject empty body', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        expect(mockResetPassword).not.toHaveBeenCalled()
      })

      it('should handle malformed JSON', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: '{invalid json}',
        })

        expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
        expect(mockResetPassword).not.toHaveBeenCalled()
      })

      it('should require Content-Type header', async () => {
        const res = await app.request('/api/v1/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify(validPayload),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        expect(mockResetPassword).not.toHaveBeenCalled()
      })

      it('should only accept POST method', async () => {
        const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

        for (const method of methods) {
          const res = await app.request('/api/v1/auth/reset-password', {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(validPayload),
          })

          expect(res.status).toBe(StatusCodes.NOT_FOUND)
        }
      })
    })
  })

  describe('Validation Schema', () => {
    it('should accept valid token and password combinations', () => {
      const validInputs = [
        {
          token: '1234567890123456789012345678901234567890123456789012345678901234',
          password: 'ValidPass123!',
        },
        {
          token: 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWX1234',
          password: 'AnotherPass456@',
        },
        {
          token: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          password: 'SecurePass789#',
        },
      ]

      for (const input of validInputs) {
        const result = resetPasswordSchema.safeParse(input)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid tokens', () => {
      const invalidTokens = [
        {
          token: '', // Empty
          password: 'ValidPass123!',
        },
        {
          token: 'short', // Too short
          password: 'ValidPass123!',
        },
        {
          token: 'a'.repeat(100), // Too long
          password: 'ValidPass123!',
        },
      ]

      for (const input of invalidTokens) {
        const result = resetPasswordSchema.safeParse(input)
        expect(result.success).toBe(false)
      }
    })

    it('should reject invalid passwords', () => {
      const token = '1234567890123456789012345678901234567890123456789012345678901234'
      const invalidPasswords = [
        {
          token,
          password: '', // Empty
        },
        {
          token,
          password: '123', // Too short
        },
        {
          token,
          password: 'NoNumbers!', // Missing number
        },
        {
          token,
          password: 'NoSpecial123', // Missing special char
        },
        {
          token,
          password: '12345678!', // Missing letter
        },
      ]

      for (const input of invalidPasswords) {
        const result = resetPasswordSchema.safeParse(input)
        expect(result.success).toBe(false)
      }
    })

    it('should require both token and password fields', () => {
      const incompleteInputs = [
        {
          token: '1234567890123456789012345678901234567890123456789012345678901234',
          // missing password
        },
        {
          password: 'ValidPass123!',
          // missing token
        },
        {
          // missing both token and password
        },
      ]

      for (const input of incompleteInputs) {
        const result = resetPasswordSchema.safeParse(input)
        expect(result.success).toBe(false)
      }
    })
  })
})
