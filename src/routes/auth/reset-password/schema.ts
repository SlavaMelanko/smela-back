import type { InferType } from '@/lib/validation'

import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const resetPasswordSchema = buildSchema({
  token: tokenRules.token,
  password: userRules.password,
}).strict()

export type ResetPasswordBody = InferType<typeof resetPasswordSchema>

export default resetPasswordSchema
