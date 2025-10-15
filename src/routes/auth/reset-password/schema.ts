import { z } from 'zod'

import { tokenRules, userRules } from '@/lib/validation'

const resetPasswordSchema = z.object({
  token: tokenRules.token,
  password: userRules.password,
}).strict()

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>

export default resetPasswordSchema
