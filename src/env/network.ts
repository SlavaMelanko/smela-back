import { z } from 'zod'

export const networkEnvVars = (nodeEnv?: string) => ({
  // JWT configuration
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRATION: z.coerce.number().int().positive().default(900),
  JWT_SIGNATURE_ALGORITHM: z.enum(['HS256', 'HS512']).default('HS256'),

  // Refresh token cookie configuration
  COOKIE_REFRESH_TOKEN_NAME: z.string().default('refresh-token'),
  COOKIE_REFRESH_TOKEN_EXPIRATION: z.coerce.number().int().positive().default(86400), // 24 hours
  COOKIE_REFRESH_TOKEN_DOMAIN: z.string().optional(), // domain for cookies in production/staging

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
