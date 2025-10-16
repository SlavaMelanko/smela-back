import type { Context } from 'hono'

import { setAccessCookie } from '@/net/http'
import HttpStatus from '@/types/http-status'

import type { LoginBody } from './schema'

import logInWithEmail from './login'

const loginHandler = async (c: Context) => {
  const { email, password } = await c.req.json<LoginBody>()

  const result = await logInWithEmail({ email, password })

  // Set cookie for web browser clients
  setAccessCookie(c, result.token)

  // Return user and token in response body for CLI/mobile clients (same as signup)
  return c.json(result, HttpStatus.OK)
}

export default loginHandler
