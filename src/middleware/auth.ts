import type { MiddlewareHandler } from 'hono'

import { bearerAuth } from 'hono/bearer-auth'

import type { Status } from '@/types'
import type { AppContext } from '@/types/context'

import { AppError, ErrorCode } from '@/lib/errors'
import jwt from '@/lib/jwt'
import { userRepo } from '@/repositories'
import { isActive } from '@/types'

const jwtMiddleware: MiddlewareHandler<AppContext> = bearerAuth({
  verifyToken: async (token, c) => {
    const payload = await jwt.verify(token)

    if (!isActive(payload.status as Status)) {
      throw new AppError(ErrorCode.Forbidden)
    }

    const user = await userRepo.findById(payload.id as number)
    if (!user || user.tokenVersion !== (payload.v as number)) {
      throw new AppError(ErrorCode.Unauthorized)
    }

    c.set('user', payload)

    return true
  },
})

export default jwtMiddleware
