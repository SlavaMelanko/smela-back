import type { MiddlewareHandler } from 'hono'

import { cors } from 'hono/cors'

const testCors = (): MiddlewareHandler => {
  return cors({
    origin: '*',
    credentials: false,
  })
}

export default testCors
