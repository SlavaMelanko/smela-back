import { z } from 'zod'

import { rules } from '@/lib/rules'

const resetPasswordSchema = z.object({
  token: rules.securityToken,
  password: rules.password,
}).strict()

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>

export default resetPasswordSchema
