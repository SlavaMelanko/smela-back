import { z } from 'zod'

import { requestValidationRules as rules } from '../../@shared'

const resendVerificationEmailSchema = z.object({
  data: z.object({
    email: rules.data.email,
  }).strict(),
  captcha: z.object({
    token: rules.captcha.token,
  }).strict(),
  preferences: z.object({
    locale: rules.preferences.locale,
    theme: rules.preferences.theme,
  }).optional(),
}).strict()

export type ResendVerificationEmailBody = z.infer<typeof resendVerificationEmailSchema>

export default resendVerificationEmailSchema
