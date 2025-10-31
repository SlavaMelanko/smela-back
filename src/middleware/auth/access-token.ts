import type { Context } from 'hono'

const BEARER_PREFIX = 'Bearer '

/**
 * Extracts access token from Authorization header.
 * @param c Hono context object.
 * @returns The extracted token or null if not found.
 */
const extractAccessToken = (c: Context): string | null => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    return null
  }

  if (!authHeader.startsWith(BEARER_PREFIX)) {
    return null
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim()

  return token || null
}

export default extractAccessToken
