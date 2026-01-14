import { z } from 'zod'

import type { ValidatedJsonCtx } from '../../@shared'

import { nestedSchemas as nested, requestValidationRules as rules } from '../../@shared'

const signupSchema = z.object({
  data: z.object({
    firstName: rules.data.firstName,
    lastName: rules.data.lastName.optional(),
    email: rules.data.email,
    password: rules.data.password,
  }).strict(),
  captcha: nested.captcha.strict(),
  preferences: nested.preferences.optional(),
}).strict()

export type SignupBody = z.infer<typeof signupSchema>
export type SignupCtx = ValidatedJsonCtx<SignupBody>

export default signupSchema
