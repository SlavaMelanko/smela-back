import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import signUpWithEmail from '@/use-cases/auth/signup'

import type { SignupCtx } from './schema'

const signupHandler = async (c: SignupCtx) => {
  const payload = c.req.valid('json')
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
