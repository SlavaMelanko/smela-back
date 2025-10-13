import type { MiddlewareHandler } from 'hono'

import { cors } from 'hono/cors'

import env from '@/env'
import { isHttps, isValidOrigin, normalizeOrigin } from '@/lib/url'
import { logger } from '@/logging'

import { ALLOWED_HEADERS, ALLOWED_METHODS, EXPOSED_HEADERS, MAX_AGE_ONE_HOUR } from '../constants'

const stagingAndProdCors = (): MiddlewareHandler => {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',')
    .map(o => o.trim())
    .filter(Boolean)
    .map(normalizeOrigin) || []

  if (allowedOrigins.length === 0) {
    throw new Error('ALLOWED_ORIGINS must be configured for production/staging')
  }

  return cors({
    origin: (origin: string) => {
      if (!origin) {
        return undefined
      }

      if (!isValidOrigin(origin)) {
        logger.warn(`Invalid origin format: ${origin}`)

        return undefined
      }

      const normalized = normalizeOrigin(origin)

      if (!isHttps(normalized)) {
        logger.warn(`Blocked non-HTTPS origin: ${normalized}`)

        return undefined
      }

      return allowedOrigins.includes(normalized) ? normalized : undefined
    },
    allowMethods: ALLOWED_METHODS,
    allowHeaders: ALLOWED_HEADERS,
    exposeHeaders: EXPOSED_HEADERS,
    maxAge: MAX_AGE_ONE_HOUR,
    credentials: true,
  })
}

export default stagingAndProdCors
