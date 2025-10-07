import type { InferType } from '@/lib/validation'

import { buildStrictSchema, tokenRules, userRules } from '@/lib/validation'

const requestPasswordResetSchema = buildStrictSchema({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
})

export type RequestPasswordResetBody = InferType<typeof requestPasswordResetSchema>

export default requestPasswordResetSchema
