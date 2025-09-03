import type { MiddlewareHandler } from 'hono'

import { cors } from 'hono/cors'

import { isLocalhost, isValidOrigin, normalizeOrigin } from '@/lib/url'

import { ALLOWED_HEADERS, ALLOWED_METHODS, EXPOSED_HEADERS, MAX_AGE_TEN_MINUTES } from '../constants'

const devCors = (): MiddlewareHandler => {
  return cors({
    origin: (origin: string) => {
      if (!origin) {
        return '*'
      }

      if (!isValidOrigin(origin)) {
        return undefined
      }

      const normalized = normalizeOrigin(origin)

      return isLocalhost(normalized) ? normalized : undefined
    },
    allowMethods: ALLOWED_METHODS,
    allowHeaders: ALLOWED_HEADERS,
    exposeHeaders: EXPOSED_HEADERS,
    maxAge: MAX_AGE_TEN_MINUTES,
    credentials: true,
  })
}

export default devCors
