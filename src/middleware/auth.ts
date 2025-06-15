import { bearerAuth } from 'hono/bearer-auth'
import { verify } from 'hono/jwt'
import type { MiddlewareHandler } from 'hono'

import type { UserPayload, Variables } from '@/types/context'

const jwtMiddleware: MiddlewareHandler<{ Variables: Variables }> = bearerAuth({
  verifyToken: async (token, c) => {
    try {
      const payload = await verify(token, Bun.env.JWT_SECRET as string)

      c.set('user', payload as UserPayload)

      return true
    } catch {
      return false
    }
  },
})

export default jwtMiddleware
