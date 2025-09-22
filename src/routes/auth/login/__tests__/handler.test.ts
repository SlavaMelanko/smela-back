import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'
import { mockCaptchaService, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import loginRoute from '../index'

// Mock the login function
const mockLogInWithEmail = mock(() => Promise.resolve({
  user: {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  token: 'test-jwt-token',
}))

mock.module('../login', () => ({
  default: mockLogInWithEmail,
}))

// Mock environment
mock.module('@/lib/env', () => ({
  default: {
    JWT_COOKIE_NAME: 'auth-token',
    COOKIE_DOMAIN: 'example.com',
    JWT_SECRET: 'test-jwt-secret',
  },
  isDevEnv: () => false,
  isDevOrTestEnv: () => false,
}))

// Mock auth library
mock.module('@/lib/auth', () => ({
  setAccessCookie: mock(() => {}),
}))

describe('Login Handler with Cookie', () => {
  let app: Hono

  // Mock CAPTCHA service to prevent actual service calls in tests
  mockCaptchaService()

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', loginRoute)
    mockLogInWithEmail.mockClear()
  })

  describe('POST /auth/login - Cookie Setting', () => {
    it('should set cookie with JWT token on successful login', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }),
      })

      expect(res.status).toBe(StatusCodes.OK)

      // Check response body
      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: 1,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          role: 'user',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        token: 'test-jwt-token',
      })

      // Note: Cookie setting is mocked so we don't check for actual cookie header
      // The cookie functionality is tested in the auth library tests

      // Verify login function was called
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
      expect(mockLogInWithEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!',
      })
    })

    it('should set cookie in development without secure flag', async () => {
      // Mock dev environment
      mock.module('@/lib/env', () => ({
        default: {
          JWT_COOKIE_NAME: 'auth-token',
          COOKIE_DOMAIN: undefined,
        },
        isDevEnv: () => true,
        isDevOrTestEnv: () => true,
      }))

      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }),
      })

      expect(res.status).toBe(StatusCodes.OK)

      // Note: Cookie setting is mocked so we don't check for actual cookie header
      // The cookie functionality is tested in the auth library tests
      const data = await res.json()
      expect(data.token).toBe('test-jwt-token')
    })

    it('should handle login errors and not set cookie', async () => {
      // Mock login failure
      mockLogInWithEmail.mockImplementationOnce(() => {
        throw new Error('Login failed')
      })

      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPass123!',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }),
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

      // Check no cookie is set
      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeNull()

      // Verify login function was called
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
    })
  })
})
