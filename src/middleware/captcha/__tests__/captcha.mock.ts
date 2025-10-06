import { mock } from 'bun:test'

export const VALID_CAPTCHA_TOKEN = 'test-captcha-token-1234567890'

export const INVALID_CAPTCHA_TOKENS = {
  tooShort: 'short',
  tooLong: 'a'.repeat(2001),
  invalidChars: 'invalid@captcha#token!',
  empty: '',
}

/**
 * Mocks captcha service to always succeed.
 *
 * Note: Captcha validation failure scenarios should be tested in dedicated captcha middleware tests.
 * Endpoint tests focus on successful captcha validation and business logic errors.
 */
export const mockCaptchaSuccess = () => {
  mock.module('@/services', () => ({
    createCaptcha: mock(() => ({
      validate: mock(() => Promise.resolve()),
    })),
  }))
}
