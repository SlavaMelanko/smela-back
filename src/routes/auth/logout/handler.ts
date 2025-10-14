import type { Context } from 'hono'

import { deleteAccessCookie, HttpStatus } from '@/net/http'

const logoutHandler = async (c: Context) => {
  deleteAccessCookie(c)

  return c.body(null, HttpStatus.NO_CONTENT)
}

export default logoutHandler
