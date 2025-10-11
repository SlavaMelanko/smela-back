import { z } from 'zod'

export const createNetworkEnvVars = (nodeEnv?: string) => ({
  // JWT configuration
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRATION: z.coerce.number().int().positive().default(3600),
  JWT_ACCESS_SIGNATURE_ALGORITHM: z.enum(['HS256', 'HS512']).default('HS256'),

  // CORS and domain configuration
  COOKIE_NAME: z.string().default('access-token'),
  COOKIE_EXPIRATION: z.coerce.number().int().positive().default(3600),
  COOKIE_DOMAIN: z.string().optional(), // domain for cookies in production
  // CORS: Required for staging/production, optional for dev/test
  ALLOWED_ORIGINS: z.string().optional().superRefine((val, ctx) => {
    if ((nodeEnv === 'staging' || nodeEnv === 'production') && (!val || val.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ALLOWED_ORIGINS is required for staging/production environments',
      })
    }
  }),

  // Base URLs
  BE_BASE_URL: z.string().url().default('http://localhost:3000'),
  FE_BASE_URL: z.string().url().default('http://localhost:5173'),
})
