import { describe, expect, it } from 'bun:test'

import { VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'
import { Role } from '@/types'

import signupSchema from '../schema'

describe('Schema Validation', () => {
  it('should accept valid signup data with special characters', () => {
    const validCredentials = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'ValidPass123!',
        role: Role.User,
        captchaToken: VALID_CAPTCHA_TOKEN,
      },
      {
        firstName: 'Marie-Claire',
        lastName: 'O\'Connor',
        email: 'marie.claire+test@company.com',
        password: 'Complex@Pass456#',
        role: Role.Admin,
        captchaToken: VALID_CAPTCHA_TOKEN,
      },
    ]

    for (const credentials of validCredentials) {
      const result = signupSchema.safeParse(credentials)
      expect(result.success).toBe(true)
    }
  })

  it('should not accept extra fields', () => {
    const result = signupSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      password: 'ValidPass123!',
      role: Role.User,
      captchaToken: VALID_CAPTCHA_TOKEN,
      extra: 'field',
      confirmPassword: 'ValidPass123!',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        role: Role.User,
        captchaToken: VALID_CAPTCHA_TOKEN,
      })
      expect(result.data).not.toHaveProperty('extra')
      expect(result.data).not.toHaveProperty('confirmPassword')
    }
  })
})
