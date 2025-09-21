import { envRules } from '../validation'

export const networkEnv = {
  // JWT configuration.
  JWT_SECRET: envRules.jwtSecret,
  JWT_COOKIE_NAME: envRules.jwtCookieName,

  // CORS and domain configuration.
  ALLOWED_ORIGINS: envRules.allowedOrigins,
  COOKIE_DOMAIN: envRules.cookieDomain,

  // Base URLs.
  BE_BASE_URL: envRules.beBaseUrl,
  FE_BASE_URL: envRules.feBaseUrl,
}
