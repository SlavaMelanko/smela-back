import { z } from 'zod'

export const coreEnvVars = {
  NODE_ENV: z.enum(['development', 'production', 'staging', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
}
