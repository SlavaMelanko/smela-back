import type { MiddlewareHandler } from 'hono'

import { rateLimiter } from 'hono-rate-limiter'

import { isDevEnv, isTestEnv } from '@/lib/env'

import type { RateLimiterConfig } from './config'

import { getClientIp } from './utils'

/**
 * Creates a rate limiter middleware with the specified configuration.
 *
 * @param config - Configuration options for the rate limiter
 * @returns Hono middleware handler for rate limiting
 */
export const createRateLimiter = (config: RateLimiterConfig = {}): MiddlewareHandler => {
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
