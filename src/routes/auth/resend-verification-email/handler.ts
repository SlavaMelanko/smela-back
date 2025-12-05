import { HttpStatus } from '@/net/http'
import resendVerificationEmail from '@/use-cases/auth/resend-verification-email'

import type { ValidatedCtx } from '../../@shared'
import type { ResendVerificationEmailBody } from './schema'

const resendVerificationEmailHandler = async (c: ValidatedCtx<ResendVerificationEmailBody>) => {
  const payload = c.req.valid('json')

  const result = await resendVerificationEmail(payload.data, payload.preferences)

  return c.json(result.data, HttpStatus.ACCEPTED)
}

export default resendVerificationEmailHandler
