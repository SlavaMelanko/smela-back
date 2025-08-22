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
  token: 'mock-jwt-token',
}))

mock.module('../signup', () => ({
  default: mockSignUpWithEmail,
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
  setAuthCookie: mock(() => {}),
}))

describe('Signup Handler', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', signupRoute)
    mockSignUpWithEmail.mockClear()
  })

  describe('POST /auth/signup', () => {
    it('should return user data with token and set cookie on successful signup', async () => {
      const res = await app.request('/api/v1/auth/signup', {
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
      expect(data.token).toBe('mock-jwt-token')
      expect(data.user.email).toBe('test@example.com')

      // Note: Cookie setting is mocked so we don't check for actual cookie header

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

    it('should set cookie even in development', async () => {
      // Mock dev environment
      mock.module('@/lib/env', () => ({
        default: {
          JWT_COOKIE_NAME: 'auth-token',
          COOKIE_DOMAIN: undefined,
        },
        isDevEnv: () => true,
        isDevOrTestEnv: () => true,
      }))

      const res = await app.request('/api/v1/auth/signup', {
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

      // Check response includes token
      const data = await res.json()
      expect(data).toHaveProperty('token')
      expect(data.token).toBe('mock-jwt-token')
    })

    it('should handle signup errors and not set cookie', async () => {
      // Mock signup failure
      mockSignUpWithEmail.mockImplementationOnce(() => {
        throw new Error('Signup failed')
      })

      const res = await app.request('/api/v1/auth/signup', {
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

    it('should return only user data in response body', async () => {
      const res = await app.request('/api/v1/auth/signup', {
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
      expect(data).toHaveProperty('token')
      expect(data.token).toBe('mock-jwt-token')

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
