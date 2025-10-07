import type { InferType } from '@/lib/validation'

import { buildStrictSchema, tokenRules } from '@/lib/validation'

const verifyEmailSchema = buildStrictSchema({
  token: tokenRules.token,
})

export type VerifyEmailBody = InferType<typeof verifyEmailSchema>

export default verifyEmailSchema
