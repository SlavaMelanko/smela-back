import type { Context } from 'hono'

import { deleteRefreshCookie, getRefreshCookie, HttpStatus } from '@/net/http'
import logOut from '@/use-cases/auth/logout'

const logoutHandler = async (c: Context) => {
  const refreshToken = getRefreshCookie(c)

  if (refreshToken) {
    await logOut(refreshToken)
  }

  deleteRefreshCookie(c)

  return c.body(null, HttpStatus.NO_CONTENT)
}

export default logoutHandler
