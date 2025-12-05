import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import verifyEmail from '@/use-cases/auth/verify-email'

import type { JsonCtx } from '../../@shared'
import type { VerifyEmailBody } from './schema'

const verifyEmailHandler = async (c: JsonCtx<VerifyEmailBody>) => {
  const payload = c.req.valid('json')
  const deviceInfo = getDeviceInfo(c)

  const result = await verifyEmail(payload.data, deviceInfo)

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}

export default verifyEmailHandler
