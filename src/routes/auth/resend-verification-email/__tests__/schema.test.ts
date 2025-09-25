import { describe, expect, it } from 'bun:test'

import { VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import resendVerificationEmailSchema from '../schema'

describe('Schema Validation', () => {
  it('should validate email addresses correctly', () => {
    const validEmails = ['user@example.com', 'test+tag@email.com']
    const invalidEmails = ['', 'invalid', 'test@', '@example.com']

    for (const email of validEmails) {
      const result = resendVerificationEmailSchema.safeParse({ email, captchaToken: VALID_CAPTCHA_TOKEN })
      expect(result.success).toBe(true)
    }

    for (const email of invalidEmails) {
      const result = resendVerificationEmailSchema.safeParse({ email, captchaToken: VALID_CAPTCHA_TOKEN })
      expect(result.success).toBe(false)
    }
  })

  it('should not accept extra fields', () => {
    const result = resendVerificationEmailSchema.safeParse({
      email: 'test@example.com',
      captchaToken: VALID_CAPTCHA_TOKEN,
      extra: 'field',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ email: 'test@example.com', captchaToken: VALID_CAPTCHA_TOKEN })
      expect(result.data).not.toHaveProperty('extra')
    }
  })
})
