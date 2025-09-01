import type { MiddlewareHandler } from 'hono'

import { cors } from 'hono/cors'

import env, { isDevEnv, isProdEnv, isStagingEnv, isTestEnv } from '@/lib/env'
import logger from '@/lib/logger'

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
  const allowedPatterns = [
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    /^http:\/\/\[::1\](:\d+)?$/,
    /^https:\/\/localhost(:\d+)?$/,
  ]

  return cors({
    origin: (origin: string) => {
      if (!origin) {
        return '*'
      }

      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin))

      return isAllowed ? origin : undefined
    },
    allowMethods: ALLOWED_METHODS,
    allowHeaders: ALLOWED_HEADERS,
    exposeHeaders: EXPOSED_HEADERS,
    maxAge: TEN_MINUTES,
    credentials: true,
  })
}

const buildProductionCors = (): MiddlewareHandler => {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || []

  if (allowedOrigins.length === 0) {
    logger.warn('No ALLOWED_ORIGINS configured for production/staging.')
  }

  return cors({
    origin: (origin: string) => {
      if (!origin) {
        return undefined
      }

      return allowedOrigins.includes(origin) ? origin : undefined
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
