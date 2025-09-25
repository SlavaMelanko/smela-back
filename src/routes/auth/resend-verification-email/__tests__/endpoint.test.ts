import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { ModuleMocker } from '@/__tests__/module-mocker'
import { loggerMiddleware, onError } from '@/middleware'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import resendVerificationEmailRoute from '../index'

describe('Resend Verification Email Endpoint', () => {
  const moduleMocker = new ModuleMocker()

  let app: Hono
  let mockResendVerificationEmail: any

  const createApp = () => {
    app = new Hono()
    app.use(loggerMiddleware)
    app.onError(onError)
    app.route('/api/v1/auth', resendVerificationEmailRoute)
  }

  const postRequest = (
    body: any,
    headers: Record<string, string> = { 'Content-Type': 'application/json' },
    method: string = 'POST',
  ) =>
    app.request('/api/v1/auth/resend-verification-email', {
      method,
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  beforeEach(async () => {
    mockResendVerificationEmail = mock(() => Promise.resolve({ success: true }))

    await moduleMocker.mock('../resend-verification-email', () => ({
      default: mockResendVerificationEmail,
    }))

    mockCaptchaSuccess()
    createApp()
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('POST /auth/resend-verification-email', () => {
    it('should return success when verification email is resent', async () => {
      const res = await postRequest({
        email: 'test@example.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(StatusCodes.ACCEPTED)

      const data = await res.json()
      expect(data).toEqual({ success: true })

      expect(mockResendVerificationEmail).toHaveBeenCalledTimes(1)
      expect(mockResendVerificationEmail).toHaveBeenCalledWith('test@example.com')
    })

    it('should handle different email formats', async () => {
      const testEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.com',
      ]

      for (const email of testEmails) {
        const res = await postRequest({
          email,
          captchaToken: VALID_CAPTCHA_TOKEN,
        })

        expect(res.status).toBe(StatusCodes.ACCEPTED)
        expect(mockResendVerificationEmail).toHaveBeenCalledWith(email)
      }
    })

    it('should handle errors from resend verification email logic', async () => {
      mockResendVerificationEmail.mockImplementationOnce(() => {
        throw new Error('Email service unavailable')
      })

      const res = await postRequest({
        email: 'test@example.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(mockResendVerificationEmail).toHaveBeenCalledTimes(1)
    })

    it('should validate request format and required fields', async () => {
      const invalidRequests = [
        { name: 'empty email', body: { email: '', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'invalid email format', body: { email: 'invalid', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'missing email field', body: { captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'missing captcha token', body: { email: 'test@example.com' } },
        { name: 'missing all fields', body: {} },
      ]

      for (const testCase of invalidRequests) {
        const res = await postRequest(testCase.body)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should handle malformed requests', async () => {
      const malformedRequests: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: { email: 'test@example.com', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const testCase of malformedRequests) {
        const res = await postRequest(testCase.body, testCase.headers)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
      }
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await postRequest(
          { email: 'test@example.com', captchaToken: VALID_CAPTCHA_TOKEN },
          { 'Content-Type': 'application/json' },
          method,
        )

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })
  })
})
