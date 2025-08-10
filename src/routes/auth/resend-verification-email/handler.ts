import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import resendVerificationEmail from './resend-verification-email'

const resendVerificationEmailHandler = async (c: Context) => {
  const { email } = await c.req.json()

  const result = await resendVerificationEmail(email)

  return c.json({ ...result }, StatusCodes.ACCEPTED)
}

export default resendVerificationEmailHandler
