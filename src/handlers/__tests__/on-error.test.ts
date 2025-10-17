import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { ErrorCode } from '@/errors'
import { HttpStatus } from '@/net/http'

import onError from '../on-error'

describe('onError handler', () => {
  it('should return 500 with error details for generic errors', async () => {
    const app = new Hono<AppContext>()

    app.onError(onError)

    app.get('/error', () => {
      throw new Error('Something went wrong')
    })

    const res = await app.request('/error')
    const body = await res.json()

    expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(body).toMatchObject({
      code: ErrorCode.InternalError,
      error: 'Something went wrong',
      name: 'Error',
    })
  })

  it('should handle custom error codes from thrown errors', async () => {
    const app = new Hono<AppContext>()

    app.onError(onError)

    app.get('/custom-error', () => {
      const error = new Error('Custom error')

      ;(error as any).code = ErrorCode.BadRequest
      throw error
    })

    const res = await app.request('/custom-error')
    const body = await res.json()

    expect(res.status).toBe(HttpStatus.BAD_REQUEST)
    expect(body).toMatchObject({
      code: ErrorCode.BadRequest,
      error: 'Custom error',
      name: 'Error',
    })
  })

  it('should not include stack trace in test environment', async () => {
    const app = new Hono<AppContext>()

    app.onError(onError)

    app.get('/error', () => {
      throw new Error('Test error')
    })

    const res = await app.request('/error')
    const body = await res.json()

    // test environment should not include stack traces (production-like behavior)
    expect(body.stack).toBeUndefined()
  })
})
