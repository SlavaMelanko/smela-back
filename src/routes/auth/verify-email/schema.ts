import type { InferType } from '@/lib/validation'

import { buildSchema, tokenRules } from '@/lib/validation'

const verifyEmailSchema = buildSchema({
  token: tokenRules.token,
}).strict()

export type VerifyEmailBody = InferType<typeof verifyEmailSchema>

export default verifyEmailSchema
