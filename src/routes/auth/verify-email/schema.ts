import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const verifyEmailBodySchema = z.object({
  token: rules.token.oneTime,
}).strict()

export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>
export type VerifyEmailCtx = ValidatedJsonCtx<VerifyEmailBody>
