import { z } from 'zod'

const rules = {
  // General
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Authentication
  jwtSecret: z.string().min(10),

  // Database
  dbUrl: z.string().url(),

  // Email
  baseUrl: z.string().url().default('http://localhost:3000'),
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
}

export default rules
