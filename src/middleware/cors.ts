import type { MiddlewareHandler } from 'hono'

import { cors } from 'hono/cors'

import env, { isDevEnv, isProdEnv, isStagingEnv, isTestEnv } from '@/lib/env'
import logger from '@/lib/logger'
import { isHTTPS, isLocalhost, isValidOrigin, normalizeOrigin } from '@/lib/url'

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With']
const EXPOSED_HEADERS = ['Content-Length', 'X-Request-Id']
const TEN_MINUTES = 600
const ONE_HOUR = 3600

const buildTestCors = (): MiddlewareHandler => {
  return cors({
    origin: '*',
    credentials: false,
  })
}

const buildDevCors = (): MiddlewareHandler => {
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
    maxAge: TEN_MINUTES,
    credentials: true,
  })
}

const buildProductionCors = (): MiddlewareHandler => {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',')
    .map(o => o.trim())
    .filter(Boolean)
    .map(normalizeOrigin) || []

  if (allowedOrigins.length === 0) {
    logger.warn('No ALLOWED_ORIGINS configured for production/staging.')
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

      if (!isHTTPS(normalized)) {
        logger.warn(`Blocked non-HTTPS origin: ${normalized}`)

        return undefined
      }

      return allowedOrigins.includes(normalized) ? normalized : undefined
    },
    allowMethods: ALLOWED_METHODS,
    allowHeaders: ALLOWED_HEADERS,
    exposeHeaders: EXPOSED_HEADERS,
    maxAge: ONE_HOUR,
    credentials: true,
  })
}

const getCorsMiddleware = (): MiddlewareHandler => {
  if (isTestEnv()) {
    return buildTestCors()
  }

  if (isDevEnv()) {
    return buildDevCors()
  }

  if (isStagingEnv() || isProdEnv()) {
    return buildProductionCors()
  }

  // Fallback: deny all
  return cors({
    origin: () => undefined,
    credentials: false,
  })
}

const corsMiddleware = getCorsMiddleware()

export default corsMiddleware
