import { z } from 'zod'

const rules = {
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  jwtSecret: z.string().min(10),
  dbUrl: z.string().url(),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Email configuration
  baseUrl: z.string().url().default('http://localhost:3000'),
  companyName: z.string().default('The Company'),
  companyTwitterUrl: z.string().url().optional(),
  companyFacebookUrl: z.string().url().optional(),
  companyLinkedinUrl: z.string().url().optional(),
}

export default rules
