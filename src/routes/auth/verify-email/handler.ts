import type { Context } from 'hono'

import { HttpStatus, setRefreshCookie } from '@/net/http'
import { getDeviceInfo } from '@/net/http/device'
import verifyEmail from '@/use-cases/auth/verify-email'

import type { VerifyEmailBody } from './schema'

const verifyEmailHandler = async (c: Context) => {
  const payload = await c.req.json<VerifyEmailBody>()
  const deviceInfo = getDeviceInfo(c)

  const result = await verifyEmail(payload.data, deviceInfo)

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}

export default verifyEmailHandler
