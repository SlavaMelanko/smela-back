import { z } from 'zod'

import { secureTokenRules } from '@/lib/validation'

const verifyEmailSchema = z.object({
  token: secureTokenRules.token,
})

export { verifyEmailSchema }
