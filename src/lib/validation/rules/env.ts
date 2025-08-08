import { z } from 'zod'

const rules = {
  // General
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Authentication
  jwtSecret: z.string().min(10),
  jwtCookieName: z.string().default('auth-token'),
  allowedOrigins: z.string().optional(), // Comma-separated list of allowed origins for CORS
  cookieDomain: z.string().optional(), // Domain for cookies in production

  // Database
  dbUrl: z.string().url(),

  // Email and URLs
  beBaseUrl: z.string().url().default('http://localhost:3000'),
  feBaseUrl: z.string().url().default('http://localhost:5173'),
  companyName: z.string().default('The Company'),
  companySocialLinks: z.string().optional().transform((str) => {
    if (!str)
      return {}

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
}

export default rules
