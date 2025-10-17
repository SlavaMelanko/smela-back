import { isDevOrTestEnv } from '@/env'

import { createRateLimiter } from './core'

/**
 * Rate limiter for authentication endpoints.
 *
 * - Production: 5 attempts per 15 minutes
 * - Development/Test: 1000 attempts per 15 minutes
 *
 * Use for authentication endpoints like login, signup, etc.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (isDevOrTestEnv()) ? 1_000 : 5,
  message: 'Too many authentication attempts, please try again later.',
  skip: (c) => {
    // Skip rate limiting for test environment if special header is present
    return (isDevOrTestEnv()) && c.req.header('X-Skip-Rate-Limit') === 'true'
  },
})

/**
 * General purpose rate limiter for most API endpoints.
 *
 * - Production: 100 requests per 15 minutes
 * - Development/Test: 1000 requests per 15 minutes
 *
 * Use for regular API endpoints that don't need strict limiting.
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (isDevOrTestEnv()) ? 1_000 : 100,
  skip: (c) => {
    // Skip rate limiting for test environment if special header is present
    return (isDevOrTestEnv()) && c.req.header('X-Skip-Rate-Limit') === 'true'
  },
})
