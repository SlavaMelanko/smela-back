import type { Context, MiddlewareHandler } from 'hono'
import type { StatusCode } from 'hono/utils/http-status'

import { rateLimiter } from 'hono-rate-limiter'

import { isDevEnv, isTestEnv } from '@/lib/env'

interface RateLimiterConfig {
  windowMs?: number
  limit?: number
  message?: string
  statusCode?: StatusCode
  keyGenerator?: (c: Context) => string
  skip?: (c: Context) => boolean
}

const getClientIp = (c: Context): string => {
  // Try various headers in order of preference
  const forwardedFor = c.req.header('X-Forwarded-For')
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = c.req.header('X-Real-IP')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = c.req.header('CF-Connecting-IP')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback to a default identifier
  return 'unknown-ip'
}

const createRateLimiter = (config: RateLimiterConfig = {}): MiddlewareHandler => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    limit = config.limit !== undefined ? config.limit : ((isDevEnv() || isTestEnv()) ? 1000 : 100),
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = getClientIp,
    skip,
  } = config

  return rateLimiter({
    windowMs,
    limit,
    message,
    statusCode,
    keyGenerator,
    skip,
    standardHeaders: 'draft-6', // Add standard rate limit headers
  })
}

// Pre-configured rate limiters for common use cases
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (isDevEnv() || isTestEnv()) ? 1000 : 5, // 5 attempts per 15 minutes in production
  message: 'Too many authentication attempts, please try again later.',
  skip: (c) => {
    // Skip rate limiting for test environment if special header is present
    return (isDevEnv() || isTestEnv()) && c.req.header('X-Skip-Rate-Limit') === 'true'
  },
})

export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (isDevEnv() || isTestEnv()) ? 1000 : 100, // 100 requests per 15 minutes in production
  skip: (c) => {
    // Skip rate limiting for test environment if special header is present
    return (isDevEnv() || isTestEnv()) && c.req.header('X-Skip-Rate-Limit') === 'true'
  },
})

export const strictRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: (isDevEnv() || isTestEnv()) ? 1000 : 10, // 10 requests per 5 minutes in production
  message: 'Rate limit exceeded. This endpoint has strict limits.',
  skip: (c) => {
    // Skip rate limiting for test environment if special header is present
    return (isDevEnv() || isTestEnv()) && c.req.header('X-Skip-Rate-Limit') === 'true'
  },
})

export default createRateLimiter
