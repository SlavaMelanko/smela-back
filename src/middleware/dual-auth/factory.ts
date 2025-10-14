import type { MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/context'
import type { Role, Status } from '@/types'

import { userRepo } from '@/data'
import env from '@/env'
import { AppError, ErrorCode } from '@/errors'
import { verifyJwt } from '@/security/jwt'

import extractToken from './token'

/**
 * Factory function to create dual authentication middleware with configurable validation.
 * @param statusValidator Function to validate if user status is acceptable.
 * @param roleValidator Function to validate if user role is acceptable.
 */
const createDualAuthMiddleware = (
  statusValidator: (status: Status) => boolean,
  roleValidator: (role: Role) => boolean,
): MiddlewareHandler<AppContext> => createMiddleware<AppContext>(async (c, next) => {
  const token = extractToken(c)

  if (!token) {
    throw new AppError(ErrorCode.Unauthorized, 'No authentication token provided')
  }

  try {
    const userClaims = await verifyJwt(token, { secret: env.JWT_ACCESS_SECRET })

    if (!statusValidator(userClaims.status)) {
      throw new AppError(ErrorCode.Forbidden, 'Status validation failure')
    }

    if (!roleValidator(userClaims.role)) {
      throw new AppError(ErrorCode.Forbidden, 'Role validation failure')
    }

    const user = await userRepo.findById(userClaims.id)
    if (!user || user.tokenVersion !== userClaims.tokenVersion) {
      throw new AppError(ErrorCode.Unauthorized, 'Token version mismatch')
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

export default createDualAuthMiddleware
