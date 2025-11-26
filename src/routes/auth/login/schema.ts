import { z } from 'zod'

import { requestValidationRules as rules } from '../../@shared'

const loginSchema = z.object({
  data: z.object({
    email: rules.data.email,
    password: rules.data.password,
  }).strict(),
  captcha: z.object({
    token: rules.captcha.token,
  }).strict(),
}).strict()

export type LoginBody = z.infer<typeof loginSchema>

export default loginSchema
