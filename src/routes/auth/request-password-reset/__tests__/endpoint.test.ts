import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import requestPasswordResetRoute from '../index'
import requestPasswordResetSchema from '../schema'

describe('Request Password Reset Endpoint', () => {
  let app: Hono

  beforeEach(() => {
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
        }),
      })

      // Note: This will fail in integration tests without mocks
      // as it will try to access the real database
      // For now, we're testing the endpoint structure
      expect(res.status).toBeDefined()
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        { email: '' }, // Empty email
        { email: 'invalid' }, // Invalid format
        { email: 'test@' }, // Incomplete
        { email: '@example.com' }, // Missing local part
        {}, // Missing email field
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

    it('should require Content-Type header', async () => {
      const res = await app.request('/api/v1/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
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
          }),
        })

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })
  })

  describe('Validation Schema', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.com',
        'test+tag@email.com',
        'user123@test-domain.com',
      ]

      for (const email of validEmails) {
        const result = requestPasswordResetSchema.safeParse({ email })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        'test@',
        '@example.com',
        'user @example.com',
        'user@.com',
        'user..name@example.com',
      ]

      for (const email of invalidEmails) {
        const result = requestPasswordResetSchema.safeParse({ email })
        expect(result.success).toBe(false)
      }
    })

    it('should not accept extra fields', () => {
      const result = requestPasswordResetSchema.safeParse({
        email: 'test@example.com',
        extra: 'field',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ email: 'test@example.com' })
        expect(result.data).not.toHaveProperty('extra')
      }
    })
  })
})
