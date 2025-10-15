import { z } from 'zod'

import { dataValidationRules as rules } from '../../@shared'

const resendVerificationEmailSchema = z.object({
  email: rules.email,
  captchaToken: rules.captchaToken,
}).strict()

export type ResendVerificationEmailBody = z.infer<typeof resendVerificationEmailSchema>

export default resendVerificationEmailSchema
