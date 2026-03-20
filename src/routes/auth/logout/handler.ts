import type { AppCtx } from '@/routes/validated-ctx'

import { deleteRefreshCookie, getRefreshCookie, HttpStatus } from '@/net/http'
import { logout } from '@/use-cases/auth/logout'

export const logoutHandler = async (c: AppCtx) => {
  const refreshToken = getRefreshCookie(c)

  await logout(refreshToken)

  deleteRefreshCookie(c)

  return c.body(null, HttpStatus.NO_CONTENT)
}
