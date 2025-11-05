import { createRefreshToken, revokeAllByUserId, revokeById, updateRefreshToken } from './mutations'
import { deleteExpired, findActiveByUserId, findByTokenHash } from './queries'

export * from './types'

export const refreshTokenRepo = {
  create: createRefreshToken,
  update: updateRefreshToken,
  revokeById,
  revokeAllByUserId,
  findByTokenHash,
  findActiveByUserId,
  deleteExpired,
}
