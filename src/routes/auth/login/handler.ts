import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import { logInWithEmail } from '@/use-cases/auth/login'

import type { LoginCtx } from './schema'

export const loginHandler = async (c: LoginCtx) => {
  const { email, password } = c.req.valid('json')
  const deviceInfo = getDeviceInfo(c)

  const result = await logInWithEmail({ email, password }, deviceInfo)

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}
