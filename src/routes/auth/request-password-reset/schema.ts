import type { InferType } from '@/lib/validation'

import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const requestPasswordResetSchema = buildSchema({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
}).strict()

export type RequestPasswordResetBody = InferType<typeof requestPasswordResetSchema>

export default requestPasswordResetSchema
