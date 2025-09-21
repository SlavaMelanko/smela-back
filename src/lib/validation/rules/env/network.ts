import { z } from 'zod'

const rules = {
  jwtSecret: z.string().min(10),
  jwtCookieName: z.string().default('auth-token'),
  // CORS: Required for staging/production, optional for dev/test
  allowedOrigins: z.string().optional().superRefine((val, ctx) => {
    // eslint-disable-next-line node/no-process-env
    const nodeEnv = process.env.NODE_ENV
    // Required for staging and production (must have non-empty value)
    if ((nodeEnv === 'staging' || nodeEnv === 'production') && (!val || val.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ALLOWED_ORIGINS is required for staging/production environments',
      })
    }
  }),
  cookieDomain: z.string().optional(), // domain for cookies in production
  beBaseUrl: z.string().url().default('http://localhost:3000'),
  feBaseUrl: z.string().url().default('http://localhost:5173'),
}

export default rules
