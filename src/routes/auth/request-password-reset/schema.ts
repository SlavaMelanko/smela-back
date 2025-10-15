import { z } from 'zod'

import { rules } from '@/lib/rules'

const requestPasswordResetSchema = z.object({
  email: rules.email,
  captchaToken: rules.captchaToken,
}).strict()

export type RequestPasswordResetBody = z.infer<typeof requestPasswordResetSchema>

export default requestPasswordResetSchema
