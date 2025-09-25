import { describe, expect, it } from 'bun:test'

import { TOKEN_LENGTH } from '@/lib/token/constants'

import resetPasswordSchema from '../schema'

describe('Schema Validation', () => {
  it('should validate token and password combinations correctly', () => {
    const validInputs = [
      { token: '1'.repeat(TOKEN_LENGTH), password: 'ValidPass123!' },
      { token: 'a'.repeat(TOKEN_LENGTH), password: 'SecurePass789#' },
    ]

    const invalidInputs = [
      { token: 'short', password: 'ValidPass123!' }, // invalid token
      { token: '1'.repeat(TOKEN_LENGTH), password: 'short' }, // invalid password
      { token: '1'.repeat(TOKEN_LENGTH) }, // missing password
      { password: 'ValidPass123!' }, // missing token
    ]

    for (const input of validInputs) {
      const result = resetPasswordSchema.safeParse(input)
      expect(result.success).toBe(true)
    }

    for (const input of invalidInputs) {
      const result = resetPasswordSchema.safeParse(input)
      expect(result.success).toBe(false)
    }
  })

  it('should not accept extra fields', () => {
    const result = resetPasswordSchema.safeParse({
      token: '1'.repeat(TOKEN_LENGTH),
      password: 'ValidPass123!',
      extra: 'field',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        token: '1'.repeat(TOKEN_LENGTH),
        password: 'ValidPass123!',
      })
      expect(result.data).not.toHaveProperty('extra')
    }
  })
})
