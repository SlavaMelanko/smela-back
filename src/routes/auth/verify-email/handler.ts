import type { Context } from 'hono'

import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import verifyEmail from '@/use-cases/auth/verify-email'

import type { VerifyEmailBody } from './schema'

const verifyEmailHandler = async (c: Context) => {
  const { token } = await c.req.json<VerifyEmailBody>()
  const deviceInfo = getDeviceInfo(c)

  const { data, refreshToken } = await verifyEmail({ token, deviceInfo })

  setRefreshCookie(c, refreshToken)

  return c.json(data, HttpStatus.OK)
}

export default verifyEmailHandler
