import type { InferType } from '@/lib/validation'

import { buildStrictSchema, tokenRules, userRules } from '@/lib/validation'

const resetPasswordSchema = buildStrictSchema({
  token: tokenRules.token,
  password: userRules.password,
})

export type ResetPasswordBody = InferType<typeof resetPasswordSchema>

export default resetPasswordSchema
