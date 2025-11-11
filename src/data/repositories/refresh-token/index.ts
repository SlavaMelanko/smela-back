import {
  cleanupExpiredTokens,
  createRefreshToken,
  revokeAllUserTokens,
  revokeByHash,
  revokeRefreshToken,
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
  revoke: revokeRefreshToken,
  revokeByHash,
  revokeAllUserTokens,
  cleanupExpired: cleanupExpiredTokens,
  findByTokenHash,
  findActiveByUserId,
  findByUserAndHash,
  countActiveByUserId,
}
