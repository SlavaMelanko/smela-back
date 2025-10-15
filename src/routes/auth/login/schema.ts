import type { InferType } from '@/lib/validation'

import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const loginSchema = buildSchema({
  email: userRules.email,
  password: userRules.password,
  captchaToken: tokenRules.captchaToken,
}).strict()

export type LoginBody = InferType<typeof loginSchema>

export default loginSchema
