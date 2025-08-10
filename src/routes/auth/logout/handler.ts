import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import { deleteAuthCookie } from '@/lib/auth/cookie'

const logoutHandler = async (c: Context) => {
  deleteAuthCookie(c)

  return c.body(null, StatusCodes.NO_CONTENT)
}

export default logoutHandler
