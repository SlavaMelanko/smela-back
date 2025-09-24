import { mock } from 'bun:test'

export const VALID_CAPTCHA_TOKEN = 'test-captcha-token-1234567890'

export const INVALID_CAPTCHA_TOKENS = {
  tooShort: 'short',
  tooLong: 'a'.repeat(2001),
  invalidChars: 'invalid@captcha#token!',
  empty: '',
}

mock.module('@/services', () => ({
  createCaptcha: mock(() => ({
    validate: mock(() => Promise.resolve()),
  })),
}))

export const mockCaptchaSuccess = () => {
  mock.module('@/services', () => ({
    createCaptcha: mock(() => ({
      validate: mock(() => Promise.resolve()),
    })),
  }))
}

export const mockCaptchaFailure = (errorMessage = 'Invalid CAPTCHA token') => {
  mock.module('@/services', () => ({
    createCaptcha: mock(() => ({
      validate: mock(() => Promise.reject(new Error(errorMessage))),
    })),
  }))
}
