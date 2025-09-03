import corsMiddleware from './cors'
import { adminAuthMiddleware, enterpriseStrictAuthMiddleware, ownerAuthMiddleware, userRelaxedAuthMiddleware, userStrictAuthMiddleware } from './dual-auth'
import loggerMiddleware from './logger'
import onError from './on-error'
import rateLimiterMiddleware, { authRateLimiter, generalRateLimiter } from './rate-limiter'
import securityHeadersMiddleware from './security-headers'
import { authRequestSizeLimiter, createRequestSizeLimiter, fileUploadSizeLimiter, generalRequestSizeLimiter } from './size-limiter'

export {
  adminAuthMiddleware,
  authRateLimiter,
  authRequestSizeLimiter,
  corsMiddleware,
  createRequestSizeLimiter,
  enterpriseStrictAuthMiddleware,
  fileUploadSizeLimiter,
  generalRateLimiter,
  generalRequestSizeLimiter,
  loggerMiddleware,
  onError,
  ownerAuthMiddleware,
  rateLimiterMiddleware,
  securityHeadersMiddleware,
  userRelaxedAuthMiddleware,
  userStrictAuthMiddleware,
}
