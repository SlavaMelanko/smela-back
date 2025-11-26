import { z } from 'zod'

import { requestValidationRules as rules } from '../../@shared'

const signupSchema = z.object({
  data: z.object({
    firstName: rules.data.name,
    lastName: rules.data.optionalName,
    email: rules.data.email,
    password: rules.data.password,
  }).strict(),
  captcha: z.object({
    token: rules.captcha.token,
  }).strict(),
  preferences: z.object({
    locale: rules.preferences.locale,
    theme: rules.preferences.theme,
  }).optional(),
}).strict()

export type SignupBody = z.infer<typeof signupSchema>

export default signupSchema
