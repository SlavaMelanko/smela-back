import corsMiddleware from './cors'
import { relaxedAuthMiddleware, strictAuthMiddleware } from './dual-auth'
import loggerMiddleware from './logger'
import onError from './on-error'
import rateLimiterMiddleware, { authRateLimiter, generalRateLimiter } from './rate-limiter'

export {
  authRateLimiter,
  corsMiddleware,
  generalRateLimiter,
  loggerMiddleware,
  onError,
  rateLimiterMiddleware,
  relaxedAuthMiddleware,
  strictAuthMiddleware,
}
