import { z } from 'zod'

import { requestValidationRules as rules } from '../../@shared'

const resetPasswordSchema = z.object({
  data: z.object({
    token: rules.data.securityToken,
    password: rules.data.password,
  }).strict(),
}).strict()

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>

export default resetPasswordSchema
