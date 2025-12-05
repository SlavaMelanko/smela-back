import { z } from 'zod'

import type { ValidatedCtx } from '../../@shared'

import { requestValidationRules as rules } from '../../@shared'

const resetPasswordSchema = z.object({
  data: z.object({
    token: rules.data.securityToken,
    password: rules.data.password,
  }).strict(),
}).strict()

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>

export type ResetPasswordCtx = ValidatedCtx<ResetPasswordBody>

export default resetPasswordSchema
