import { zValidator } from '@hono/zod-validator'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { z } from 'zod'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { onError } from '@/handlers'
import { HttpStatus } from '@/net/http'

import captchaMiddleware from '../captcha'
import { invalidCaptchaTokens } from './captcha.mock'

// Simple schema for test validation (mirrors what requestValidator would validate)
const captchaSchema = z.object({
  captcha: z.object({
    token: z.string(),
  }),
})

// Extended schema to test passthrough of other fields
const extendedSchema = captchaSchema.extend({
  otherField: z.string().optional(),
})

describe('Captcha Middleware', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockCaptchaValidate: any

  describe('when captcha validation succeeds', () => {
    beforeEach(async () => {
      mockCaptchaValidate = mock(async () => {})

      await moduleMocker.mock('@/services', () => ({
        createCaptchaVerifier: mock(() => ({
          validate: mockCaptchaValidate,
        })),
      }))
    })

    afterEach(async () => {
      await moduleMocker.clear()
    })

    it('should allow request to proceed when captcha is valid', async () => {
      const app = new Hono()
      app.onError(onError)
      app.post('/test', zValidator('json', captchaSchema), captchaMiddleware(), c => c.json({ success: true }))

      const response = await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captcha: { token: 'valid-token-123' } }),
      })

      expect(response.status).toBe(HttpStatus.OK)
      expect(mockCaptchaValidate).toHaveBeenCalledWith('valid-token-123')
      expect(mockCaptchaValidate).toHaveBeenCalledTimes(1)

      const json = await response.json()
      expect(json).toEqual({ success: true })
    })

    it('should extract captcha token from request body', async () => {
      const app = new Hono()
      app.onError(onError)
      app.post('/test', zValidator('json', extendedSchema), captchaMiddleware(), c => c.json({ success: true }))

      await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captcha: { token: 'test-token' }, otherField: 'data' }),
      })

      expect(mockCaptchaValidate).toHaveBeenCalledWith('test-token')
    })
  })

  describe('when captcha validation fails', () => {
    beforeEach(async () => {
      mockCaptchaValidate = mock(async () => {
        throw new AppError(ErrorCode.CaptchaValidationFailed)
      })

      await moduleMocker.mock('@/services', () => ({
        createCaptchaVerifier: mock(() => ({
          validate: mockCaptchaValidate,
        })),
      }))
    })

    afterEach(async () => {
      await moduleMocker.clear()
    })

    it('should reject request with BAD_REQUEST status', async () => {
      const app = new Hono()
      app.onError(onError)
      app.post('/test', zValidator('json', captchaSchema), captchaMiddleware(), c => c.json({ success: true }))

      const response = await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captcha: { token: 'invalid-token' } }),
      })

      expect(response.status).toBe(HttpStatus.BAD_REQUEST)
      expect(mockCaptchaValidate).toHaveBeenCalledWith('invalid-token')
      expect(mockCaptchaValidate).toHaveBeenCalledTimes(1)
    })

    it('should return error response with correct error code', async () => {
      const app = new Hono()
      app.onError(onError)
      app.post('/test', zValidator('json', captchaSchema), captchaMiddleware(), c => c.json({ success: true }))

      const response = await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captcha: { token: 'invalid-token' } }),
      })

      const json = await response.json()
      expect(json).toHaveProperty('code', ErrorCode.CaptchaValidationFailed)
      expect(json).toHaveProperty('error')
    })

    it('should not call next handler when validation fails', async () => {
      const mockHandler = mock(() => {})
      const app = new Hono()
      app.onError(onError)
      app.post('/test', zValidator('json', captchaSchema), captchaMiddleware(), (c) => {
        mockHandler()

        return c.json({ success: true })
      })

      await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captcha: { token: 'invalid-token' } }),
      })

      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('when unexpected error occurs', () => {
    beforeEach(async () => {
      mockCaptchaValidate = mock(async () => {
        throw new Error('Network timeout')
      })

      await moduleMocker.mock('@/services', () => ({
        createCaptchaVerifier: mock(() => ({
          validate: mockCaptchaValidate,
        })),
      }))
    })

    afterEach(async () => {
      await moduleMocker.clear()
    })

    it('should convert unexpected errors to CaptchaValidationFailed', async () => {
      const app = new Hono()
      app.onError(onError)
      app.post('/test', zValidator('json', captchaSchema), captchaMiddleware(), c => c.json({ success: true }))

      const response = await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captcha: { token: 'any-token' } }),
      })

      expect(response.status).toBe(HttpStatus.BAD_REQUEST)
      expect(mockCaptchaValidate).toHaveBeenCalledTimes(1)

      const json = await response.json()
      expect(json).toHaveProperty('code', ErrorCode.CaptchaValidationFailed)
      expect(json).toHaveProperty('error')
    })
  })

  describe('edge cases', () => {
    beforeEach(async () => {
      mockCaptchaValidate = mock(async () => {})

      await moduleMocker.mock('@/services', () => ({
        createCaptchaVerifier: mock(() => ({
          validate: mockCaptchaValidate,
        })),
      }))
    })

    afterEach(async () => {
      await moduleMocker.clear()
    })

    for (const [name, token] of Object.entries(invalidCaptchaTokens)) {
      it(`should handle ${name} token`, async () => {
        const app = new Hono()
        app.onError(onError)
        app.post('/test', zValidator('json', captchaSchema), captchaMiddleware(), c => c.json({ success: true }))

        await app.request('/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ captcha: { token } }),
        })

        expect(mockCaptchaValidate).toHaveBeenCalledWith(token)
      })
    }
  })
})
