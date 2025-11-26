import { z } from 'zod'

import { nestedSchemas as nested, requestValidationRules as rules } from '../../@shared'

const requestPasswordResetSchema = z.object({
  data: z.object({
    email: rules.data.email,
  }).strict(),
  captcha: nested.captcha.strict(),
  preferences: nested.preferences.optional(),
}).strict()

export type RequestPasswordResetBody = z.infer<typeof requestPasswordResetSchema>

export default requestPasswordResetSchema
