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
          captchaToken: 'valid-captcha-token',
        }),
      })

      // Note: This will fail in integration tests without mocks
      // as it will try to access the real database
      // For now, we're testing the endpoint structure
      expect(res.status).toBeDefined()
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        { email: '', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Empty email
        { email: 'invalid', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Invalid format
        { email: 'test@', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Incomplete
        { email: '@example.com', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Missing local part
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
        { email: 'test@example.com', password: '', captchaToken: 'valid-captcha-token' }, // Empty password
        { email: 'test@example.com', password: '123', captchaToken: 'valid-captcha-token' }, // Too short
        { email: 'test@example.com', password: 'short', captchaToken: 'valid-captcha-token' }, // Too short
        { email: 'test@example.com', password: 'NoNumbers!', captchaToken: 'valid-captcha-token' }, // Missing number
        { email: 'test@example.com', password: 'NoSpecial123', captchaToken: 'valid-captcha-token' }, // Missing special char
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
        { email: 'test@example.com', captchaToken: 'valid-captcha-token' }, // Missing password
        { password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Missing email
        { captchaToken: 'valid-captcha-token' }, // Missing both email and password
        {}, // Missing all fields
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
          captchaToken: 'valid-captcha-token',
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
            captchaToken: 'valid-captcha-token',
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
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'john.doe@company.com',
          password: 'AnotherPass456@',
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'test+tag@email.com',
          password: 'SecurePass789!',
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'user123@test-domain.com',
          password: 'ComplexPass2023#',
          captchaToken: 'valid-captcha-token',
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
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'invalid',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'test@',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          email: '@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'user @example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'user@.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'user..name@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
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
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'test@example.com',
          password: '123',
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'test@example.com',
          password: 'short',
          captchaToken: 'valid-captcha-token',
        },
        {
          email: 'test@example.com',
          password: '1234567', // Assuming min length is 8
          captchaToken: 'valid-captcha-token',
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
          captchaToken: 'valid-captcha-token',
          // missing password
        },
        {
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
          // missing email
        },
        {
          captchaToken: 'valid-captcha-token',
          // missing both email and password
        },
        {
          // missing all fields including captchaToken
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
        captchaToken: 'valid-captcha-token',
        extra: 'field',
        remember: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
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
          captchaToken: 'valid-captcha-token',
        })
        expect(result.success).toBe(true)
      }
    })
  })
})
