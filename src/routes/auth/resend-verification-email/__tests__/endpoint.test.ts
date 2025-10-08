import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, doRequest, ModuleMocker, post } from '@/__tests__'
import HttpStatus from '@/lib/http-status'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/captcha/__tests__'

import resendVerificationEmailRoute from '../index'

describe('Resend Verification Email Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const RESEND_VERIFICATION_EMAIL_URL = '/api/v1/auth/resend-verification-email'

  let app: Hono
  let mockResendVerificationEmail: any

  beforeEach(async () => {
    mockResendVerificationEmail = mock(async () => ({ success: true }))

    await moduleMocker.mock('../resend-verification-email', () => ({
      default: mockResendVerificationEmail,
    }))

    await mockCaptchaSuccess()

    app = createTestApp('/api/v1/auth', resendVerificationEmailRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('POST /auth/resend-verification-email', () => {
    it('should return success when verification email is resent', async () => {
      const res = await post(app, RESEND_VERIFICATION_EMAIL_URL, {
        email: 'test@example.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(HttpStatus.ACCEPTED)

      const data = await res.json()
      expect(data).toEqual({ success: true })

      expect(mockResendVerificationEmail).toHaveBeenCalledTimes(1)
      expect(mockResendVerificationEmail).toHaveBeenCalledWith('test@example.com')
    })

    it('should handle errors from resend verification email logic', async () => {
      mockResendVerificationEmail.mockImplementationOnce(() => {
        throw new Error('Email service unavailable')
      })

      const res = await post(app, RESEND_VERIFICATION_EMAIL_URL, {
        email: 'test@example.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
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
        const res = await post(app, RESEND_VERIFICATION_EMAIL_URL, testCase.body)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should handle malformed requests', async () => {
      const scenarios: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: { email: 'test@example.com', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, RESEND_VERIFICATION_EMAIL_URL, body, headers)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      }
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await doRequest(app, RESEND_VERIFICATION_EMAIL_URL, method, {
          email: 'test@example.com',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }, { 'Content-Type': 'application/json' })

        expect(res.status).toBe(HttpStatus.NOT_FOUND)
      }
    })
  })
})
