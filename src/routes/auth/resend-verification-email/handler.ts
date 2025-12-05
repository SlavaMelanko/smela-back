import { HttpStatus } from '@/net/http'
import resendVerificationEmail from '@/use-cases/auth/resend-verification-email'

import type { ResendVerificationEmailCtx } from './schema'

const resendVerificationEmailHandler = async (c: ResendVerificationEmailCtx) => {
  const payload = c.req.valid('json')

  const result = await resendVerificationEmail(payload.data, payload.preferences)

  return c.json(result.data, HttpStatus.ACCEPTED)
}

export default resendVerificationEmailHandler
