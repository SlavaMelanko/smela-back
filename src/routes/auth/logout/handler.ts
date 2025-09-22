import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import { deleteAccessCookie } from '@/lib/auth'

const logoutHandler = async (c: Context) => {
  deleteAccessCookie(c)

  return c.body(null, StatusCodes.NO_CONTENT)
}

export default logoutHandler
