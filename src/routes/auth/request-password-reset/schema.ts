import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const requestPasswordResetSchema = z.object({
  email: rules.user.email,
  captcha: z.object({
    token: rules.captcha.token,
  }).strict(),
  preferences: z.object({
    locale: rules.preferences.locale,
    theme: rules.preferences.theme,
  }).optional(),
}).strict()

export type RequestPasswordResetBody = z.infer<typeof requestPasswordResetSchema>
export type RequestPasswordResetCtx = ValidatedJsonCtx<RequestPasswordResetBody>
