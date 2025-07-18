import 'dotenv/config'

import type { ZodError } from 'zod'

import { buildSchema, envRules } from './validation'

const validate = () => {
  try {
    const envSchema = buildSchema({
      NODE_ENV: envRules.nodeEnv,
      JWT_SECRET: envRules.jwtSecret,
      DB_URL: envRules.dbUrl,
      LOG_LEVEL: envRules.logLevel,

      // Email configuration
      BASE_URL: envRules.baseUrl,
      COMPANY_NAME: envRules.companyName,
      COMPANY_SOCIAL_LINKS: envRules.companySocialLinks,
    })

    // eslint-disable-next-line node/no-process-env
    return envSchema.parse(process.env)
  } catch (e) {
    const error = e as ZodError
    console.error('❌ Invalid env:', error.flatten().fieldErrors)
    process.exit(1)
  }
}

const env = validate()

const isDevEnv = () => env.NODE_ENV === 'development'
const isProdEnv = () => env.NODE_ENV === 'production'
const isTestEnv = () => env.NODE_ENV === 'test'
const isDevOrTestEnv = () => isDevEnv() || isTestEnv()

export { env as default, isDevEnv, isDevOrTestEnv, isProdEnv, isTestEnv }
