import { z } from 'zod'

import { Role } from '@/types'

import { withVariants } from '../with-variants'

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Z\d@$!%*#?&]{8,}$/i

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const rules = {
  email: withVariants(
    z
      .string()
      .transform(normalizeEmail)
      .refine(email => z.string().email().safeParse(email).success, {
        message: 'Invalid email',
      }),
  ),
  password: withVariants(
    z
      .string()
      .min(8)
      .regex(PASSWORD_REGEX, {
        message: 'Minimum eight characters, at least one letter, one number and one special character',
      }),
  ),
  name: withVariants(z.string().min(2).max(50)),
  role: z.nativeEnum(Role),
}

export default rules
