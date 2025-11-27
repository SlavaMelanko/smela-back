import type { Context } from 'hono'

import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import signUpWithEmail from '@/use-cases/auth/signup'

import type { SignupBody } from './schema'

const signupHandler = async (c: Context) => {
  const payload = await c.req.json<SignupBody>()
  const deviceInfo = getDeviceInfo(c)

  const result = await signUpWithEmail(
    payload.data,
    deviceInfo,
    payload.preferences,
  )

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.CREATED)
}

export default signupHandler
