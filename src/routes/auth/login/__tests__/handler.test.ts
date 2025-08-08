import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

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
  },
  isDevEnv: () => false,
  isDevOrTestEnv: () => false,
}))

describe('Login Handler with Cookie', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    app.route('/auth', loginRoute)
    mockLogInWithEmail.mockClear()
  })

  describe('POST /auth/login - Cookie Setting', () => {
    it('should set cookie with JWT token on successful login', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPass123!',
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

      // Check cookie
      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('auth-token=test-jwt-token')
      expect(cookies).toContain('HttpOnly')
      expect(cookies).toContain('Secure')
      expect(cookies).toContain('SameSite=Lax')
      expect(cookies).toContain('Max-Age=3600')
      expect(cookies).toContain('Path=/')
      expect(cookies).toContain('Domain=example.com')

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

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPass123!',
        }),
      })

      expect(res.status).toBe(StatusCodes.OK)

      // Check cookie
      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('auth-token=test-jwt-token')
      expect(cookies).toContain('HttpOnly')
      expect(cookies).not.toContain('Secure')
      expect(cookies).toContain('SameSite=Lax')
      expect(cookies).not.toContain('Domain=')
    })

    it('should handle login errors and not set cookie', async () => {
      // Mock login failure
      mockLogInWithEmail.mockImplementationOnce(() => {
        throw new Error('Login failed')
      })

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPass123!',
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
