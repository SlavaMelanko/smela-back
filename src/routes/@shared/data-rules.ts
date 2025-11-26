import { z } from 'zod'

import { PASSWORD_REGEX } from '@/security/password'
import { TOKEN_LENGTH } from '@/security/token'
import { Role } from '@/types'

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

export const dataRules = {
  email: z
    .string()
    .transform(normalizeEmail)
    .refine(email => z.string().email().safeParse(email).success, {
      message: 'Invalid email',
    }),

  password: z
    .string()
    .min(8)
    .regex(PASSWORD_REGEX, {
      message:
        'Minimum eight characters, at least one letter, one number and one special character',
    }),

  name: z.string().min(2).max(50),

  optionalName: z.string().min(2).max(50).nullable().optional().transform((val) => {
    return val === null ? undefined : val
  }),

  role: z.nativeEnum(Role),

  securityToken: z.string().length(
    TOKEN_LENGTH,
    `Token must be exactly ${TOKEN_LENGTH} characters long`,
  ),
}
