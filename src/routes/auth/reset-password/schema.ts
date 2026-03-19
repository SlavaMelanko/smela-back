import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const resetPasswordBodySchema = z.object({
  token: rules.token.oneTime,
  password: rules.user.password,
}).strict()

export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>
export type ResetPasswordCtx = ValidatedJsonCtx<ResetPasswordBody>
