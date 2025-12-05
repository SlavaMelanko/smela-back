import { z } from 'zod'

import type { ValidatedCtx } from '../../@shared'

import { nestedSchemas as nested, requestValidationRules as rules } from '../../@shared'

const resendVerificationEmailSchema = z.object({
  data: z.object({
    email: rules.data.email,
  }).strict(),
  captcha: nested.captcha.strict(),
  preferences: nested.preferences.optional(),
}).strict()

export type ResendVerificationEmailBody = z.infer<typeof resendVerificationEmailSchema>

export type ResendVerificationEmailCtx = ValidatedCtx<ResendVerificationEmailBody>

export default resendVerificationEmailSchema
