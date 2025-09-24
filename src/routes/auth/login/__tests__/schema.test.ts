import { describe, expect, it } from 'bun:test'

import { VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import loginSchema from '../schema'

describe('Login Schema', () => {
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

  it('should reject extra fields in strict mode', () => {
    const { success, error } = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'ValidPass123!',
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
