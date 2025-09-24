import { describe, expect, it } from 'bun:test'

import { VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import requestPasswordResetSchema from '../schema'

describe('Request Password Reset Schema', () => {
  it('should accept valid email addresses with captcha tokens', () => {
    const validRequests = [
      {
        email: 'user@example.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
      },
      {
        email: 'john.doe+test@company.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
      },
      {
        email: 'user123@test-domain.co.uk',
        captchaToken: VALID_CAPTCHA_TOKEN,
      },
    ]

    for (const request of validRequests) {
      const result = requestPasswordResetSchema.safeParse(request)
      expect(result.success).toBe(true)
    }
  })

  it('should reject extra fields in strict mode', () => {
    const { success, error } = requestPasswordResetSchema.safeParse({
      email: 'test@example.com',
      captchaToken: VALID_CAPTCHA_TOKEN,
      extra: 'field',
      remember: true,
    })

    expect(success).toBe(false)
    expect(error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unrecognized_keys',
          keys: expect.arrayContaining(['extra', 'remember']),
        }),
      ]),
    )
  })
})
