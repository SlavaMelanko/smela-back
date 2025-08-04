import type { Context, MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/types/context'

import { getAuthCookie, jwt } from '@/lib/auth'
import { AppError, ErrorCode } from '@/lib/catch'
import { userRepo } from '@/repositories'
import { isActive } from '@/types'

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
  const cookieToken = getAuthCookie(c)
  if (cookieToken) {
    return cookieToken
  }

  return null
}

/**
 * Dual authentication middleware that supports both Bearer token and cookie authentication:
 * - For API/CLI/Mobile: Use Authorization: Bearer <token>
 * - For Browser: Use cookie (automatically set on login)
 */
const dualAuthMiddleware: MiddlewareHandler<AppContext> = createMiddleware<AppContext>(async (c, next) => {
  const token = extractToken(c)

  if (!token) {
    throw new AppError(ErrorCode.Unauthorized, 'No authentication token provided')
  }

  try {
    const payload = await jwt.verify(token)

    if (!isActive(payload.status)) {
      throw new AppError(ErrorCode.Forbidden, 'Account is not active')
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

export default dualAuthMiddleware
