import type { Context } from 'hono'
import type { StatusCode } from 'hono/utils/http-status'

/**
 * Configuration options for the rate limiter middleware.
 */
export interface RateLimiterConfig {
  /**
   * Time window in milliseconds for rate limiting.
   * @default 15 * 60 * 1000 (15 minutes)
   */
  windowMs?: number

  /**
   * Maximum number of requests allowed per window.
   * @default 100 (production), 1000 (dev/test)
   */
  limit?: number

  /**
   * Error message to send when rate limit is exceeded.
   * @default 'Too many requests, please try again later.'
   */
  message?: string

  /**
   * HTTP status code to send when rate limit is exceeded.
   * @default 429 (Too Many Requests)
   */
  statusCode?: StatusCode

  /**
   * Function to generate unique keys for rate limiting.
   * @default getClientIp - extracts client IP from request headers
   */
  keyGenerator?: (c: Context) => string

  /**
   * Function to determine if a request should skip rate limiting.
   * @default undefined (no requests are skipped)
   */
  skip?: (c: Context) => boolean
}
