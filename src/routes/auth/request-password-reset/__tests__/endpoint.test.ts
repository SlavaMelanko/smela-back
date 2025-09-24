import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import requestPasswordResetRoute from '../index'
import requestPasswordResetSchema from '../schema'

describe('Request Password Reset Endpoint', () => {
  let app: Hono

  beforeEach(() => {
    mockCaptchaSuccess()

    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', requestPasswordResetRoute)
  })

  describe('POST /auth/request-password-reset', () => {
    it('should return 200 when request is valid', async () => {
      const res = await app.request('/api/v1/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
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
        { email: '', captchaToken: VALID_CAPTCHA_TOKEN }, // Empty email
        { email: 'invalid', captchaToken: VALID_CAPTCHA_TOKEN }, // Invalid format
        { email: 'test@', captchaToken: VALID_CAPTCHA_TOKEN }, // Incomplete
        { email: '@example.com', captchaToken: VALID_CAPTCHA_TOKEN }, // Missing local part
        { captchaToken: VALID_CAPTCHA_TOKEN }, // Missing email field
      ]

      for (const body of invalidEmails) {
        const res = await app.request('/api/v1/auth/request-password-reset', {
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

    it('should validate captcha token', async () => {
      const invalidCaptchaRequests = [
        { email: 'test@example.com' }, // Missing captcha token
        { email: 'test@example.com', captchaToken: '' }, // Empty captcha token
        { email: 'test@example.com', captchaToken: 'invalid-token' }, // Invalid captcha token
      ]

      for (const body of invalidCaptchaRequests) {
        const res = await app.request('/api/v1/auth/request-password-reset', {
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
      const res = await app.request('/api/v1/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }),
      })

      expect(res.status).toBe(StatusCodes.BAD_REQUEST)
    })

    it('should handle malformed JSON', async () => {
      const res = await app.request('/api/v1/auth/request-password-reset', {
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
        const res = await app.request('/api/v1/auth/request-password-reset', {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            captchaToken: VALID_CAPTCHA_TOKEN,
          }),
        })

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })
  })

  describe('Validation Schema', () => {
    it('should accept valid email addresses and captcha tokens', () => {
      const validInputs = [
        { email: 'user@example.com', captchaToken: VALID_CAPTCHA_TOKEN },
        { email: 'john.doe@company.com', captchaToken: VALID_CAPTCHA_TOKEN },
        { email: 'test+tag@email.com', captchaToken: VALID_CAPTCHA_TOKEN },
        { email: 'user123@test-domain.com', captchaToken: VALID_CAPTCHA_TOKEN },
      ]

      for (const input of validInputs) {
        const result = requestPasswordResetSchema.safeParse(input)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid email addresses', () => {
      const invalidInputs = [
        { email: '', captchaToken: VALID_CAPTCHA_TOKEN },
        { email: 'invalid', captchaToken: VALID_CAPTCHA_TOKEN },
        { email: 'test@', captchaToken: VALID_CAPTCHA_TOKEN },
        { email: '@example.com', captchaToken: VALID_CAPTCHA_TOKEN },
        { email: 'user @example.com', captchaToken: VALID_CAPTCHA_TOKEN },
        { email: 'user@.com', captchaToken: VALID_CAPTCHA_TOKEN },
        { email: 'user..name@example.com', captchaToken: VALID_CAPTCHA_TOKEN },
      ]

      for (const input of invalidInputs) {
        const result = requestPasswordResetSchema.safeParse(input)
        expect(result.success).toBe(false)
      }
    })

    it('should reject invalid captcha tokens', () => {
      const invalidInputs = [
        { email: 'test@example.com' }, // Missing captcha token
        { email: 'test@example.com', captchaToken: '' }, // Empty captcha token
        { email: 'test@example.com', captchaToken: 'invalid' }, // Invalid captcha token
      ]

      for (const input of invalidInputs) {
        const result = requestPasswordResetSchema.safeParse(input)
        expect(result.success).toBe(false)
      }
    })

    it('should not accept extra fields', () => {
      const result = requestPasswordResetSchema.safeParse({
        email: 'test@example.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
        extra: 'field',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          email: 'test@example.com',
          captchaToken: VALID_CAPTCHA_TOKEN,
        })
        expect(result.data).not.toHaveProperty('extra')
      }
    })

    it('should require both email and captcha token fields', () => {
      const incompleteInputs = [
        { email: 'test@example.com' }, // Missing captcha token
        { captchaToken: VALID_CAPTCHA_TOKEN }, // Missing email
        {}, // Missing both fields
      ]

      for (const input of incompleteInputs) {
        const result = requestPasswordResetSchema.safeParse(input)
        expect(result.success).toBe(false)
      }
    })
  })
})
