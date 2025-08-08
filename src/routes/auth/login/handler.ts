import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import { setAuthCookie } from '@/lib/auth'

import logInWithEmail from './login'

const loginHandler = async (c: Context) => {
  const { email, password } = await c.req.json()

  const result = await logInWithEmail({ email, password })

  // Set cookie for web browser clients
  setAuthCookie(c, result.token)

  // Return user and token in response body for CLI/mobile clients (same as signup)
  return c.json(result, StatusCodes.OK)
}

export default loginHandler
