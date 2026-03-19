import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const requestPasswordResetBodySchema = z.object({
  email: rules.user.email,
  captcha: z.object({
    token: rules.captcha.token,
  }).strict(),
  preferences: z.object({
    locale: rules.preferences.locale,
    theme: rules.preferences.theme,
  }).strict().optional(),
}).strict()

export type RequestPasswordResetBody = z.infer<typeof requestPasswordResetBodySchema>
export type RequestPasswordResetCtx = ValidatedJsonCtx<RequestPasswordResetBody>
