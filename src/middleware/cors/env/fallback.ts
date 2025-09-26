import type { MiddlewareHandler } from 'hono'

import { cors } from 'hono/cors'

const fallbackCors = (): MiddlewareHandler => {
  // Deny all origins when no environment matches
  return cors({
    origin: () => undefined,
    credentials: false,
  })
}

export default fallbackCors
