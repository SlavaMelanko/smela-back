import type { Context } from 'hono'

import { getDeviceInfo, getRefreshCookie, HttpStatus, setRefreshCookie } from '@/net/http'
import { refreshAuthTokens } from '@/use-cases/auth'

const refreshTokenHandler = async (c: Context) => {
  const refreshToken = getRefreshCookie(c)
  const deviceInfo = getDeviceInfo(c)

  const { data, refreshToken: newRefreshToken } = await refreshAuthTokens({
    refreshToken,
    deviceInfo,
  })

  setRefreshCookie(c, newRefreshToken)

  return c.json(data, HttpStatus.OK)
}

export default refreshTokenHandler
