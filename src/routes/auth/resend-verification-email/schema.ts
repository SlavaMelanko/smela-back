import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const resendVerificationEmailBodySchema = z.object({
  email: rules.user.email,
  captcha: z.object({
    token: rules.captcha.token,
  }).strict(),
  preferences: z.object({
    locale: rules.preferences.locale,
    theme: rules.preferences.theme,
  }).strict().optional(),
}).strict()

export type ResendVerificationEmailBody = z.infer<typeof resendVerificationEmailBodySchema>
export type ResendVerificationEmailCtx = ValidatedJsonCtx<ResendVerificationEmailBody>
