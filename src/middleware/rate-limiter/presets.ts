import { isDevEnv, isTestEnv } from '@/lib/env'

import { createRateLimiter } from './core'

/**
 * Rate limiter for authentication endpoints.
 *
 * - Production: 5 attempts per 15 minutes
 * - Development/Test: 1000 attempts per 15 minutes
 *
 * Use for login, registration, password reset endpoints.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (isDevEnv() || isTestEnv()) ? 1000 : 5, // 5 attempts per 15 minutes in production
  message: 'Too many authentication attempts, please try again later.',
  skip: (c) => {
    // Skip rate limiting for test environment if special header is present
    return (isDevEnv() || isTestEnv()) && c.req.header('X-Skip-Rate-Limit') === 'true'
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
  limit: (isDevEnv() || isTestEnv()) ? 1000 : 100, // 100 requests per 15 minutes in production
  skip: (c) => {
    // Skip rate limiting for test environment if special header is present
    return (isDevEnv() || isTestEnv()) && c.req.header('X-Skip-Rate-Limit') === 'true'
  },
})

/**
 * Strict rate limiter for sensitive or resource-intensive endpoints.
 *
 * - Production: 10 requests per 5 minutes
 * - Development/Test: 1000 requests per 5 minutes
 *
 * Use for endpoints that are expensive, sensitive, or prone to abuse.
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: (isDevEnv() || isTestEnv()) ? 1000 : 10, // 10 requests per 5 minutes in production
  message: 'Rate limit exceeded. This endpoint has strict limits.',
  skip: (c) => {
    // Skip rate limiting for test environment if special header is present
    return (isDevEnv() || isTestEnv()) && c.req.header('X-Skip-Rate-Limit') === 'true'
  },
})
