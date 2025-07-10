import { z } from 'zod'

import { tokenRules } from '@/lib/validation'

const verifyEmailSchema = z.object({
  token: tokenRules.token,
})

export { verifyEmailSchema }
