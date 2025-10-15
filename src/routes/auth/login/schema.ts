import { z } from 'zod'

import { rules } from '@/lib/rules'

const loginSchema = z.object({
  email: rules.email,
  password: rules.password,
  captchaToken: rules.captchaToken,
}).strict()

export type LoginBody = z.infer<typeof loginSchema>

export default loginSchema
