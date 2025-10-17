import { z } from 'zod'

import { dataValidationRules as rules } from '../../@shared'

const resetPasswordSchema = z.object({
  token: rules.securityToken,
  password: rules.password,
}).strict()

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>

export default resetPasswordSchema
