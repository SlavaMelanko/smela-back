import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, ModuleMocker, post } from '@/__tests__'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/captcha/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import signupRoute from '../index'

describe('Signup Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const SIGNUP_URL = '/api/v1/auth/signup'

  let app: Hono
  let mockSignUpWithEmail: any
  let mockSetRefreshCookie: any
  let mockGetDeviceInfo: any

  beforeEach(async () => {
    mockSignUpWithEmail = mock(async () => ({
      data: {
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          role: Role.User,
          status: Status.New,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        accessToken: 'signup-jwt-token',
      },
      refreshToken: 'refresh-token-123',
    }))

    await moduleMocker.mock('@/use-cases/auth/signup', () => ({
      default: mockSignUpWithEmail,
    }))

    mockSetRefreshCookie = mock(() => {})
    mockGetDeviceInfo = mock(() => ({
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test)',
    }))

    await moduleMocker.mock('@/net/http', () => ({
      HttpStatus: {
        OK: 200,
        CREATED: 201,
        INTERNAL_SERVER_ERROR: 500,
        BAD_REQUEST: 400,
        NOT_FOUND: 404,
      },
      setRefreshCookie: mockSetRefreshCookie,
      getDeviceInfo: mockGetDeviceInfo,
    }))

    await mockCaptchaSuccess()

    app = createTestApp('/api/v1/auth', signupRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('POST /auth/signup', () => {
    it('should set cookie with JWT token on successful signup', async () => {
      const validPayload = {
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
        },
        captcha: { token: VALID_CAPTCHA_TOKEN },
      }

      const res = await post(app, SIGNUP_URL, validPayload)

      expect(res.status).toBe(HttpStatus.CREATED)

      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          role: Role.User,
          status: Status.New,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        accessToken: 'signup-jwt-token',
      })

      expect(mockSetRefreshCookie).toHaveBeenCalledTimes(1)
      expect(mockSetRefreshCookie).toHaveBeenCalledWith(expect.any(Object), 'refresh-token-123')

      expect(mockSignUpWithEmail).toHaveBeenCalledTimes(1)
      expect(mockSignUpWithEmail).toHaveBeenCalledWith(
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!' },
        { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0 (Test)' },
        undefined,
      )
    })

    it('should pass preferences to use-case when provided', async () => {
      const validPayload = {
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
        },
        captcha: { token: VALID_CAPTCHA_TOKEN },
        preferences: { locale: 'uk', theme: 'dark' },
      }

      const res = await post(app, SIGNUP_URL, validPayload)

      expect(res.status).toBe(HttpStatus.CREATED)

      expect(mockSignUpWithEmail).toHaveBeenCalledWith(
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!' },
        { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0 (Test)' },
        { locale: 'uk', theme: 'dark' },
      )
    })

    it('should validate required field formats', async () => {
      const invalidData = [
        { data: { firstName: '', lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // empty firstName
        { data: { firstName: 'John', lastName: 'X', email: 'test@example.com', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // lastName too short (1 char)
        { data: { firstName: 'John', lastName: 'Doe', email: 'invalid', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // invalid email format
        { data: { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'short' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // password too short
        { data: { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'NoNumbers!' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // password missing numbers
        { data: { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'NoSpecial123' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // password missing special chars
      ]

      for (const body of invalidData) {
        const res = await post(app, SIGNUP_URL, body)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should require all required fields', async () => {
      const incompleteRequests = [
        { data: { lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // missing firstName
        { data: { firstName: 'John', password: 'ValidPass123!' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // missing lastName and email
        { data: { firstName: 'John', lastName: 'Doe', email: 'test@example.com' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // missing password
        { captcha: { token: VALID_CAPTCHA_TOKEN } }, // missing data object
        {}, // completely empty
      ]

      for (const body of incompleteRequests) {
        const res = await post(app, SIGNUP_URL, body)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should handle malformed requests', async () => {
      const validPayload = {
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
        },
        captcha: { token: VALID_CAPTCHA_TOKEN },
      }

      const scenarios: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: validPayload },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, SIGNUP_URL, body, headers)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      }
    })

    it('should handle signup errors and not set cookie', async () => {
      mockSignUpWithEmail.mockImplementationOnce(() => {
        throw new Error('Signup failed')
      })

      const res = await post(app, SIGNUP_URL, {
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
        },
        captcha: { token: VALID_CAPTCHA_TOKEN },
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockSetRefreshCookie).not.toHaveBeenCalled()
      expect(mockSignUpWithEmail).toHaveBeenCalledTimes(1)
    })
  })
})
