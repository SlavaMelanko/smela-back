import type { Context } from 'hono'

/**
 * Extracts the client IP address from request headers.
 *
 * Tries various headers in order of preference:
 * 1. X-Forwarded-For (takes first IP if multiple)
 * 2. X-Real-IP
 * 3. CF-Connecting-IP (Cloudflare)
 *
 * @param c - Hono context object
 * @returns Client IP address or 'unknown-ip' if no IP found
 */
export const getClientIp = (c: Context): string => {
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
