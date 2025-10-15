import { z } from 'zod'

import { PASSWORD_REGEX } from '@/security/password'
import { TOKEN_LENGTH } from '@/security/token'
import { Role } from '@/types'

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

export const dataValidationRules = {
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
      message: 'Minimum eight characters, at least one letter, one number and one special character',
    }),

  name: z.string().min(2).max(50),

  role: z.nativeEnum(Role),

  securityToken: z.string().length(
    TOKEN_LENGTH,
    `Token must be exactly ${TOKEN_LENGTH} characters long`,
  ),

  captchaToken: z.string()
    .min(1, 'reCAPTCHA token is required')
    .min(20, 'reCAPTCHA token is too short')
    .max(2000, 'reCAPTCHA token is too long')
    .regex(/^[\w-]+$/, 'reCAPTCHA token contains invalid characters'),
}
