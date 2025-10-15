import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { z } from 'zod'

import { post } from '@/__tests__/request'
import { ErrorCode } from '@/errors'
import { onError } from '@/handlers'
import HttpStatus from '@/net/http/status'

import requestValidator from '../request-validator'

describe('Request Validator Middleware', () => {
  it('should accept valid email and password together', async () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    })

    const app = new Hono()
    app.onError(onError)
    app.post('/test', requestValidator('json', schema), c => c.json({ success: true }))

    const response = await post(app, '/test', {
      email: 'user@example.com',
      password: 'SecurePass123!',
    })

    expect(response.status).toBe(HttpStatus.OK)

    const json = await response.json()
    expect(json).toEqual({ success: true })
  })

  it('should return validation error when required password field is missing', async () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    })

    const app = new Hono()
    app.onError(onError)
    app.post('/test', requestValidator('json', schema), c => c.json({ success: true }))

    const response = await post(app, '/test', { email: 'user@example.com' })

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)

    const json = await response.json()
    expect(json).toHaveProperty('code', ErrorCode.ValidationError)
    expect(json).toHaveProperty('error', 'Missing required field "password"')
  })

  it('should return validation error when token exceeds required length', async () => {
    const schema = z.object({
      token: z.string().length(64, { message: 'Token must be exactly 64 characters long' }),
    })

    const app = new Hono()
    app.onError(onError)
    app.post('/test', requestValidator('json', schema), c => c.json({ success: true }))

    const validToken = 'a'.repeat(64) // exactly 64 characters
    const tooLongToken = `${validToken}extra` // 69 characters

    const response = await post(app, '/test', { token: tooLongToken })

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)

    const json = await response.json()
    expect(json).toHaveProperty('code', ErrorCode.ValidationError)
    expect(json).toHaveProperty('error', 'Token must be exactly 64 characters long')
  })
})
