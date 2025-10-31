import type { Context } from 'hono'

import { getAccessCookie } from '@/net/http/cookie'

/**
 * Extracts authentication token from either Authorization header or cookie.
 * @param c Hono context object.
 * @returns The extracted token or null if not found.
 */
const extractToken = (c: Context): string | null => {
  // First, try to get token from Authorization header
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    const parts = authHeader.split(' ')
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1]
    }
  }

  // If no Authorization header, try to get token from cookie
  const cookieToken = getAccessCookie(c)
  if (cookieToken) {
    return cookieToken
  }

  return null
}

export default extractToken
