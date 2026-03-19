import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import { signUpWithEmail } from '@/use-cases/auth/signup'

import type { SignupCtx } from './schema'

export const signupHandler = async (c: SignupCtx) => {
  const { firstName, lastName, email, password, preferences } = c.req.valid('json')
  const deviceInfo = getDeviceInfo(c)

  const result = await signUpWithEmail(
    { firstName, lastName, email, password },
    deviceInfo,
    preferences,
  )

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.CREATED)
}
