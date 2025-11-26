import { z } from 'zod'

import { requestValidationRules as rules } from '../../@shared'

const verifyEmailSchema = z.object({
  token: rules.data.securityToken,
}).strict()

export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>

export default verifyEmailSchema
