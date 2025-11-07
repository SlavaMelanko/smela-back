import type { Context } from 'hono'

import { HttpStatus } from '@/net/http'
import resendVerificationEmail from '@/use-cases/auth/resend-verification-email'

import type { ResendVerificationEmailBody } from './schema'

const resendVerificationEmailHandler = async (c: Context) => {
  const { email } = await c.req.json<ResendVerificationEmailBody>()

  const { data } = await resendVerificationEmail(email)

  return c.json(data, HttpStatus.ACCEPTED)
}

export default resendVerificationEmailHandler
