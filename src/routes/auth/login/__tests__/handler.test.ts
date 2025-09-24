import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'
import { VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import loginRoute from '../index'

describe('Login Handler with Cookie', () => {
  let app: Hono
  let mockLogInWithEmail: any
  let mockSetAccessCookie: any

  beforeEach(() => {
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
      token: 'test-jwt-token',
    }))

    mockSetAccessCookie = mock(() => {})

    mock.module('../login', () => ({
      default: mockLogInWithEmail,
    }))

    mock.module('@/lib/cookie', () => ({
      setAccessCookie: mockSetAccessCookie,
    }))

    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', loginRoute)
  })

  afterAll(() => {
    mock.restore()
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

      // Verify cookie was set
      expect(mockSetAccessCookie).toHaveBeenCalledTimes(1)
      expect(mockSetAccessCookie).toHaveBeenCalledWith(expect.any(Object), 'test-jwt-token')

      // Verify login function was called
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
      expect(mockLogInWithEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!',
      })
    })

    it('should return user and token on successful login', async () => {
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

      const data = await res.json()
      expect(data.token).toBe('test-jwt-token')
      expect(data.user).toHaveProperty('email', 'test@example.com')
    })

    it('should set cookie in development environment', async () => {
      // Mock only the environment helper functions
      mock.module('@/lib/env', () => ({
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

      const data = await res.json()
      expect(data.token).toBe('test-jwt-token')
      expect(data.user).toHaveProperty('email', 'test@example.com')

      // Verify cookie was set in development environment
      expect(mockSetAccessCookie).toHaveBeenCalledTimes(1)
      expect(mockSetAccessCookie).toHaveBeenCalledWith(expect.any(Object), 'test-jwt-token')
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

      // Verify cookie was NOT set due to error
      expect(mockSetAccessCookie).not.toHaveBeenCalled()

      // Verify login function was called
      expect(mockLogInWithEmail).toHaveBeenCalledTimes(1)
    })
  })
})
