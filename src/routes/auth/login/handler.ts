import type { Context } from 'hono'

import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import logInWithEmail from '@/use-cases/auth/login'

import type { LoginBody } from './schema'

const loginHandler = async (c: Context) => {
  const payload = await c.req.json<LoginBody>()
  const deviceInfo = getDeviceInfo(c)

  const result = await logInWithEmail(payload.data, deviceInfo)

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.OK)
}

export default loginHandler
