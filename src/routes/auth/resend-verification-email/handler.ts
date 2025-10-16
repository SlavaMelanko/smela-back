import type { Context } from 'hono'

import HttpStatus from '@/types/http-status'
import resendVerificationEmail from '@/use-cases/auth/resend-verification-email'

import type { ResendVerificationEmailBody } from './schema'

const resendVerificationEmailHandler = async (c: Context) => {
  const { email } = await c.req.json<ResendVerificationEmailBody>()

  const result = await resendVerificationEmail(email)

  return c.json(result, HttpStatus.ACCEPTED)
}

export default resendVerificationEmailHandler
