import {
  cleanupExpiredTokens,
  createRefreshToken,
  revokeByHash,
} from './mutations'
import { findByTokenHash } from './queries'

export * from './types'

export const refreshTokenRepo = {
  create: createRefreshToken,
  revokeByHash,
  cleanupExpired: cleanupExpiredTokens,
  findByHash: findByTokenHash,
}
