import { z } from 'zod'

import { tokenRules } from '@/lib/validation'

const verifyEmailSchema = z.object({
  token: tokenRules.token,
}).strict()

export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>

export default verifyEmailSchema
