import 'dotenv/config'

import type { ZodError } from 'zod'

import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  DB_URL: z.string().url('DB_URL must be a valid URL'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
})

export type Env = z.infer<typeof envSchema>

let env: Env

try {
  // eslint-disable-next-line node/no-process-env
  env = envSchema.parse(process.env)
}
catch (e) {
  const error = e as ZodError
  console.error('❌ Invalid env:', error.flatten().fieldErrors)
  process.exit(1)
}

const isDevEnv = () => env.NODE_ENV === 'development'
const isProdEnv = () => env.NODE_ENV === 'production'

export { env as default, isDevEnv, isProdEnv }
