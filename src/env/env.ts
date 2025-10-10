import { z, ZodError } from 'zod'

import { companyEnvVars } from './company'
import { coreEnvVars } from './core'
import { dbEnvVars } from './db'
import { emailEnvVars } from './email'
import { createNetworkEnvVars } from './network'
import { captchaEnvVars } from './services'

export const validateEnvVars = (envVars: typeof Bun.env = Bun.env) => {
  try {
    const nodeEnv = envVars.NODE_ENV

    const envSchema = z.object({
      ...coreEnvVars,
      ...dbEnvVars,
      ...createNetworkEnvVars(nodeEnv),
      ...emailEnvVars,
      ...companyEnvVars,
      ...captchaEnvVars,
    })

    return envSchema.parse(envVars)
  } catch (error: unknown) {
    console.error(
      '❌ Failed to parse environment variables:',
      error instanceof ZodError ? error.flatten().fieldErrors : error,
    )

    process.exit(1)
  }
}

const env = validateEnvVars()

export default env
