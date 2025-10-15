import { z } from 'zod'

import { tokenRules, userRules } from '@/lib/validation'

const requestPasswordResetSchema = z.object({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
}).strict()

export type RequestPasswordResetBody = z.infer<typeof requestPasswordResetSchema>

export default requestPasswordResetSchema
