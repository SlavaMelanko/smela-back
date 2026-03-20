import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import { resetPassword } from '@/use-cases/auth/reset-password'

import type { ResetPasswordCtx } from './schema'

export const resetPasswordHandler = async (c: ResetPasswordCtx) => {
  const { token, password } = c.req.valid('json')
  const deviceInfo = getDeviceInfo(c)

  const result = await resetPassword({ token, password }, deviceInfo)

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}
