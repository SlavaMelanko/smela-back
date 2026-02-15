import type { MiddlewareHandler } from 'hono'

import { cors } from 'hono/cors'

export const testCors = (): MiddlewareHandler => {
  return cors({
    origin: '*',
    credentials: false,
  })
}
