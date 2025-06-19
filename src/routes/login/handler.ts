import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import logIn from './login'

const loginHandler = async (c: Context) => {
  const { email, password } = await c.req.json()

  const token = await logIn({ email, password })

  return c.json({ token }, StatusCodes.OK)
}

export default loginHandler
