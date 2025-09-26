import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { ModuleMocker } from '@/__tests__/module-mocker'
import { loggerMiddleware, onError } from '@/middleware'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import requestPasswordResetRoute from '../index'

describe('Request Password Reset Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let app: Hono
  let mockRequestPasswordReset: any

  const createApp = () => {
    app = new Hono()
    app.onError(onError)
    app.use(loggerMiddleware)
    app.route('/api/v1/auth', requestPasswordResetRoute)
  }

  const postRequest = (body: any, headers: Record<string, string> = { 'Content-Type': 'application/json' }, method = 'POST') =>
    app.request('/api/v1/auth/request-password-reset', {
      method,
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  beforeEach(async () => {
    mockRequestPasswordReset = mock(() => Promise.resolve({ success: true }))

    await moduleMocker.mock('../request-password-reset', () => ({
      default: mockRequestPasswordReset,
    }))

    mockCaptchaSuccess()
    createApp()
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('POST /auth/request-password-reset', () => {
    it('should return success response on valid request', async () => {
      const res = await postRequest({
        email: 'test@example.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(StatusCodes.ACCEPTED)

      const data = await res.json()
      expect(data).toEqual({ success: true })

      expect(mockRequestPasswordReset).toHaveBeenCalledTimes(1)
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com')
    })

    it('should validate required fields', async () => {
      const invalidRequests = [
        // Invalid email formats
        { email: '', captchaToken: VALID_CAPTCHA_TOKEN }, // empty email
        { email: 'invalid', captchaToken: VALID_CAPTCHA_TOKEN }, // invalid format
        { email: 'test@', captchaToken: VALID_CAPTCHA_TOKEN }, // incomplete
        { email: '@example.com', captchaToken: VALID_CAPTCHA_TOKEN }, // missing local part
        { captchaToken: VALID_CAPTCHA_TOKEN }, // missing email field

        // Invalid captcha tokens
        { email: 'test@example.com' }, // missing captcha token
        { email: 'test@example.com', captchaToken: '' }, // empty captcha token
        { email: 'test@example.com', captchaToken: 'invalid-token' }, // invalid captcha token
      ]

      for (const body of invalidRequests) {
        const res = await postRequest(body)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should handle malformed requests', async () => {
      const malformedScenarios: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        {
          name: 'undefined body',
          headers: { 'Content-Type': 'application/json' },
          body: undefined,
        },
        {
          name: 'missing Content-Type header',
          headers: {},
          body: {
            email: 'test@example.com',
            captchaToken: VALID_CAPTCHA_TOKEN,
          },
        },
        {
          name: 'malformed JSON body',
          headers: { 'Content-Type': 'application/json' },
          body: '{ invalid json',
        },
      ]

      for (const scenario of malformedScenarios) {
        const res = await postRequest(scenario.body, scenario.headers)
        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
      }
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await postRequest({
          email: 'test@example.com',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }, { 'Content-Type': 'application/json' }, method)

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })
  })
})
