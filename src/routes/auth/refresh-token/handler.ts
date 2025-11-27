import type { Context } from 'hono'

import { getDeviceInfo, getRefreshCookie, HttpStatus, setRefreshCookie } from '@/net/http'
import { refreshAuthTokens } from '@/use-cases/auth'

const refreshTokenHandler = async (c: Context) => {
  const refreshToken = getRefreshCookie(c)
  const deviceInfo = getDeviceInfo(c)

  const result = await refreshAuthTokens(refreshToken, deviceInfo)

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}

export default refreshTokenHandler
