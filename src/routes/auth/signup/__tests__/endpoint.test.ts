import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, doRequest, ModuleMocker, post } from '@/__tests__'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/captcha/__tests__'
import HttpStatus from '@/net/http/status'
import { Role, Status } from '@/types'

import signupRoute from '../index'

describe('Signup Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const SIGNUP_URL = '/api/v1/auth/signup'

  let app: Hono
  let mockSignUpWithEmail: any
  let mockSetAccessCookie: any

  beforeEach(async () => {
    mockSignUpWithEmail = mock(async () => ({
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
      token: 'signup-jwt-token',
    }))

    await moduleMocker.mock('../signup', () => ({
      default: mockSignUpWithEmail,
    }))

    mockSetAccessCookie = mock(() => {})

    await moduleMocker.mock('@/lib/cookie', () => ({
      setAccessCookie: mockSetAccessCookie,
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
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
      })
    })

    it('should validate required field formats', async () => {
      const invalidData = [
        { firstName: '', lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // empty firstName
        { firstName: 'John', lastName: '', email: 'test@example.com', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // empty lastName
        { firstName: 'John', lastName: 'Doe', email: 'invalid', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // invalid email format
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'short', captchaToken: VALID_CAPTCHA_TOKEN }, // password too short
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'NoNumbers!', captchaToken: VALID_CAPTCHA_TOKEN }, // password missing numbers
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'NoSpecial123', captchaToken: VALID_CAPTCHA_TOKEN }, // password missing special chars
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
        { lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // missing firstName
        { firstName: 'John', password: 'ValidPass123!', captchaToken: VALID_CAPTCHA_TOKEN }, // missing lastName and email
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', captchaToken: VALID_CAPTCHA_TOKEN }, // missing password
        { captchaToken: VALID_CAPTCHA_TOKEN }, // only captchaToken provided
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockSetAccessCookie).not.toHaveBeenCalled()
      expect(mockSignUpWithEmail).toHaveBeenCalledTimes(1)
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await doRequest(app, SIGNUP_URL, method, {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }, { 'Content-Type': 'application/json' })

        expect(res.status).toBe(HttpStatus.NOT_FOUND)
      }
    })
  })
})
