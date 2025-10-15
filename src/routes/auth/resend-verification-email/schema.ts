import type { InferType } from '@/lib/validation'

import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const resendVerificationEmailSchema = buildSchema({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
}).strict()

export type ResendVerificationEmailBody = InferType<typeof resendVerificationEmailSchema>

export default resendVerificationEmailSchema
