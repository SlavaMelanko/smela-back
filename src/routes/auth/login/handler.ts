import type { Context } from 'hono'

import { HttpStatus, setAccessCookie } from '@/net/http'
import logInWithEmail from '@/use-cases/auth/login'

import type { LoginBody } from './schema'

const loginHandler = async (c: Context) => {
  const { email, password } = await c.req.json<LoginBody>()

  const { data, accessToken } = await logInWithEmail({ email, password })

  setAccessCookie(c, accessToken)

  return c.json(data, HttpStatus.OK)
}

export default loginHandler
