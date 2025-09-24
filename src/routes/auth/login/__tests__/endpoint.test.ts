import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import loginRoute from '../index'

describe('Login Endpoint', () => {
  let app: Hono
  let mockLogInWithEmail: any
  let mockSetCookie: any

  const createApp = () => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', loginRoute)
  }

  const postRequest = (body: any, headers: Record<string, string> = { 'Content-Type': 'application/json' }, method = 'POST') =>
    app.request('/api/v1/auth/login', {
      method,
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  beforeEach(() => {
    mockCaptchaSuccess()

    mockLogInWithEmail = mock(() => Promise.resolve({
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

    mockSetCookie = mock(() => {})

    mock.module('../login', () => ({
      default: mockLogInWithEmail,
    }))

    mock.module('hono/cookie', () => ({
      setCookie: mockSetCookie,
      getCookie: mock(() => undefined),
      deleteCookie: mock(() => {}),
    }))

    mock.module('@/lib/cookie/access-cookie', () => ({
      setAccessCookie: mock((c: any, token: string) => {
        mockSetCookie(c, 'auth-token-test', token, {
          httpOnly: true,
          secure: false, // false in test environment
          sameSite: 'lax',
          maxAge: 3600,
          path: '/',
        })
      }),
      getAccessCookie: mock(() => undefined),
      deleteAccessCookie: mock(() => {}),
    }))

    createApp()
  })

  describe('POST /auth/login', () => {
    it('should set cookie and return user/token on successful login', async () => {
      const res = await postRequest({
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
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

      const res = await postRequest({
        email: 'test@example.com',
        password: 'WrongPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

      // Verify cookie was NOT set due to error
      expect(mockSetCookie).not.toHaveBeenCalled()

      // Verify login function was called
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
    })

    it('should validate request format and required fields', async () => {
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
        const res = await postRequest(testCase.body)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
        expect(mockLogInWithEmail).not.toHaveBeenCalled()
        expect(mockSetCookie).not.toHaveBeenCalled()
      }
    })

    it('should handle malformed requests', async () => {
      const malformedRequests: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: { email: 'test@example.com', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: undefined },
      ]

      for (const testCase of malformedRequests) {
        const res = await postRequest(testCase.body, testCase.headers)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        expect(mockLogInWithEmail).not.toHaveBeenCalled()
        expect(mockSetCookie).not.toHaveBeenCalled()
      }
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await postRequest({
          email: 'test@example.com',
          password: 'validPassword123',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }, { 'Content-Type': 'application/json' }, method)

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })

    it('should handle inactive/blocked users gracefully', async () => {
      mockLogInWithEmail.mockImplementationOnce(() => {
        throw new Error('User account is inactive')
      })

      const res = await postRequest({
        email: 'inactive@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

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
      // Override the access cookie mock to simulate production environment
      mock.module('@/lib/cookie/access-cookie', () => ({
        setAccessCookie: mock((c: any, token: string) => {
          mockSetCookie(c, 'auth-token-test', token, {
            httpOnly: true,
            secure: true, // true in production environment
            sameSite: 'lax',
            maxAge: 3600,
            path: '/',
          })
        }),
        getAccessCookie: mock(() => undefined),
        deleteAccessCookie: mock(() => {}),
      }))

      createApp()

      const res = await postRequest({
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(StatusCodes.OK)

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
  })
})
