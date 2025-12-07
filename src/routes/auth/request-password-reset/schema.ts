import { z } from 'zod'

import type { ValidatedJsonCtx } from '../../@shared'

import { nestedSchemas as nested, requestValidationRules as rules } from '../../@shared'

const requestPasswordResetSchema = z.object({
  data: z.object({
    email: rules.data.email,
  }).strict(),
  captcha: nested.captcha.strict(),
  preferences: nested.preferences.optional(),
}).strict()

export type RequestPasswordResetBody = z.infer<typeof requestPasswordResetSchema>

export type RequestPasswordResetCtx = ValidatedJsonCtx<RequestPasswordResetBody>

export default requestPasswordResetSchema
