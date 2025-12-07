import { z } from 'zod'

import type { ValidatedJsonCtx } from '../../@shared'

import { nestedSchemas as nested, requestValidationRules as rules } from '../../@shared'

const loginSchema = z.object({
  data: z.object({
    email: rules.data.email,
    password: rules.data.password,
  }).strict(),
  captcha: nested.captcha.strict(),
}).strict()

export type LoginBody = z.infer<typeof loginSchema>

export type LoginCtx = ValidatedJsonCtx<LoginBody>

export default loginSchema
