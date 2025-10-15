import type { InferType } from '@/lib/validation'

import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const signupSchema = buildSchema({
  firstName: userRules.name,
  lastName: userRules.name.nullish(),
  email: userRules.email,
  password: userRules.password,
  captchaToken: tokenRules.captchaToken,
}).strict()

export type SignupBody = InferType<typeof signupSchema>

export default signupSchema
