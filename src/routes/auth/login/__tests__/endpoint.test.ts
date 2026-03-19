import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, ModuleMocker, post, testUuids } from '@/__tests__'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/captcha/__tests__'
import { HttpStatus } from '@/net/http'

import { loginRoute } from '../index'

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
          id: testUuids.USER_1,
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
      logInWithEmail: mockLogInWithEmail,
    }))

    mockSetCookie = mock(() => {})
    mockSetRefreshCookie = mock((c: any, token: string) => {
      mockSetCookie(c, 'refresh-token-test', token, {
        httpOnly: true,
        secure: false,
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
        email: 'test@example.com',
        password: 'ValidPass123!',
        captcha: { token: VALID_CAPTCHA_TOKEN },
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: testUuids.USER_1,
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

      expect(mockSetCookie).toHaveBeenCalledTimes(1)
      expect(mockSetCookie).toHaveBeenCalledWith(
        expect.any(Object),
        'refresh-token-test',
        'refresh-token-123',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict', path: '/' }),
      )
      expect(mockLogInWithEmail).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'ValidPass123!' },
        { ipAddress: null, userAgent: null },
      )
    })

    it('should handle login errors without setting cookie', async () => {
      mockLogInWithEmail.mockImplementationOnce(() => {
        throw new Error('Login failed')
      })

      const res = await post(app, LOGIN_URL, {
        email: 'test@example.com',
        password: 'WrongPass123!',
        captcha: { token: VALID_CAPTCHA_TOKEN },
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockSetCookie).not.toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      const invalidRequests = [
        { name: 'empty email', body: { email: '', password: 'ValidPass123!', captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'invalid email format', body: { email: 'invalid', password: 'ValidPass123!', captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'empty password', body: { email: 'test@example.com', password: '', captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'password without special chars', body: { email: 'test@example.com', password: 'NoSpecial123', captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'missing password', body: { email: 'test@example.com', captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'missing email', body: { password: 'ValidPass123!', captcha: { token: VALID_CAPTCHA_TOKEN } } },
      ]

      for (const testCase of invalidRequests) {
        const res = await post(app, LOGIN_URL, testCase.body)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(await res.json()).toHaveProperty('error')
        expect(mockLogInWithEmail).not.toHaveBeenCalled()
        expect(mockSetCookie).not.toHaveBeenCalled()
      }
    })

    it('should handle malformed requests', async () => {
      const scenarios: Array<{ headers?: Record<string, string>, body?: any }> = [
        { headers: {}, body: { email: 'test@example.com', password: 'ValidPass123!', captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
        { headers: { 'Content-Type': 'application/json' }, body: undefined },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, LOGIN_URL, body, headers)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockLogInWithEmail).not.toHaveBeenCalled()
      }
    })
  })
})
