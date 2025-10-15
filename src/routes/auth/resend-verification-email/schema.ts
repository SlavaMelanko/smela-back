import { z } from 'zod'

import { tokenRules, userRules } from '@/lib/validation'

const resendVerificationEmailSchema = z.object({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
}).strict()

export type ResendVerificationEmailBody = z.infer<typeof resendVerificationEmailSchema>

export default resendVerificationEmailSchema
