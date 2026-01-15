import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import resetPassword from '@/use-cases/auth/reset-password'

import type { ResetPasswordCtx } from './schema'

const resetPasswordHandler = async (c: ResetPasswordCtx) => {
  const payload = c.req.valid('json')
  const deviceInfo = getDeviceInfo(c)

  const result = await resetPassword({ ...payload.data, deviceInfo })

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}

export default resetPasswordHandler
