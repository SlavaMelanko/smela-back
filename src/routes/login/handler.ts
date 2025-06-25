import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import logInWithEmail from './login'

const loginHandler = async (c: Context) => {
  const { email, password } = await c.req.json()

  const token = await logInWithEmail({ email, password })

  return c.json({ token }, StatusCodes.OK)
}

export default loginHandler
