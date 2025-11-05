import type { Context } from 'hono'

import { HttpStatus, setRefreshCookie } from '@/net/http'
import signUpWithEmail from '@/use-cases/auth/signup'

import type { SignupBody } from './schema'

const signupHandler = async (c: Context) => {
  const { firstName, lastName, email, password } = await c.req.json<SignupBody>()

  const result = await signUpWithEmail({ firstName, lastName: lastName ?? '', email, password })

  setRefreshCookie(c, result.refreshToken)

  return c.json(result.data, HttpStatus.CREATED)
}

export default signupHandler
