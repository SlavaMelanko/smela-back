import type { MiddlewareHandler } from 'hono'

import { cors } from 'hono/cors'

export const fallbackCors = (): MiddlewareHandler => {
  // Deny all origins when no environment matches
  return cors({
    origin: () => undefined,
    credentials: false,
  })
}
