import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, ModuleMocker, post } from '@/__tests__'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/captcha/__tests__'
import { HttpStatus } from '@/net/http'

import loginRoute from '../index'

describe('Login Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const LOGIN_URL = '/api/v1/auth/login'

  let app: Hono
  let mockLogInWithEmail: any
  let mockSetRefreshCookie: any
  let mockSetCookie: any

  beforeEach(async () => {
    mockLogInWithEmail = mock(async () => ({
      data: {
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
        accessToken: 'login-jwt-token',
      },
      refreshToken: 'refresh-token-123',
    }))

    await moduleMocker.mock('@/use-cases/auth/login', () => ({
      default: mockLogInWithEmail,
    }))

    mockSetCookie = mock(() => {})

    mockSetRefreshCookie = mock((c: any, token: string) => {
      mockSetCookie(c, 'refresh-token-test', token, {
        httpOnly: true,
        secure: false, // false in test environment
        sameSite: 'strict',
        maxAge: 3600,
        path: '/',
      })
    })

    await moduleMocker.mock('@/net/http', () => ({
      HttpStatus: { OK: 200, INTERNAL_SERVER_ERROR: 500, BAD_REQUEST: 400, NOT_FOUND: 404 },
      setRefreshCookie: mockSetRefreshCookie,
      getDeviceInfo: mock(() => ({ ipAddress: null, userAgent: null })),
    }))

    await mockCaptchaSuccess()

    app = createTestApp('/api/v1/auth', loginRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('POST /auth/login', () => {
    it('should set cookie and return user/token on successful login', async () => {
      const res = await post(app, LOGIN_URL, {
        data: {
          email: 'test@example.com',
          password: 'ValidPass123!',
        },
        captcha: { token: VALID_CAPTCHA_TOKEN },
      })

      expect(res.status).toBe(HttpStatus.OK)

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
        accessToken: 'login-jwt-token',
      })

      // Verify cookie was set with correct options
      expect(mockSetCookie).toHaveBeenCalledTimes(1)
      expect(mockSetCookie).toHaveBeenCalledWith(
        expect.any(Object), // context
        'refresh-token-test', // cookie name
        'refresh-token-123', // token value
        expect.objectContaining({
          httpOnly: true,
          secure: false, // false in test environment
          sameSite: 'strict',
          maxAge: expect.any(Number),
          path: '/',
        }),
      )

      // Verify login function was called
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
      expect(mockLogInWithEmail).toHaveBeenCalledWith({
        deviceInfo: {
          ipAddress: null,
          userAgent: null,
        },
        email: 'test@example.com',
        password: 'ValidPass123!',
      })
    })

    it('should handle login errors without setting cookie', async () => {
      mockLogInWithEmail.mockImplementationOnce(() => {
        throw new Error('Login failed')
      })

      const res = await post(app, '/api/v1/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'WrongPass123!',
        },
        captcha: { token: VALID_CAPTCHA_TOKEN },
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      // Verify cookie was NOT set due to error
      expect(mockSetCookie).not.toHaveBeenCalled()

      // Verify login function was called
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
    })

    it('should validate required fields', async () => {
      const invalidRequests = [
        // Email validation
        { name: 'empty email', body: { data: { email: '', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'invalid email format', body: { data: { email: 'invalid', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'incomplete email', body: { data: { email: 'test@', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'email missing local part', body: { data: { email: '@example.com', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },

        // Password validation
        { name: 'empty password', body: { data: { email: 'test@example.com', password: '' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'short password', body: { data: { email: 'test@example.com', password: '123' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'password without numbers', body: { data: { email: 'test@example.com', password: 'NoNumbers!' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'password without special chars', body: { data: { email: 'test@example.com', password: 'NoSpecial123' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },

        // Missing fields
        { name: 'missing password', body: { data: { email: 'test@example.com' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'missing email', body: { data: { password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'missing both email and password', body: { data: {}, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'missing data object', body: { captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'missing all fields', body: {} },
      ]

      for (const testCase of invalidRequests) {
        const res = await post(app, LOGIN_URL, testCase.body)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
        expect(mockLogInWithEmail).not.toHaveBeenCalled()
        expect(mockSetCookie).not.toHaveBeenCalled()
      }
    })

    it('should handle malformed requests', async () => {
      const scenarios: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: { data: { email: 'test@example.com', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: undefined },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, LOGIN_URL, body, headers)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockLogInWithEmail).not.toHaveBeenCalled()
        expect(mockSetCookie).not.toHaveBeenCalled()
      }
    })

    it('should handle inactive/blocked users gracefully', async () => {
      mockLogInWithEmail.mockImplementationOnce(() => {
        throw new Error('User account is inactive')
      })

      const res = await post(app, '/api/v1/auth/login', {
        data: {
          email: 'inactive@example.com',
          password: 'ValidPass123!',
        },
        captcha: { token: VALID_CAPTCHA_TOKEN },
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      // Verify cookie was NOT set for inactive users
      expect(mockSetCookie).not.toHaveBeenCalled()

      // Verify login function was called but failed
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
      expect(mockLogInWithEmail).toHaveBeenCalledWith({
        deviceInfo: {
          ipAddress: null,
          userAgent: null,
        },
        email: 'inactive@example.com',
        password: 'ValidPass123!',
      })
    })

    it('should set secure cookie in production environment', async () => {
      mockSetRefreshCookie.mockImplementation((c: any, token: string) => {
        mockSetCookie(c, 'refresh-token-test', token, {
          httpOnly: true,
          secure: true, // true in production environment
          sameSite: 'strict',
          maxAge: 3600,
          path: '/',
        })
      })

      const res = await post(app, LOGIN_URL, {
        data: {
          email: 'test@example.com',
          password: 'ValidPass123!',
        },
        captcha: { token: VALID_CAPTCHA_TOKEN },
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data).toHaveProperty('accessToken', 'login-jwt-token')
      expect(data.user).toHaveProperty('email', 'test@example.com')

      // Verify cookie was set with secure flag in production environment
      expect(mockSetCookie).toHaveBeenCalledTimes(1)
      expect(mockSetCookie).toHaveBeenCalledWith(
        expect.any(Object), // context
        'refresh-token-test', // cookie name
        'refresh-token-123', // token value
        expect.objectContaining({
          httpOnly: true,
          secure: true, // true in production for HTTPS-only
          sameSite: 'strict',
          maxAge: expect.any(Number),
          path: '/',
        }),
      )
    })
  })
})
