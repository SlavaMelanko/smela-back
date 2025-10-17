import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { APP_ERROR_NAME, ErrorCode, ErrorRegistry } from '@/errors'
import { HttpStatus } from '@/net/http'

import notFound from '../not-found'

describe('notFound handler', () => {
  it('should return 404 with error details for unknown routes', async () => {
    const app = new Hono<AppContext>()

    app.notFound(notFound)

    const res = await app.request('/unknown/path')
    const body = await res.json()

    expect(res.status).toBe(HttpStatus.NOT_FOUND)
    expect(body).toEqual({
      code: ErrorCode.NotFound,
      error: ErrorRegistry[ErrorCode.NotFound].error,
      name: APP_ERROR_NAME,
      path: '/unknown/path',
    })
  })
})
