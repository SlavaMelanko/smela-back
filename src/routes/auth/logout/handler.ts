import type { Context } from 'hono'

import { deleteAccessCookie } from '@/net/http'
import HttpStatus from '@/types/http-status'

const logoutHandler = async (c: Context) => {
  deleteAccessCookie(c)

  return c.body(null, HttpStatus.NO_CONTENT)
}

export default logoutHandler
