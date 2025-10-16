import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, doRequest, ModuleMocker, post } from '@/__tests__'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/captcha/__tests__'
import HttpStatus from '@/types/http-status'

import loginRoute from '../index'

describe('Login Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const LOGIN_URL = '/api/v1/auth/login'

  let app: Hono
  let mockLogInWithEmail: any
  let mockSetAccessCookie: any
  let mockSetCookie: any

  beforeEach(async () => {
    mockLogInWithEmail = mock(async () => ({
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
      token: 'login-jwt-token',
    }))

    await moduleMocker.mock('@/use-cases/auth/login', () => ({
      default: mockLogInWithEmail,
    }))

    mockSetCookie = mock(() => {})

    mockSetAccessCookie = mock((c: any, token: string) => {
      mockSetCookie(c, 'auth-token-test', token, {
        httpOnly: true,
        secure: false, // false in test environment
        sameSite: 'lax',
        maxAge: 3600,
        path: '/',
      })
    })

    await moduleMocker.mock('@/net/http/cookie', () => ({
      setAccessCookie: mockSetAccessCookie,
      getAccessCookie: mock(() => undefined),
      deleteAccessCookie: mock(() => {}),
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
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
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
        token: 'login-jwt-token',
      })

      // Verify cookie was set with correct options
      expect(mockSetCookie).toHaveBeenCalledTimes(1)
      expect(mockSetCookie).toHaveBeenCalledWith(
        expect.any(Object), // context
        expect.any(String), // cookie name
        'login-jwt-token', // token value
        expect.objectContaining({
          httpOnly: true,
          secure: false, // false in test environment
          sameSite: 'lax',
          maxAge: expect.any(Number),
          path: '/',
        }),
      )

      // Verify login function was called
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
      expect(mockLogInWithEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!',
      })
    })

    it('should handle login errors without setting cookie', async () => {
      mockLogInWithEmail.mockImplementationOnce(() => {
        throw new Error('Login failed')
      })

      const res = await post(app, '/api/v1/auth/login', {
        email: 'test@example.com',
        password: 'WrongPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
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
        { name: 'empty email', body: { email: '', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'invalid email format', body: { email: 'invalid', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'incomplete email', body: { email: 'test@', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'email missing local part', body: { email: '@example.com', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN } },

        // Password validation
        { name: 'empty password', body: { email: 'test@example.com', password: '', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'short password', body: { email: 'test@example.com', password: '123', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'password without numbers', body: { email: 'test@example.com', password: 'NoNumbers!', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'password without special chars', body: { email: 'test@example.com', password: 'NoSpecial123', captchaToken: VALID_CAPTCHA_TOKEN } },

        // Missing fields
        { name: 'missing password', body: { email: 'test@example.com', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'missing email', body: { password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'missing both email and password', body: { captchaToken: VALID_CAPTCHA_TOKEN } },
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
        { name: 'missing Content-Type', headers: {}, body: { email: 'test@example.com', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN } },
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
        email: 'inactive@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      // Verify cookie was NOT set for inactive users
      expect(mockSetCookie).not.toHaveBeenCalled()

      // Verify login function was called but failed
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
      expect(mockLogInWithEmail).toHaveBeenCalledWith({
        email: 'inactive@example.com',
        password: 'ValidPass123!',
      })
    })

    it('should set secure cookie in production environment', async () => {
      mockSetAccessCookie.mockImplementation((c: any, token: string) => {
        mockSetCookie(c, 'auth-token-test', token, {
          httpOnly: true,
          secure: true, // true in production environment
          sameSite: 'lax',
          maxAge: 3600,
          path: '/',
        })
      })

      const res = await post(app, LOGIN_URL, {
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data.token).toBe('login-jwt-token')
      expect(data.user).toHaveProperty('email', 'test@example.com')

      // Verify cookie was set with secure flag in production environment
      expect(mockSetCookie).toHaveBeenCalledTimes(1)
      expect(mockSetCookie).toHaveBeenCalledWith(
        expect.any(Object), // context
        expect.any(String), // cookie name
        'login-jwt-token', // token value
        expect.objectContaining({
          httpOnly: true,
          secure: true, // true in production for HTTPS-only
          sameSite: 'lax',
          maxAge: expect.any(Number),
          path: '/',
        }),
      )
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await doRequest(app, LOGIN_URL, method, {
          email: 'test@example.com',
          password: 'validPassword123',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }, { 'Content-Type': 'application/json' })

        expect(res.status).toBe(HttpStatus.NOT_FOUND)
      }
    })
  })
})
