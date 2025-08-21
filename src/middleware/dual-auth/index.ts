import type { Context, MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import type { Status } from '@/types'
import type { AppContext } from '@/types/context'

import { getAuthCookie, jwt } from '@/lib/auth'
import { AppError, ErrorCode } from '@/lib/catch'
import { userRepo } from '@/repositories'
import { isActive, isNewOrActive } from '@/types'

const extractToken = (c: Context): string | null => {
  // First, try to get token from Authorization header.
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    const parts = authHeader.split(' ')
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1]
    }
  }

  // If no Authorization header, try to get token from cookie.
  const cookieToken = getAuthCookie(c)
  if (cookieToken) {
    return cookieToken
  }

  return null
}

/**
 * Factory function to create dual authentication middleware with configurable status validation.
 * @param statusValidator Function to validate if user status is acceptable.
 */
const createDualAuthMiddleware = (
  statusValidator: (status: Status) => boolean,
): MiddlewareHandler<AppContext> => createMiddleware<AppContext>(async (c, next) => {
  const token = extractToken(c)

  if (!token) {
    throw new AppError(ErrorCode.Unauthorized, 'No authentication token provided')
  }

  try {
    const payload = await jwt.verify(token)

    if (!statusValidator(payload.status)) {
      throw new AppError(ErrorCode.Forbidden)
    }

    const user = await userRepo.findById(payload.id)
    if (!user || user.tokenVersion !== payload.v) {
      throw new AppError(ErrorCode.Unauthorized, 'Invalid token')
    }

    c.set('user', payload)

    await next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(ErrorCode.Unauthorized, 'Invalid authentication token')
  }
})

/**
 * Strict authentication middleware - requires verified users only.
 * - For API/CLI/Mobile: Use Authorization: Bearer <token>.
 * - For Browser: Use cookie (automatically set on login).
 * - Requires user status to be Verified, Trial, or Active.
 */
export const strictAuthMiddleware = createDualAuthMiddleware(isActive)

/**
 * Relaxed authentication middleware - allows new users.
 * - Same authentication methods as strictAuthMiddleware.
 * - Allows users with status New, Verified, Trial, or Active.
 */
export const relaxedAuthMiddleware = createDualAuthMiddleware(isNewOrActive)
