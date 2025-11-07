import type { Context } from 'hono'

import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import logInWithEmail from '@/use-cases/auth/login'

import type { LoginBody } from './schema'

const loginHandler = async (c: Context) => {
  const { email, password } = await c.req.json<LoginBody>()
  const deviceInfo = getDeviceInfo(c)

  const { data, refreshToken } = await logInWithEmail({ email, password, deviceInfo })

  setRefreshCookie(c, refreshToken)

  return c.json(data, HttpStatus.OK)
}

export default loginHandler
