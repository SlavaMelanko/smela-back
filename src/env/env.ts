import { config } from 'dotenv'
import { z, ZodError } from 'zod'

import { companyEnvVars } from './company'
import { coreEnvVars } from './core'
import { createDbUrl, dbEnvVars } from './db'
import { emailEnvVars } from './email'
import { createNetworkEnvVars } from './network'
import { captchaEnvVars } from './services'

// Load env vars for Drizzle Kit (runs under Node.js, not Bun)
// eslint-disable-next-line node/no-process-env
const nodeEnv = process.env.NODE_ENV || 'development'
config({ path: `.env.${nodeEnv}` })

// eslint-disable-next-line node/no-process-env
export const validateEnvVars = (envVars: NodeJS.ProcessEnv = process.env) => {
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

    const parsedEnv = envSchema.parse(envVars)

    // Construct POSTGRES_URL from individual POSTGRES_* variables
    const POSTGRES_URL = createDbUrl(
      parsedEnv.POSTGRES_USER,
      parsedEnv.POSTGRES_PASSWORD,
      parsedEnv.POSTGRES_HOST,
      parsedEnv.POSTGRES_PORT,
      parsedEnv.POSTGRES_DB,
    )

    return {
      ...parsedEnv,
      POSTGRES_URL,
    }
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
