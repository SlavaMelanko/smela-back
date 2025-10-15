import { z } from 'zod'

import { tokenRules, userRules } from '@/lib/validation'

const signupSchema = z.object({
  firstName: userRules.name,
  lastName: userRules.name.nullish(),
  email: userRules.email,
  password: userRules.password,
  captchaToken: tokenRules.captchaToken,
}).strict()

export type SignupBody = z.infer<typeof signupSchema>

export default signupSchema
