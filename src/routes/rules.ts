import { z } from 'zod'

import { PASSWORD_REGEX } from '@/security/password'
import { TOKEN_LENGTH } from '@/security/token'
import { Role, Status } from '@/types'
import Resource from '@/types/resource'

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

export const rules = {
  user: {
    id: z.uuid(),

    email: z
      .string()
      .transform(normalizeEmail)
      .refine(email => z.email().safeParse(email).success, {
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

    role: z.enum(Role),
    status: z.enum(Status),
  },

  token: {
    oneTime: z.string().length(
      TOKEN_LENGTH,
      `Token must be exactly ${TOKEN_LENGTH} characters long`,
    ),
  },

  captcha: {
    token: z.string()
      .min(1, 'reCAPTCHA token is required')
      .min(20, 'reCAPTCHA token is too short')
      .max(2000, 'reCAPTCHA token is too long')
      .regex(/^[\w-]+$/, 'reCAPTCHA token contains invalid characters'),
  },

  pagination: {
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  },

  preferences: {
    locale: z.enum(['en', 'uk']).default('en'),
    theme: z.enum(['light', 'dark']).default('light'),
  },

  team: {
    id: z.uuid(),
    name: z.string().trim().min(1).max(255),
    website: z.url().max(255),
    description: z.string().trim().max(2000),
    position: z.string().trim().max(100),
    search: z.string().trim().max(100),
  },

  userFilter: {
    search: z.string().trim(),

    statuses: z
      .string()
      .transform(val => val.split(','))
      .pipe(z.array(z.enum(Status))),

    roles: z
      .string()
      .transform(val => val.split(','))
      .pipe(z.array(z.enum(Role))),
  },

  permissions: (() => {
    const resourcePermissions = z
      .object({
        view: z.boolean().nullish().transform(v => v ?? false),
        manage: z.boolean().nullish().transform(v => v ?? false),
      })
      .optional()

    type ResourcePermissions = typeof resourcePermissions

    return z
      .object(
        Object.fromEntries(
          Object.values(Resource).map(r => [r, resourcePermissions]),
        ) as Record<Resource, ResourcePermissions>,
      )
      .refine(
        data => Object.values(data).some(v => v !== undefined),
        { message: 'At least one resource must be specified' },
      )
  })(),
}
