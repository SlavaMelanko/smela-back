import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'
import { Role } from '@/types'

import signupRoute from '../index'

// Mock the signup function
const mockSignUpWithEmail = mock(() => Promise.resolve({
  user: {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    role: Role.User,
    status: 'new',
    createdAt: new Date(),
  },
  token: 'test-jwt-token',
}))

mock.module('../signup', () => ({
  default: mockSignUpWithEmail,
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

describe('Signup Handler with Cookie', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    app.route('/auth', signupRoute)
    mockSignUpWithEmail.mockClear()
  })

  describe('POST /auth/signup - Cookie Setting', () => {
    it('should set cookie with JWT token on successful signup', async () => {
      const res = await app.request('/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          role: Role.User,
        }),
      })

      expect(res.status).toBe(StatusCodes.CREATED)

      // Check response body
      const data = await res.json()
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('token')
      expect(data.user.email).toBe('test@example.com')
      expect(data.token).toBe('test-jwt-token')

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

      // Verify signup function was called
      expect(mockSignUpWithEmail).toHaveBeenCalledTimes(1)
      expect(mockSignUpWithEmail).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        role: Role.User,
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

      const res = await app.request('/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          role: Role.User,
        }),
      })

      expect(res.status).toBe(StatusCodes.CREATED)

      // Check cookie
      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('auth-token=test-jwt-token')
      expect(cookies).toContain('HttpOnly')
      expect(cookies).not.toContain('Secure')
      expect(cookies).toContain('SameSite=Lax')
      expect(cookies).not.toContain('Domain=')
    })

    it('should handle signup errors and not set cookie', async () => {
      // Mock signup failure
      mockSignUpWithEmail.mockImplementationOnce(() => {
        throw new Error('Signup failed')
      })

      const res = await app.request('/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          role: Role.User,
        }),
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

      // Check no cookie is set
      const cookies = res.headers.get('set-cookie')
      expect(cookies).toBeNull()

      // Verify signup function was called
      expect(mockSignUpWithEmail).toHaveBeenCalledTimes(1)
    })

    it('should return user and token in response body', async () => {
      const res = await app.request('/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'AnotherPass123!',
          role: Role.Admin,
        }),
      })

      expect(res.status).toBe(StatusCodes.CREATED)

      const data = await res.json()
      expect(data.user).toBeDefined()
      expect(data.user.id).toBe(1)
      expect(data.user.firstName).toBe('John') // From mock
      expect(data.user.email).toBe('test@example.com') // From mock
      expect(data.token).toBe('test-jwt-token')

      // Verify the function was called with correct params
      expect(mockSignUpWithEmail).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'AnotherPass123!',
        role: Role.Admin,
      })
    })
  })
})
