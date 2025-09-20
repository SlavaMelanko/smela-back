import type { ZodError } from 'zod'

import { buildSchema, envRules } from './validation'

const validate = () => {
  try {
    const envSchema = buildSchema({
      NODE_ENV: envRules.nodeEnv,
      JWT_SECRET: envRules.jwtSecret,
      JWT_COOKIE_NAME: envRules.jwtCookieName,
      ALLOWED_ORIGINS: envRules.allowedOrigins,
      COOKIE_DOMAIN: envRules.cookieDomain,
      DB_URL: envRules.dbUrl,
      LOG_LEVEL: envRules.logLevel,

      // Email configuration
      BE_BASE_URL: envRules.beBaseUrl,
      FE_BASE_URL: envRules.feBaseUrl,
      COMPANY_NAME: envRules.companyName,
      COMPANY_SOCIAL_LINKS: envRules.companySocialLinks,
      EMAIL_PROVIDER: envRules.emailProvider,
      EMAIL_RESEND_API_KEY: envRules.emailResendApiKey,
      EMAIL_SENDER_PROFILES: envRules.emailSenderProfiles,

      // Ethereal email configuration (for development)
      EMAIL_ETHEREAL_HOST: envRules.emailEtherealHost,
      EMAIL_ETHEREAL_PORT: envRules.emailEtherealPort,
      EMAIL_ETHEREAL_USERNAME: envRules.emailEtherealUsername,
      EMAIL_ETHEREAL_PASSWORD: envRules.emailEtherealPassword,

      // reCAPTCHA
      CAPTCHA_SECRET_KEY: envRules.captchaSecretKey,
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
const isStagingEnv = () => env.NODE_ENV === 'staging'
const isDevOrTestEnv = () => isDevEnv() || isTestEnv()
const isStagingOrProdEnv = () => isStagingEnv() || isProdEnv()

export { env as default, isDevEnv, isDevOrTestEnv, isProdEnv, isStagingEnv, isStagingOrProdEnv, isTestEnv }
