import { z } from 'zod'

import type { ValidatedCtx } from '../../@shared'

import { nestedSchemas as nested, requestValidationRules as rules } from '../../@shared'

const loginSchema = z.object({
  data: z.object({
    email: rules.data.email,
    password: rules.data.password,
  }).strict(),
  captcha: nested.captcha.strict(),
}).strict()

export type LoginBody = z.infer<typeof loginSchema>

export type LoginCtx = ValidatedCtx<LoginBody>

export default loginSchema
