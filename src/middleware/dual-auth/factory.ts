import type { MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/context'
import type { Role, Status } from '@/types'

import { userRepo } from '@/data'
import { AppError, ErrorCode } from '@/lib/catch'
import jwt from '@/lib/jwt'

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
    const payload = await jwt.verify(token)

    if (!statusValidator(payload.status)) {
      throw new AppError(ErrorCode.Forbidden, 'Status validation failure')
    }

    if (!roleValidator(payload.role)) {
      throw new AppError(ErrorCode.Forbidden, 'Role validation failure')
    }

    const user = await userRepo.findById(payload.id)
    if (!user || user.tokenVersion !== payload.v) {
      throw new AppError(ErrorCode.Unauthorized, 'Token version mismatch')
    }

    c.set('user', payload)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(ErrorCode.Unauthorized, 'Invalid authentication token')
  }

  await next()
})

export default createDualAuthMiddleware
