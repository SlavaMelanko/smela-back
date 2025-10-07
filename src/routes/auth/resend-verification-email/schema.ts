import type { InferType } from '@/lib/validation'

import { buildStrictSchema, tokenRules, userRules } from '@/lib/validation'

const resendVerificationEmailSchema = buildStrictSchema({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
})

export type ResendVerificationEmailBody = InferType<typeof resendVerificationEmailSchema>

export default resendVerificationEmailSchema
