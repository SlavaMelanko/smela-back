import { HttpStatus } from '@/net/http'
import { resendVerificationEmail } from '@/use-cases/auth/resend-verification-email'

import type { ResendVerificationEmailCtx } from './schema'

export const resendVerificationEmailHandler = async (c: ResendVerificationEmailCtx) => {
  const { email, preferences } = c.req.valid('json')

  const result = await resendVerificationEmail({ email }, preferences)

  return c.json(result, HttpStatus.ACCEPTED)
}
