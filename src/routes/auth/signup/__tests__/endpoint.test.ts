import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { ModuleMocker } from '@/__tests__/module-mocker'
import { loggerMiddleware, onError } from '@/middleware'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'
import { Role } from '@/types'

import signupRoute from '../index'

describe('Signup Endpoint', () => {
  const moduleMocker = new ModuleMocker()

  let app: Hono
  let mockSignUpWithEmail: any
  let mockSetAccessCookie: any

  const createApp = () => {
    app = new Hono()
    app.use(loggerMiddleware)
    app.onError(onError)
    app.route('/api/v1/auth', signupRoute)
  }

  const postRequest = (
    body: any,
    headers: Record<string, string> = { 'Content-Type': 'application/json' },
    method: string = 'POST',
  ) =>
    app.request('/api/v1/auth/signup', {
      method,
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  beforeEach(async () => {
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

    await moduleMocker.mock('../signup', () => ({
      default: mockSignUpWithEmail,
    }))

    await moduleMocker.mock('@/lib/cookie', () => ({
      setAccessCookie: mockSetAccessCookie,
    }))

    mockCaptchaSuccess()
    createApp()
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('POST /auth/signup', () => {
    it('should set cookie with JWT token on successful signup', async () => {
      const validPayload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        role: Role.User,
        captchaToken: VALID_CAPTCHA_TOKEN,
      }

      const res = await postRequest(validPayload)

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

    it('should validate required field formats', async () => {
      const invalidData = [
        { firstName: '', lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!', role: Role.User, captchaToken: VALID_CAPTCHA_TOKEN },
        { firstName: 'John', lastName: '', email: 'test@example.com', password: 'ValidPass123!', role: Role.User, captchaToken: VALID_CAPTCHA_TOKEN },
        { firstName: 'John', lastName: 'Doe', email: 'invalid', password: 'ValidPass123!', role: Role.User, captchaToken: VALID_CAPTCHA_TOKEN },
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'short', role: Role.User, captchaToken: VALID_CAPTCHA_TOKEN },
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'NoNumbers!', role: Role.User, captchaToken: VALID_CAPTCHA_TOKEN },
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'NoSpecial123', role: Role.User, captchaToken: VALID_CAPTCHA_TOKEN },
      ]

      for (const body of invalidData) {
        const res = await postRequest(body)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should require all required fields', async () => {
      const incompleteRequests = [
        { lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!', role: Role.User, captchaToken: VALID_CAPTCHA_TOKEN },
        { firstName: 'John', password: 'ValidPass123!', role: Role.User, captchaToken: VALID_CAPTCHA_TOKEN },
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', captchaToken: VALID_CAPTCHA_TOKEN },
        { captchaToken: VALID_CAPTCHA_TOKEN },
        {},
      ]

      for (const body of incompleteRequests) {
        const res = await postRequest(body)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
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
        role: Role.User,
        captchaToken: VALID_CAPTCHA_TOKEN,
      }

      const malformedRequests: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: validPayload },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const testCase of malformedRequests) {
        const res = testCase.name === 'missing Content-Type'
          ? await app.request('/api/v1/auth/signup', {
              method: 'POST',
              headers: testCase.headers,
              body: JSON.stringify(testCase.body),
            })
          : await postRequest(testCase.body, testCase.headers)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
      }
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await postRequest({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          role: Role.User,
          captchaToken: VALID_CAPTCHA_TOKEN,
        }, { 'Content-Type': 'application/json' }, method)

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })

    it('should return user and token on successful signup', async () => {
      const res = await postRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        role: Role.User,
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(StatusCodes.CREATED)

      const data = await res.json()
      expect(data.token).toBe('signup-jwt-token')
      expect(data.user).toHaveProperty('email', 'test@example.com')
    })

    it('should handle signup errors and not set cookie', async () => {
      mockSignUpWithEmail.mockImplementationOnce(() => {
        throw new Error('Signup failed')
      })

      const res = await postRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        role: Role.User,
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(mockSetAccessCookie).not.toHaveBeenCalled()
      expect(mockSignUpWithEmail).toHaveBeenCalledTimes(1)
    })
  })
})
