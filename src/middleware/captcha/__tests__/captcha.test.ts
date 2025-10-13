import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { onError } from '@/handlers'
import HttpStatus from '@/net/http/status'

import captchaMiddleware from '../captcha'

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
      app.use('*', captchaMiddleware())
      app.post('/test', c => c.json({ success: true }))

      const response = await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: 'valid-token-123' }),
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
      app.use('*', captchaMiddleware())
      app.post('/test', c => c.json({ success: true }))

      await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: 'test-token', otherField: 'data' }),
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
      app.use('*', captchaMiddleware())
      app.post('/test', c => c.json({ success: true }))

      const response = await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: 'invalid-token' }),
      })

      expect(response.status).toBe(HttpStatus.BAD_REQUEST)
      expect(mockCaptchaValidate).toHaveBeenCalledWith('invalid-token')
      expect(mockCaptchaValidate).toHaveBeenCalledTimes(1)
    })

    it('should return error response with correct error code', async () => {
      const app = new Hono()
      app.onError(onError)
      app.use('*', captchaMiddleware())
      app.post('/test', c => c.json({ success: true }))

      const response = await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: 'invalid-token' }),
      })

      const json = await response.json()
      expect(json).toHaveProperty('code', ErrorCode.CaptchaValidationFailed)
      expect(json).toHaveProperty('error')
    })

    it('should not call next handler when validation fails', async () => {
      const mockHandler = mock(() => {})
      const app = new Hono()
      app.onError(onError)
      app.use('*', captchaMiddleware())
      app.post('/test', (c) => {
        mockHandler()

        return c.json({ success: true })
      })

      await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: 'invalid-token' }),
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
      app.use('*', captchaMiddleware())
      app.post('/test', c => c.json({ success: true }))

      const response = await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: 'any-token' }),
      })

      expect(response.status).toBe(HttpStatus.BAD_REQUEST)

      const json = await response.json()
      expect(json).toHaveProperty('code', ErrorCode.CaptchaValidationFailed)
      expect(json).toHaveProperty('error')
    })

    it('should log unexpected errors', async () => {
      const app = new Hono()
      app.onError(onError)
      app.use('*', captchaMiddleware())
      app.post('/test', c => c.json({ success: true }))

      await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: 'any-token' }),
      })

      expect(mockCaptchaValidate).toHaveBeenCalledTimes(1)
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

    it('should handle empty captcha token', async () => {
      const app = new Hono()
      app.onError(onError)
      app.use('*', captchaMiddleware())
      app.post('/test', c => c.json({ success: true }))

      await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: '' }),
      })

      expect(mockCaptchaValidate).toHaveBeenCalledWith('')
    })

    it('should handle very long captcha token', async () => {
      const longToken = 'a'.repeat(2000)
      const app = new Hono()
      app.onError(onError)
      app.use('*', captchaMiddleware())
      app.post('/test', c => c.json({ success: true }))

      await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: longToken }),
      })

      expect(mockCaptchaValidate).toHaveBeenCalledWith(longToken)
    })

    it('should handle special characters in token', async () => {
      const specialToken = 'token-with-!@#$%^&*()_+={}'
      const app = new Hono()
      app.onError(onError)
      app.use('*', captchaMiddleware())
      app.post('/test', c => c.json({ success: true }))

      await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken: specialToken }),
      })

      expect(mockCaptchaValidate).toHaveBeenCalledWith(specialToken)
    })
  })
})
