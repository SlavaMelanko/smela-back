import type { MiddlewareHandler } from 'hono'

import { bearerAuth } from 'hono/bearer-auth'
import { verify } from 'hono/jwt'

import type { Variables } from '@/types/context'

import env from '@/lib/env'

const jwtMiddleware: MiddlewareHandler<{ Variables: Variables }> = bearerAuth({
  verifyToken: async (token, c) => {
    try {
      const payload = await verify(token, env.JWT_SECRET)

      c.set('user', payload)

      return true
    }
    catch {
      return false
    }
  },
})

export default jwtMiddleware
