import { z } from 'zod'

import { dataValidationRules as rules } from '../../@shared'

const loginSchema = z.object({
  email: rules.email,
  password: rules.password,
  captchaToken: rules.captchaToken,
}).strict()

export type LoginBody = z.infer<typeof loginSchema>

export default loginSchema
