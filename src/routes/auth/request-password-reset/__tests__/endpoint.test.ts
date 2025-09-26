import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, doRequest, ModuleMocker, post } from '@/__tests__'
import { HttpStatus } from '@/lib/http-status'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/__tests__/mocks/captcha'

import requestPasswordResetRoute from '../index'

describe('Request Password Reset Endpoint', () => {
  const REQUEST_PASSWORD_RESET_URL = '/api/v1/auth/request-password-reset'

  let app: Hono
  let mockRequestPasswordReset: any

  const moduleMocker = new ModuleMocker(import.meta.url)

  beforeEach(async () => {
    mockRequestPasswordReset = mock(() => Promise.resolve({ success: true }))

    await moduleMocker.mock('../request-password-reset', () => ({
      default: mockRequestPasswordReset,
    }))

    mockCaptchaSuccess()

    app = createTestApp('/api/v1/auth', requestPasswordResetRoute)
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('POST /auth/request-password-reset', () => {
    it('should return success response on valid request', async () => {
      const res = await post(app, REQUEST_PASSWORD_RESET_URL, {
        email: 'test@example.com',
        captchaToken: VALID_CAPTCHA_TOKEN,
      })

      expect(res.status).toBe(HttpStatus.ACCEPTED)

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
        const res = await post(app, REQUEST_PASSWORD_RESET_URL, body)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should handle malformed requests', async () => {
      const scenarios: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type header', headers: {}, body: { email: 'test@example.com', captchaToken: VALID_CAPTCHA_TOKEN } },
        { name: 'undefined body', headers: { 'Content-Type': 'application/json' }, body: undefined },
        { name: 'empty body', headers: { 'Content-Type': 'application/json' }, body: {} },
        { name: 'malformed JSON body', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, REQUEST_PASSWORD_RESET_URL, body, headers)
        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      }
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await doRequest(app, REQUEST_PASSWORD_RESET_URL, method, {
          email: 'test@example.com',
          captchaToken: VALID_CAPTCHA_TOKEN,
        }, { 'Content-Type': 'application/json' })

        expect(res.status).toBe(HttpStatus.NOT_FOUND)
      }
    })
  })
})
