import { z } from 'zod'

import { rules } from '@/lib/rules'

const signupSchema = z.object({
  firstName: rules.name,
  lastName: rules.name.nullish(),
  email: rules.email,
  password: rules.password,
  captchaToken: rules.captchaToken,
}).strict()

export type SignupBody = z.infer<typeof signupSchema>

export default signupSchema
