import { z } from 'zod'

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Z\d@$!%*#?&]{8,}$/i

const rules = {
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(PASSWORD_REGEX, {
      message: 'Minimum eight characters, at least one letter, one number and one special character',
    }),
  name: z.string().min(2).max(50),
}

export default rules
