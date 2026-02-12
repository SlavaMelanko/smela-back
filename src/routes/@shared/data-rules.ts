import { z } from 'zod'

import { PASSWORD_REGEX } from '@/security/password'
import { TOKEN_LENGTH } from '@/security/token'
import { Role } from '@/types'

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

export const dataRules = {
  id: z.string().uuid(),

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

  // Required for signup, add .optional() for updates
  firstName: z.string().trim().min(2).max(50),

  // Normalizes null/'' → "", valid string → trimmed
  // undefined means "don't touch the field"
  lastName: z.preprocess(
    val => (val === null || val === '') ? '' : val,
    z.union([z.literal(''), z.string().trim().min(2).max(50)]),
  ),

  role: z.nativeEnum(Role),

  securityToken: z.string().length(
    TOKEN_LENGTH,
    `Token must be exactly ${TOKEN_LENGTH} characters long`,
  ),
}
