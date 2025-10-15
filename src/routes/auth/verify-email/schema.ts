import { z } from 'zod'

import { rules } from '@/lib/rules'

const verifyEmailSchema = z.object({
  token: rules.securityToken,
}).strict()

export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>

export default verifyEmailSchema
