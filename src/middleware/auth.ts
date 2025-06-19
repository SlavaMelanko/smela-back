import type { MiddlewareHandler } from 'hono'

import { bearerAuth } from 'hono/bearer-auth'

import type { AppContext } from '@/types/context'

import jwt from '@/lib/jwt'

const jwtMiddleware: MiddlewareHandler<AppContext> = bearerAuth({
  verifyToken: async (token, c) => {
    try {
      const payload = await jwt.verify(token)

      c.set('user', payload)

      return true
    } catch {
      return false
    }
  },
})

export default jwtMiddleware
