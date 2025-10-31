import type { Context } from 'hono'

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

  const parts = authHeader.split(' ')

  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1]
  }

  return null
}

export default extractAccessToken
