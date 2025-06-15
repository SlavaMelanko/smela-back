import { z } from 'zod'

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(PASSWORD_REGEX, {
    message: 'Minimum eight characters, at least one letter, one number and one special character',
  }),
})

export { loginSchema }
