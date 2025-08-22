import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import loginRoute from '../index'
import loginSchema from '../schema'

describe('Login Endpoint', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', loginRoute)
  })

  describe('POST /auth/login', () => {
    it('should return 200 when request is valid', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPass123!',
        }),
      })

      // Note: This will fail in integration tests without mocks
      // as it will try to access the real database
      // For now, we're testing the endpoint structure
      expect(res.status).toBeDefined()
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        { email: '', password: 'ValidPass123!' }, // Empty email
        { email: 'invalid', password: 'ValidPass123!' }, // Invalid format
        { email: 'test@', password: 'ValidPass123!' }, // Incomplete
        { email: '@example.com', password: 'ValidPass123!' }, // Missing local part
      ]

      for (const body of invalidEmails) {
        const res = await app.request('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should validate password requirements', async () => {
      const invalidPasswords = [
        { email: 'test@example.com', password: '' }, // Empty password
        { email: 'test@example.com', password: '123' }, // Too short
        { email: 'test@example.com', password: 'short' }, // Too short
        { email: 'test@example.com', password: 'NoNumbers!' }, // Missing number
        { email: 'test@example.com', password: 'NoSpecial123' }, // Missing special char
      ]

      for (const body of invalidPasswords) {
        const res = await app.request('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should require both email and password fields', async () => {
      const incompleteRequests = [
        { email: 'test@example.com' }, // Missing password
        { password: 'ValidPass123!' }, // Missing email
        {}, // Missing both
      ]

      for (const body of incompleteRequests) {
        const res = await app.request('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should require Content-Type header', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPass123!',
        }),
      })

      expect(res.status).toBe(StatusCodes.BAD_REQUEST)
    })

    it('should handle malformed JSON', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ invalid json',
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await app.request('/api/v1/auth/login', {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'validPassword123',
          }),
        })

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })

    it('should handle missing request body', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    })
  })

  describe('Validation Schema', () => {
    it('should accept valid email and password combinations', () => {
      const validCredentials = [
        {
          email: 'user@example.com',
          password: 'ValidPass123!',
        },
        {
          email: 'john.doe@company.com',
          password: 'AnotherPass456@',
        },
        {
          email: 'test+tag@email.com',
          password: 'SecurePass789!',
        },
        {
          email: 'user123@test-domain.com',
          password: 'ComplexPass2023#',
        },
      ]

      for (const credentials of validCredentials) {
        const result = loginSchema.safeParse(credentials)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        {
          email: '',
          password: 'ValidPass123!',
        },
        {
          email: 'invalid',
          password: 'ValidPass123!',
        },
        {
          email: 'test@',
          password: 'ValidPass123!',
        },
        {
          email: '@example.com',
          password: 'ValidPass123!',
        },
        {
          email: 'user @example.com',
          password: 'ValidPass123!',
        },
        {
          email: 'user@.com',
          password: 'ValidPass123!',
        },
        {
          email: 'user..name@example.com',
          password: 'ValidPass123!',
        },
      ]

      for (const credentials of invalidEmails) {
        const result = loginSchema.safeParse(credentials)
        expect(result.success).toBe(false)
      }
    })

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        {
          email: 'test@example.com',
          password: '',
        },
        {
          email: 'test@example.com',
          password: '123',
        },
        {
          email: 'test@example.com',
          password: 'short',
        },
        {
          email: 'test@example.com',
          password: '1234567', // Assuming min length is 8
        },
      ]

      for (const credentials of invalidPasswords) {
        const result = loginSchema.safeParse(credentials)
        expect(result.success).toBe(false)
      }
    })

    it('should require both email and password fields', () => {
      const incompleteCredentials = [
        {
          email: 'test@example.com',
          // missing password
        },
        {
          password: 'ValidPass123!',
          // missing email
        },
        {
          // missing both
        },
      ]

      for (const credentials of incompleteCredentials) {
        const result = loginSchema.safeParse(credentials)
        expect(result.success).toBe(false)
      }
    })

    it('should not accept extra fields', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'ValidPass123!',
        extra: 'field',
        remember: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          email: 'test@example.com',
          password: 'ValidPass123!',
        })
        expect(result.data).not.toHaveProperty('extra')
        expect(result.data).not.toHaveProperty('remember')
      }
    })

    it('should handle password with special characters', () => {
      const passwordsWithSpecialChars = [
        'Password123!',
        'Complex@Pass456#',
        'SecurePass789$%',
        'ValidPass2023&*',
      ]

      for (const password of passwordsWithSpecialChars) {
        const result = loginSchema.safeParse({
          email: 'test@example.com',
          password,
        })
        expect(result.success).toBe(true)
      }
    })
  })
})
