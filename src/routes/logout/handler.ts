import type { Context } from 'hono'

import { deleteCookie } from 'hono/cookie'
import { StatusCodes } from 'http-status-codes'

import env from '@/lib/env'

const logoutHandler = async (c: Context) => {
  // Clear the authentication cookie
  deleteCookie(c, env.JWT_COOKIE_NAME, {
    path: '/',
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  })

  return c.json({ message: 'Logged out successfully' }, StatusCodes.OK)
}

export default logoutHandler
