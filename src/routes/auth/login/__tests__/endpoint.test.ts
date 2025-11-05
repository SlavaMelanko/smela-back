import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, doRequest, ModuleMocker, post } from '@/__tests__'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/captcha/__tests__'
import { HttpStatus } from '@/net/http'

import loginRoute from '../index'

describe('Login Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const LOGIN_URL = '/api/v1/auth/login'

  let app: Hono
  let mockLogInWithEmail: any
  let mockSetRefreshCookie: any

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
      refreshToken: 'login-refresh-token',
    }))

    await moduleMocker.mock('@/use-cases/auth/login', () => ({
      default: mockLogInWithEmail,
    }))

    mockSetRefreshCookie = mock(() => {})

    await moduleMocker.mock('@/net/http/cookie', () => ({
      deleteRefreshCookie: mock(() => {}),
      getRefreshCookie: mock(() => undefined),
      setRefreshCookie: mockSetRefreshCookie,
    }))

    await mockCaptchaSuccess()

    app = createTestApp('/api/v1/auth', loginRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('POST /auth/login', () => {
    it('should return user and token in response body on successful login', async () => {
      const res = await post(app, LOGIN_URL, {
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(HttpStatus.OK)

      // Check response body - token returned for client to store in memory
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

      // Verify login function was called
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
      expect(mockLogInWithEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!',
      })

      // Verify refresh token cookie was set
      expect(mockSetRefreshCookie).toHaveBeenCalledTimes(1)
      expect(mockSetRefreshCookie).toHaveBeenCalledWith(expect.any(Object), 'login-refresh-token')
    })

    it('should handle login errors', async () => {
      mockLogInWithEmail.mockImplementationOnce(() => {
        throw new Error('Login failed')
      })

      const res = await post(app, '/api/v1/auth/login', {
        email: 'test@example.com',
        password: 'WrongPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

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

      // Verify login function was called but failed
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
      expect(mockLogInWithEmail).toHaveBeenCalledWith({
        email: 'inactive@example.com',
        password: 'ValidPass123!',
      })
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
