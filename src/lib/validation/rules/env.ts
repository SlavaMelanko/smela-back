import { z } from 'zod'

const rules = {
  // General
  nodeEnv: z.enum(['development', 'production', 'staging', 'test']).default('development'),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Authentication
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
        message: 'ALLOWED_ORIGINS is required and must not be empty for staging and production environments',
      })
    }
  }),
  cookieDomain: z.string().optional(), // Domain for cookies in production

  // Database
  dbUrl: z.string().url(),

  // Email and URLs
  beBaseUrl: z.string().url().default('http://localhost:3000'),
  feBaseUrl: z.string().url().default('http://localhost:5173'),
  companyName: z.string().default('The Company'),
  companySocialLinks: z.string().optional().transform((str) => {
    if (!str) {
      return {}
    }

    try {
      const parsed = JSON.parse(str)

      return z.record(z.string(), z.string().url()).parse(parsed)
    } catch {
      return {}
    }
  }),
  emailResendApiKey: z.string().optional(),
  emailSenderProfiles: z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str)
      const profileSchema = z.record(z.string(), z.object({
        email: z.string().email(),
        name: z.string(),
      }))

      return profileSchema.parse(parsed)
    } catch {
      throw new Error('Invalid EMAIL_SENDER_PROFILES format. Expected valid JSON with profile objects.')
    }
  }),

  // Email provider configuration
  emailProvider: z.enum(['resend', 'ethereal']).optional(),

  // Ethereal email configuration (for development)
  emailEtherealHost: z.string().optional(),
  emailEtherealPort: z.coerce.number().optional(),
  emailEtherealUsername: z.string().optional(),
  emailEtherealPassword: z.string().optional(),
}

export default rules
