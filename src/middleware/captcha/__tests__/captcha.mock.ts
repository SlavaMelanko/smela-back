import { mock } from 'bun:test'

export const VALID_CAPTCHA_TOKEN = 'test-captcha-token-1234567890'

export const invalidCaptchaTokens = {
  tooShort: 'short',
  tooLong: 'a'.repeat(2001),
  invalidChars: 'invalid@captcha#token!',
  empty: '',
}

/**
 * Mocks captcha service to always succeed.
 *
 * Note: Captcha validation failure cases should be tested in dedicated captcha middleware tests.
 * Endpoint tests focus on successful captcha validation and business logic errors.
 */
export const mockCaptchaSuccess = async () => {
  await mock.module('@/services', () => ({
    createCaptchaVerifier: mock(() => ({
      validate: mock(async () => {}),
    })),
  }))
}
