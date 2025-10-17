import { z } from 'zod'

import { dataValidationRules as rules } from '../../@shared'

const verifyEmailSchema = z.object({
  token: rules.securityToken,
}).strict()

export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>

export default verifyEmailSchema
