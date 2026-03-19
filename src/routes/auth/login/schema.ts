import { z } from 'zod'

import type { ValidatedJsonCtx } from '../../@shared'

import { nestedSchemas as nested, requestValidationRules as rules } from '../../@shared'

export const loginSchema = z.object({
  email: rules.data.email,
  password: rules.data.password,
  captcha: nested.captcha.strict(),
}).strict()

export type LoginBody = z.infer<typeof loginSchema>
export type LoginCtx = ValidatedJsonCtx<LoginBody>
