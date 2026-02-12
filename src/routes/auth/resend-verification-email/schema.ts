import { z } from 'zod'

import type { ValidatedJsonCtx } from '../../@shared'

import { nestedSchemas as nested, requestValidationRules as rules } from '../../@shared'

const resendVerificationEmailSchema = z.object({
  email: rules.data.email,
  captcha: nested.captcha.strict(),
  preferences: nested.preferences.optional(),
}).strict()

export type ResendVerificationEmailBody = z.infer<typeof resendVerificationEmailSchema>
export type ResendVerificationEmailCtx = ValidatedJsonCtx<ResendVerificationEmailBody>

export default resendVerificationEmailSchema
