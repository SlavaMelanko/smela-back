import { z } from 'zod'

import type { ValidatedJsonCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

export const resetPasswordSchema = z.object({
  token: rules.data.securityToken,
  password: rules.data.password,
}).strict()

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>
export type ResetPasswordCtx = ValidatedJsonCtx<ResetPasswordBody>
