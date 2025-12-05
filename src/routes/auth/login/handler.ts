import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import logInWithEmail from '@/use-cases/auth/login'

import type { LoginCtx } from './schema'

const loginHandler = async (c: LoginCtx) => {
  const payload = c.req.valid('json')
  const deviceInfo = getDeviceInfo(c)

  const result = await logInWithEmail(payload.data, deviceInfo)

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}

export default loginHandler
