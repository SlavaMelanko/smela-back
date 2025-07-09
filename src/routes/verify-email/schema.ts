import { z } from 'zod'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export { verifyEmailSchema }
