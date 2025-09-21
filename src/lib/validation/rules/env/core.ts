import { z } from 'zod'

const rules = {
  nodeEnv: z.enum(['development', 'production', 'staging', 'test']).default('development'),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
}

export default rules
