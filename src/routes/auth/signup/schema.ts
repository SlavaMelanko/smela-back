import { z } from 'zod'

import { dataValidationRules as rules } from '../../@shared'

const signupSchema = z.object({
  firstName: rules.name,
  lastName: rules.optionalName,
  email: rules.email,
  password: rules.password,
  captchaToken: rules.captchaToken,
}).strict()

export type SignupBody = z.infer<typeof signupSchema>

export default signupSchema
