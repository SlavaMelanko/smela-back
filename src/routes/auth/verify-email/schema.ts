import { z } from 'zod'

import type { ValidatedJsonCtx } from '@/routes/validated-ctx'

import { requestValidationRules as rules } from '../../@shared'

export const verifyEmailSchema = z.object({
  token: rules.data.securityToken,
}).strict()

export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>
export type VerifyEmailCtx = ValidatedJsonCtx<VerifyEmailBody>
