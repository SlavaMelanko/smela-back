import type { Context } from 'hono'

import HttpStatus from '@/types/http-status'

import type { ResendVerificationEmailBody } from './schema'

import resendVerificationEmail from './resend-verification-email'

const resendVerificationEmailHandler = async (c: Context) => {
  const { email } = await c.req.json<ResendVerificationEmailBody>()

  const result = await resendVerificationEmail(email)

  return c.json(result, HttpStatus.ACCEPTED)
}

export default resendVerificationEmailHandler
