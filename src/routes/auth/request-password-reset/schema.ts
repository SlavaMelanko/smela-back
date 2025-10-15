import { z } from 'zod'

import { dataValidationRules as rules } from '../../@shared'

const requestPasswordResetSchema = z.object({
  email: rules.email,
  captchaToken: rules.captchaToken,
}).strict()

export type RequestPasswordResetBody = z.infer<typeof requestPasswordResetSchema>

export default requestPasswordResetSchema
