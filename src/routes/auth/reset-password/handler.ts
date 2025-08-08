import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import resetPassword from './reset-password'

const resetPasswordHandler = async (c: Context) => {
  const { token, password } = await c.req.json()

  const result = await resetPassword({ token, password })

  return c.json(result, StatusCodes.OK)
}

export default resetPasswordHandler
