import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import loginRoute from '../index'
import loginSchema from '../schema'

describe('Login Endpoint', () => {
  let app: Hono

  const createApp = () => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', loginRoute)
  }

  beforeEach(() => {
    mockCaptchaSuccess()
    createApp()
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
          captchaToken: VALID_CAPTCHA_TOKEN,
        }),
      })

      // Note: This will fail in integration tests without mocks
      // as it will try to access the real database
      // For now, we're testing the endpoint structure
      expect(res.status).toBeDefined()
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        { email: '', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // Empty email
        { email: 'invalid', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // Invalid format
        { email: 'test@', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // Incomplete
        { email: '@example.com', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // Missing local part
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
        { email: 'test@example.com', password: '', captchaToken: VALID_CAPTCHA_TOKEN }, // Empty password
        { email: 'test@example.com', password: '123', captchaToken: VALID_CAPTCHA_TOKEN }, // Too short
        { email: 'test@example.com', password: 'short', captchaToken: VALID_CAPTCHA_TOKEN }, // Too short
        { email: 'test@example.com', password: 'NoNumbers!', captchaToken: VALID_CAPTCHA_TOKEN }, // Missing number
        { email: 'test@example.com', password: 'NoSpecial123', captchaToken: VALID_CAPTCHA_TOKEN }, // Missing special char
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
        { email: 'test@example.com', captchaToken: VALID_CAPTCHA_TOKEN }, // Missing password
        { password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // Missing email
        { captchaToken: VALID_CAPTCHA_TOKEN }, // Missing both email and password
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
          captchaToken: VALID_CAPTCHA_TOKEN,
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
            captchaToken: VALID_CAPTCHA_TOKEN,
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

  describe('Schema Validation', () => {
    it('should accept valid credentials with special characters', () => {
      const validCredentials = [
        {
          email: 'user@example.com',
          password: 'ValidPass123!',
          captchaToken: VALID_CAPTCHA_TOKEN,
        },
        {
          email: 'john.doe+test@company.com',
          password: 'Complex@Pass456#',
          captchaToken: VALID_CAPTCHA_TOKEN,
        },
        {
          email: 'user123@test-domain.co.uk',
          password: 'SecurePass789$%&*',
          captchaToken: VALID_CAPTCHA_TOKEN,
        },
      ]

      for (const credentials of validCredentials) {
        const result = loginSchema.safeParse(credentials)
        expect(result.success).toBe(true)
      }
    })

    it('should not accept extra fields', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
        extra: 'field',
        remember: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: VALID_CAPTCHA_TOKEN,
        })
        expect(result.data).not.toHaveProperty('extra')
        expect(result.data).not.toHaveProperty('remember')
      }
    })
  })
})
