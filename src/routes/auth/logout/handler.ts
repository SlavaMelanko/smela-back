import type { Context } from 'hono'

import { deleteAccessCookie } from '@/lib/cookie'
import { HttpStatus } from '@/lib/http-status'

const logoutHandler = async (c: Context) => {
  deleteAccessCookie(c)

  return c.body(null, HttpStatus.NO_CONTENT)
}

export default logoutHandler
