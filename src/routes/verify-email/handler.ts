import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import verifyEmail from './verify-email'

const verifyEmailHandler = async (c: Context) => {
  const { token } = c.req.query()

  const { status } = await verifyEmail(token)

  return c.json({ status }, StatusCodes.OK)
}

export default verifyEmailHandler
