import { networkRules } from '../validation'

export const networkEnv = {
  // JWT configuration
  JWT_ACCESS_SECRET: networkRules.jwtAccessSecret,
  JWT_ACCESS_EXPIRATION: networkRules.jwtAccessExpiration,

  // CORS and domain configuration
  COOKIE_NAME: networkRules.cookieName,
  COOKIE_EXPIRATION: networkRules.cookieExpiration,
  COOKIE_DOMAIN: networkRules.cookieDomain,
  ALLOWED_ORIGINS: networkRules.allowedOrigins,

  // Base URLs
  BE_BASE_URL: networkRules.beBaseUrl,
  FE_BASE_URL: networkRules.feBaseUrl,
}
