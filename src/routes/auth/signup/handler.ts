import type { Context } from 'hono'

import { getDeviceInfo, HttpStatus, setRefreshCookie } from '@/net/http'
import signUpWithEmail from '@/use-cases/auth/signup'

import type { SignupBody } from './schema'

const signupHandler = async (c: Context) => {
  const { firstName, lastName, email, password } = await c.req.json<SignupBody>()
  const deviceInfo = getDeviceInfo(c)

  const { data, refreshToken } = await signUpWithEmail({
    firstName,
    lastName: lastName ?? '',
    email,
    password,
    deviceInfo,
  })

  setRefreshCookie(c, refreshToken)

  return c.json(data, HttpStatus.CREATED)
}

export default signupHandler
