import {
  cleanupExpiredTokens,
  createRefreshToken,
  revokeAllUserTokens,
  revokeByHash,
} from './mutations'
import {
  countActiveByUserId,
  findActiveByUserId,
  findByTokenHash,
} from './queries'

export * from './types'

export const refreshTokenRepo = {
  create: createRefreshToken,
  revokeByHash,
  revokeAllUserTokens,
  cleanupExpired: cleanupExpiredTokens,
  findByHash: findByTokenHash,
  findActiveByUserId,
  countActiveByUserId,
}
