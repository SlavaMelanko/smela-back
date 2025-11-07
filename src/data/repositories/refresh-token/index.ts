import {
  cleanupExpiredTokens,
  createRefreshToken,
  revokeAllUserTokens,
  revokeByHash,
  revokeRefreshToken,
  updateLastUsedAt,
  updateRefreshToken,
} from './mutations'
import {
  countActiveByUserId,
  findActiveByUserId,
  findByTokenHash,
  findByUserAndHash,
} from './queries'

export * from './types'

export const refreshTokenRepo = {
  create: createRefreshToken,
  update: updateRefreshToken,
  updateLastUsedAt,
  revoke: revokeRefreshToken,
  revokeByHash,
  revokeAllUserTokens,
  cleanupExpired: cleanupExpiredTokens,
  findByTokenHash,
  findActiveByUserId,
  findByUserAndHash,
  countActiveByUserId,
}
