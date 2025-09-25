import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { loggerMiddleware, onError } from '@/middleware'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import requestPasswordResetRoute from '../index'

describe('Request Password Reset Endpoint', () => {
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

  beforeEach(() => {
    mockRequestPasswordReset = mock(() => Promise.resolve({ success: true }))

    mock.module('../request-password-reset', () => ({
      default: mockRequestPasswordReset,
    }))

    mockCaptchaSuccess()
    createApp()
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

    it('should validate email format', async () => {
      const invalidEmails = [
        { email: '', captchaToken: VALID_CAPTCHA_TOKEN }, // empty email
        { email: 'invalid', captchaToken: VALID_CAPTCHA_TOKEN }, // invalid format
        { email: 'test@', captchaToken: VALID_CAPTCHA_TOKEN }, // incomplete
        { email: '@example.com', captchaToken: VALID_CAPTCHA_TOKEN }, // missing local part
        { captchaToken: VALID_CAPTCHA_TOKEN }, // missing email field
      ]

      for (const body of invalidEmails) {
        const res = await postRequest(body)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should validate captcha token', async () => {
      const invalidCaptchaRequests = [
        { email: 'test@example.com' }, // missing captcha token
        { email: 'test@example.com', captchaToken: '' }, // empty captcha token
        { email: 'test@example.com', captchaToken: 'invalid-token' }, // invalid captcha token
      ]

      for (const body of invalidCaptchaRequests) {
        const res = await postRequest(body)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should require Content-Type header', async () => {
      const res = await postRequest({
        email: 'test@example.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
      }, {})

      expect(res.status).toBe(StatusCodes.BAD_REQUEST)
    })

    it('should handle malformed JSON', async () => {
      const res = await postRequest('{ invalid json', { 'Content-Type': 'application/json' })

      expect(res.status).toBe(StatusCodes.BAD_REQUEST)
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

    it('should handle different email formats gracefully', async () => {
      const emailFormats = [
        'user@example.com',
        'test+tag@email.co.uk',
        'user.name@company-domain.org',
      ]

      for (const email of emailFormats) {
        const res = await postRequest({
          email,
          captchaToken: VALID_CAPTCHA_TOKEN,
        })

        expect(res.status).toBe(StatusCodes.ACCEPTED)
        expect(mockRequestPasswordReset).toHaveBeenCalledWith(email)
      }
    })
  })
})
