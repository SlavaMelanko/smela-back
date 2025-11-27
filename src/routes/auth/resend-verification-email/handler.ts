import type { Context } from 'hono'

import { HttpStatus } from '@/net/http'
import resendVerificationEmail from '@/use-cases/auth/resend-verification-email'

import type { ResendVerificationEmailBody } from './schema'

const resendVerificationEmailHandler = async (c: Context) => {
  const payload = await c.req.json<ResendVerificationEmailBody>()

  const result = await resendVerificationEmail(payload.data, payload.preferences)

  return c.json(result.data, HttpStatus.ACCEPTED)
}

export default resendVerificationEmailHandler
