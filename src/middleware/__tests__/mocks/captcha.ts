import { beforeEach, mock } from 'bun:test'

/**
 * Valid CAPTCHA token for testing (meets validation requirements).
 * Must be at least 20 characters and match /^[\w-]+$/ pattern.
 */
export const VALID_CAPTCHA_TOKEN = 'test-captcha-token-1234567890'

/**
 * Invalid CAPTCHA tokens for testing validation.
 */
export const INVALID_CAPTCHA_TOKENS = {
  tooShort: 'short', // Less than 20 characters
  tooLong: 'a'.repeat(2001), // More than 2000 characters
  invalidChars: 'invalid@captcha#token!', // Contains invalid characters
  empty: '', // Empty string
}

// Global mock to prevent any actual CAPTCHA service calls during tests
mock.module('@/services', () => ({
  createCaptcha: mock(() => ({
    validate: mock(() => Promise.resolve()), // Always resolves successfully
  })),
}))

/**
 * Mock the CAPTCHA service to always pass validation.
 * This is now globally applied, but can still be called for explicit mocking.
 */
export const mockCaptchaService = () => {
  beforeEach(() => {
    mock.module('@/services', () => ({
      createCaptcha: mock(() => ({
        validate: mock(() => Promise.resolve()), // Always resolves successfully
      })),
    }))
  })
}

/**
 * Mock the CAPTCHA service to always fail validation.
 * Useful for testing CAPTCHA error handling.
 */
export const mockCaptchaServiceFailure = (errorMessage = 'Invalid CAPTCHA token') => {
  beforeEach(() => {
    mock.module('@/services', () => ({
      createCaptcha: mock(() => ({
        validate: mock(() => Promise.reject(new Error(errorMessage))),
      })),
    }))
  })
}
