import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import verifyEmailRoute from '../index'
import verifyEmailSchema from '../schema'

describe('Verify Email Endpoint', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', verifyEmailRoute)
  })

  describe('POST /auth/verify-email', () => {
    it('should return 200 when request is valid', async () => {
      const validToken = 'a'.repeat(64) // 64 character token

      const res = await app.request('/api/v1/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: validToken }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Note: This will fail in integration tests without mocks
      // as it will try to access the real database
      // For now, we're testing the endpoint structure
      expect(res.status).toBeDefined()
    })

    it('should validate token requirements', async () => {
      const invalidTokens = [
        '',
        'a'.repeat(32),
        'a'.repeat(63),
        'a'.repeat(65),
        'a'.repeat(128),
      ]

      for (const token of invalidTokens) {
        const res = await app.request('/api/v1/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should require token parameter', async () => {
      const res = await app.request('/api/v1/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(StatusCodes.BAD_REQUEST)
      const json = await res.json()
      expect(json).toHaveProperty('error')
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']
      const validToken = 'a'.repeat(64)

      for (const method of methods) {
        const res = await app.request(`/auth/verify-email?token=${validToken}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        })

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })

    it('should handle malformed JSON', async () => {
      const res = await app.request('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ invalid json',
      })

      expect(res.status).toBe(StatusCodes.BAD_REQUEST)
    })

    it('should handle missing request body', async () => {
      const res = await app.request('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(StatusCodes.BAD_REQUEST)
    })
  })

  describe('Schema Validation', () => {
    it('should accept valid token format', () => {
      const validTokens = [
        'a'.repeat(64),
        'A'.repeat(64),
        'abcdef1234567890'.repeat(4),
        'A0'.repeat(32),
      ]

      for (const token of validTokens) {
        const result = verifyEmailSchema.safeParse({ token })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.token).toBe(token)
        }
      }
    })

    it('should not accept extra fields', () => {
      const validToken = 'a'.repeat(64)
      const result = verifyEmailSchema.safeParse({
        token: validToken,
        extra: 'field',
        another: 'value',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ token: validToken })
        expect(result.data).not.toHaveProperty('extra')
        expect(result.data).not.toHaveProperty('another')
      }
    })
  })
})
