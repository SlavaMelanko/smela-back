import { z } from 'zod'

const rules = {
  nodeEnv: z.enum(['development', 'production']).default('development'),
  jwtSecret: z.string().min(10),
  dbUrl: z.string().url(),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
}

export default rules
