import { z } from 'zod'

import { tokenRules, userRules } from '@/lib/validation'

const loginSchema = z.object({
  email: userRules.email,
  password: userRules.password,
  captchaToken: tokenRules.captchaToken,
}).strict()

export type LoginBody = z.infer<typeof loginSchema>

export default loginSchema
