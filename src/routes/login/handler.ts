import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import { setAuthCookie } from '@/lib/auth'

import logInWithEmail from './login'

const loginHandler = async (c: Context) => {
  const { email, password } = await c.req.json()

  const token = await logInWithEmail({ email, password })

  // Set cookie for web browser clients
  setAuthCookie(c, token)

  // Return token in response body for CLI/mobile clients
  return c.json({ token }, StatusCodes.OK)
}

export default loginHandler
