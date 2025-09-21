import { networkRules } from '../validation'

export const networkEnv = {
  // JWT configuration.
  JWT_SECRET: networkRules.jwtSecret,
  JWT_COOKIE_NAME: networkRules.jwtCookieName,

  // CORS and domain configuration.
  ALLOWED_ORIGINS: networkRules.allowedOrigins,
  COOKIE_DOMAIN: networkRules.cookieDomain,

  // Base URLs.
  BE_BASE_URL: networkRules.beBaseUrl,
  FE_BASE_URL: networkRules.feBaseUrl,
}
