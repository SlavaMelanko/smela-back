import type { AppCtx } from '@/routes/validated-ctx'

import { getDeviceInfo, getRefreshCookie, HttpStatus, setRefreshCookie } from '@/net/http'
import { refreshAuthTokens } from '@/use-cases/auth'

export const refreshTokenHandler = async (c: AppCtx) => {
  const refreshToken = getRefreshCookie(c)
  const deviceInfo = getDeviceInfo(c)

  const result = await refreshAuthTokens({ refreshToken }, deviceInfo)

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}
