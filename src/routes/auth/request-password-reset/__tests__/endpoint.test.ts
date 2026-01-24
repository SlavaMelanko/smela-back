import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, ModuleMocker, post } from '@/__tests__'
import { mockCaptchaSuccess, VALID_CAPTCHA_TOKEN } from '@/middleware/captcha/__tests__'
import { HttpStatus } from '@/net/http'

import requestPasswordResetRoute from '../index'

describe('Request Password Reset Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const REQUEST_PASSWORD_RESET_URL = '/api/v1/auth/request-password-reset'

  let app: Hono
  let mockRequestPasswordReset: any

  beforeEach(async () => {
    mockRequestPasswordReset = mock(async () => ({ success: true }))

    await moduleMocker.mock('@/use-cases/auth/request-password-reset', () => ({
      default: mockRequestPasswordReset,
    }))

    await mockCaptchaSuccess()

    app = createTestApp('/api/v1/auth', requestPasswordResetRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('POST /auth/request-password-reset', () => {
    it('should return success response on valid request', async () => {
      const res = await post(app, REQUEST_PASSWORD_RESET_URL, {
        data: { email: 'test@example.com' },
        captcha: { token: VALID_CAPTCHA_TOKEN },
      })

      expect(res.status).toBe(HttpStatus.ACCEPTED)

      const data = await res.json()
      expect(data).toEqual({ success: true })

      expect(mockRequestPasswordReset).toHaveBeenCalledTimes(1)
      expect(mockRequestPasswordReset).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        undefined,
      )
    })

    it('should pass preferences to use-case when provided', async () => {
      const res = await post(app, REQUEST_PASSWORD_RESET_URL, {
        data: { email: 'test@example.com' },
        captcha: { token: VALID_CAPTCHA_TOKEN },
        preferences: { locale: 'uk', theme: 'dark' },
      })

      expect(res.status).toBe(HttpStatus.ACCEPTED)

      expect(mockRequestPasswordReset).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        { locale: 'uk', theme: 'dark' },
      )
    })

    it('should validate required fields', async () => {
      const invalidRequests = [
        // Invalid email formats
        { data: { email: '' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // empty email
        { data: { email: 'invalid' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // invalid format
        { data: { email: 'test@' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // incomplete
        { data: { email: '@example.com' }, captcha: { token: VALID_CAPTCHA_TOKEN } }, // missing local part
        { data: {}, captcha: { token: VALID_CAPTCHA_TOKEN } }, // missing email field
        { captcha: { token: VALID_CAPTCHA_TOKEN } }, // missing data object

        // Invalid captcha
        { data: { email: 'test@example.com' } }, // missing captcha
        { data: { email: 'test@example.com' }, captcha: {} }, // empty captcha object
        { data: { email: 'test@example.com' }, captcha: { token: '' } }, // empty captcha token
        { data: { email: 'test@example.com' }, captcha: { token: 'invalid-token' } }, // invalid captcha token
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
        { name: 'missing Content-Type header', headers: {}, body: { data: { email: 'test@example.com' }, captcha: { token: VALID_CAPTCHA_TOKEN } } },
        { name: 'undefined body', headers: { 'Content-Type': 'application/json' }, body: undefined },
        { name: 'empty body', headers: { 'Content-Type': 'application/json' }, body: {} },
        { name: 'malformed JSON body', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, REQUEST_PASSWORD_RESET_URL, body, headers)
        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      }
    })
  })
})
