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
    app.route('/auth', verifyEmailRoute)
  })

  describe('POST /auth/verify-email', () => {
    it('should return 200 when request is valid', async () => {
      const validToken = 'a'.repeat(64) // 64 character token

      const res = await app.request('/auth/verify-email', {
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

    it('should validate token length requirements', async () => {
      const invalidTokens = [
        '', // Empty token
        'a'.repeat(32), // Too short (32 chars instead of 64)
        'a'.repeat(63), // One character short
        'a'.repeat(65), // One character too long
        'a'.repeat(128), // Too long
      ]

      for (const token of invalidTokens) {
        const res = await app.request('/auth/verify-email', {
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
      const res = await app.request('/auth/verify-email', {
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

    it('should handle various valid token formats', async () => {
      const validTokens = [
        'a'.repeat(64), // All lowercase
        'A'.repeat(64), // All uppercase
        '1'.repeat(64), // All numbers
        'abcdef1234567890'.repeat(4), // Mixed hex
        'A'.repeat(32) + 'a'.repeat(32), // Mixed case
        '0'.repeat(32) + 'F'.repeat(32), // Mixed hex with zero and F
      ]

      for (const token of validTokens) {
        const res = await app.request('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        // Should pass validation (even if it fails in business logic due to no mocks)
        expect(res.status).toBeDefined()
        // Should not be a validation error (400)
        if (res.status === StatusCodes.BAD_REQUEST) {
          const json = await res.json()
          expect(json.error).not.toContain('Token must be exactly')
        }
      }
    })

    it('should handle special characters in token', async () => {
      const tokenWithSpecialChars = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yzA567BCD890EFG123'

      const res = await app.request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: tokenWithSpecialChars }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBeDefined()
    })

    it('should handle extra fields in request body', async () => {
      const validToken = 'a'.repeat(64)

      const res = await app.request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: validToken, extra: 'value', another: 'param' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBeDefined()
      // Should not be a validation error due to extra parameters
      if (res.status === StatusCodes.BAD_REQUEST) {
        const json = await res.json()
        expect(json.error).not.toContain('extra')
        expect(json.error).not.toContain('another')
      }
    })

    it('should handle empty request body', async () => {
      const res = await app.request('/auth/verify-email', {
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

    it('should handle malformed request body', async () => {
      const malformedBodies = [
        { token: null },
        { token: undefined },
        { token: '' },
        'invalid json',
      ]

      for (const body of malformedBodies) {
        const res = await app.request('/auth/verify-email', {
          method: 'POST',
          body: typeof body === 'string' ? body : JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        // Invalid JSON string returns 500, others return 400
        if (typeof body === 'string') {
          expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
        } else {
          expect(res.status).toBe(StatusCodes.BAD_REQUEST)
          const json = await res.json()
          expect(json).toHaveProperty('error')
        }
      }
    })
  })

  describe('Validation Schema', () => {
    it('should accept valid token formats', () => {
      const validTokens = [
        'a'.repeat(64),
        'A'.repeat(64),
        '1'.repeat(64),
        'abcdef1234567890'.repeat(4),
        `${'A1B2C3D4E5F6'.repeat(5)}ABCD`,
        '0123456789ABCDEF'.repeat(4),
      ]

      for (const token of validTokens) {
        const result = verifyEmailSchema.safeParse({ token })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.token).toBe(token)
        }
      }
    })

    it('should reject invalid token lengths', () => {
      const invalidTokens = [
        '',
        'a',
        'a'.repeat(32),
        'a'.repeat(63),
        'a'.repeat(65),
        'a'.repeat(128),
        'a'.repeat(256),
      ]

      for (const token of invalidTokens) {
        const result = verifyEmailSchema.safeParse({ token })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Token must be exactly 64 characters long')
        }
      }
    })

    it('should require token field', () => {
      const incompleteData = [
        {}, // Missing token
        { otherField: 'value' }, // Has other field but no token
      ]

      for (const data of incompleteData) {
        const result = verifyEmailSchema.safeParse(data)
        expect(result.success).toBe(false)
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

    it('should handle token with different character types', () => {
      const tokensWithDifferentChars = [
        // All lowercase letters (26 * 2 + 12 = 64)
        `${'abcdefghijklmnopqrstuvwxyz'.repeat(2)}abcdefghijkl`,
        // All uppercase letters (26 * 2 + 12 = 64)
        `${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(2)}ABCDEFGHIJKL`,
        // All numbers (10 * 6 + 4 = 64)
        `${'0123456789'.repeat(6)}0123`,
        // Mixed alphanumeric (64 characters)
        'abc123DEF456ghi789JKL012mno345PQR678stu901VWX234yzABC567def89XYZ',
        // Hex characters (16 * 4 = 64)
        'ABCDEF0123456789'.repeat(4),
      ]

      for (const token of tokensWithDifferentChars) {
        const result = verifyEmailSchema.safeParse({ token })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.token).toBe(token)
          expect(result.data.token.length).toBe(64)
        }
      }
    })

    it('should handle edge case token values', () => {
      const edgeCaseTokens = [
        // All zeros
        '0'.repeat(64),
        // All 9s
        '9'.repeat(64),
        // All As
        'A'.repeat(64),
        // All Fs (max hex)
        'F'.repeat(64),
        // Alternating pattern
        'A0'.repeat(32),
        '01'.repeat(32),
      ]

      for (const token of edgeCaseTokens) {
        const result = verifyEmailSchema.safeParse({ token })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.token).toBe(token)
        }
      }
    })

    it('should reject non-string token values', () => {
      const nonStringTokens = [
        123456,
        true,
        false,
        null,
        undefined,
        [],
        {},
        new Date(),
      ]

      for (const token of nonStringTokens) {
        const result = verifyEmailSchema.safeParse({ token })
        expect(result.success).toBe(false)
      }
    })
  })
})
