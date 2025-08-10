import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import requestPasswordReset from './request-password-reset'

const requestPasswordResetHandler = async (c: Context) => {
  const { email } = await c.req.json()

  const result = await requestPasswordReset(email)

  return c.json({ ...result }, StatusCodes.ACCEPTED)
}

export default requestPasswordResetHandler
