import type { Context } from 'hono'

import { HttpStatus } from '@/lib/http-status'

import resendVerificationEmail from './resend-verification-email'

const resendVerificationEmailHandler = async (c: Context) => {
  const { email } = await c.req.json()

  const result = await resendVerificationEmail(email)

  return c.json(result, HttpStatus.ACCEPTED)
}

export default resendVerificationEmailHandler
