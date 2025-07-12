import type { MiddlewareHandler } from 'hono'

import { bearerAuth } from 'hono/bearer-auth'

import type { Status } from '@/types'
import type { AppContext } from '@/types/context'

import { AppError, ErrorCode } from '@/lib/errors'
import jwt from '@/lib/jwt'
import { isActive } from '@/types'

const jwtMiddleware: MiddlewareHandler<AppContext> = bearerAuth({
  verifyToken: async (token, c) => {
    try {
      const payload = await jwt.verify(token)

      if (!isActive(payload.status as Status)) {
        throw new AppError(ErrorCode.Forbidden)
      }

      c.set('user', payload)

      return true
    } catch {
      return false
    }
  },
})

export default jwtMiddleware
