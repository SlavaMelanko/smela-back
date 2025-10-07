import type { InferType } from '@/lib/validation'

import { buildStrictSchema, tokenRules, userRules } from '@/lib/validation'

const loginSchema = buildStrictSchema({
  email: userRules.email,
  password: userRules.password,
  captchaToken: tokenRules.captchaToken,
})

export type LoginBody = InferType<typeof loginSchema>

export default loginSchema
