import { describe, expect, it } from 'bun:test'

import verifyEmailSchema from '../schema'

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
