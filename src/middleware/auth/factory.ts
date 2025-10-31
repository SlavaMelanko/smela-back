import type { MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/context'
import type { Role, Status } from '@/types'

import env from '@/env'
import { AppError, ErrorCode } from '@/errors'
import { verifyJwt } from '@/security/jwt'

import extractAccessToken from './access-token'

/**
 * Factory function to create authentication middleware with configurable validation.
 * @param statusValidator Function to validate if user status is acceptable.
 * @param roleValidator Function to validate if user role is acceptable.
 */
const createAuthMiddleware = (
  statusValidator: (status: Status) => boolean,
  roleValidator: (role: Role) => boolean,
): MiddlewareHandler<AppContext> => createMiddleware<AppContext>(async (c, next) => {
  const accessToken = extractAccessToken(c)

  if (!accessToken) {
    throw new AppError(ErrorCode.Unauthorized, 'No authentication token provided')
  }

  try {
    const userClaims = await verifyJwt(accessToken, { secret: env.JWT_ACCESS_SECRET })

    if (!statusValidator(userClaims.status)) {
      throw new AppError(ErrorCode.Forbidden, 'Status validation failure')
    }

    if (!roleValidator(userClaims.role)) {
      throw new AppError(ErrorCode.Forbidden, 'Role validation failure')
    }

    c.set('user', userClaims)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(ErrorCode.Unauthorized, 'Invalid authentication token')
  }

  await next()
})

export default createAuthMiddleware
