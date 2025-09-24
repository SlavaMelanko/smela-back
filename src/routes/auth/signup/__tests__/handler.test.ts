import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'
import { Role } from '@/types'

import signupRoute from '../index'

describe('Signup Handler with Cookie', () => {
  let app: Hono
  let mockSignUpWithEmail: any
  let mockSetAccessCookie: any

  beforeEach(() => {
    mockSignUpWithEmail = mock(() => Promise.resolve({
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        role: Role.User,
        status: 'new',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      token: 'signup-jwt-token',
    }))

    mockSetAccessCookie = mock(() => {})

    mock.module('../signup', () => ({
      default: mockSignUpWithEmail,
    }))

    mock.module('@/lib/cookie', () => ({
      setAccessCookie: mockSetAccessCookie,
    }))

    mockCaptchaSuccess()
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', signupRoute)
  })

  describe('POST /auth/signup - Cookie Setting', () => {
    it('should set cookie with JWT token on successful signup', async () => {
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
          captchaToken: VALID_CAPTCHA_TOKEN,
        }),
      })

      expect(res.status).toBe(StatusCodes.CREATED)

      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          role: Role.User,
          status: 'new',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        token: 'signup-jwt-token',
      })

      expect(mockSetAccessCookie).toHaveBeenCalledTimes(1)
      expect(mockSetAccessCookie).toHaveBeenCalledWith(expect.any(Object), 'signup-jwt-token')

      expect(mockSignUpWithEmail).toHaveBeenCalledTimes(1)
      expect(mockSignUpWithEmail).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        role: Role.User,
      })
    })

    it('should return user and token on successful signup', async () => {
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
          captchaToken: VALID_CAPTCHA_TOKEN,
        }),
      })

      expect(res.status).toBe(StatusCodes.CREATED)

      const data = await res.json()
      expect(data.token).toBe('signup-jwt-token')
      expect(data.user).toHaveProperty('email', 'test@example.com')
    })

    it('should set cookie in development environment', async () => {
      mock.module('@/lib/env', () => ({
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
          captchaToken: VALID_CAPTCHA_TOKEN,
        }),
      })

      expect(res.status).toBe(StatusCodes.CREATED)

      const data = await res.json()
      expect(data.token).toBe('signup-jwt-token')
      expect(data.user).toHaveProperty('email', 'test@example.com')

      expect(mockSetAccessCookie).toHaveBeenCalledTimes(1)
      expect(mockSetAccessCookie).toHaveBeenCalledWith(expect.any(Object), 'signup-jwt-token')
    })

    it('should handle signup errors and not set cookie', async () => {
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
          captchaToken: VALID_CAPTCHA_TOKEN,
        }),
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

      expect(mockSetAccessCookie).not.toHaveBeenCalled()

      expect(mockSignUpWithEmail).toHaveBeenCalledTimes(1)
    })
  })
})
