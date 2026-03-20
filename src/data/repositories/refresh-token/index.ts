import {
  cleanupExpiredTokens,
  createRefreshToken,
  revokeByHash,
  revokeByUserId,
} from './mutations'
import { findByTokenHash } from './queries'

export * from './types'

export const refreshTokenRepo = {
  create: createRefreshToken,
  revokeByHash,
  revokeByUserId,
  cleanupExpired: cleanupExpiredTokens,
  findByHash: findByTokenHash,
}
