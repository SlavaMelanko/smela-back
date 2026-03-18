import { and, eq, isNull, lt, ne } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { CreateRefreshTokenInput } from './types'

import { db } from '../../clients'
import { refreshTokensTable } from '../../schema'

export const createRefreshToken = async (
  token: CreateRefreshTokenInput,
  tx?: Database,
): Promise<number> => {
  const executor = tx || db

  const [createdToken] = await executor
    .insert(refreshTokensTable)
    .values(token)
    .returning({ id: refreshTokensTable.id })

  return createdToken.id
}

export const revokeByHash = async (
  hash: string,
  tx?: Database,
): Promise<boolean> => {
  const executor = tx || db

  const result = await executor
    .update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokensTable.tokenHash, hash),
        isNull(refreshTokensTable.revokedAt),
      ),
    )
    .returning({ id: refreshTokensTable.id })

  return result.length > 0
}

/**
 * @param userId - the user whose tokens to revoke
 * @param excludeHash - token hash to exclude from revocation,
 *   used to preserve the current session on updating password
 * @param tx - optional transaction
 */
export const revokeByUserId = async (
  userId: string,
  excludeHash?: string,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokensTable.userId, userId),
        isNull(refreshTokensTable.revokedAt),
        ...(excludeHash ? [ne(refreshTokensTable.tokenHash, excludeHash)] : []),
      ),
    )
}

// Scheduled cleanup job — see https://github.com/SlavaMelanko/smela-back/issues/118
export const cleanupExpiredTokens = async (
  tx?: Database,
): Promise<number> => {
  const executor = tx || db

  const result = await executor
    .delete(refreshTokensTable)
    .where(
      and(
        lt(refreshTokensTable.expiresAt, new Date()),
        isNull(refreshTokensTable.revokedAt),
      ),
    )
    .returning({ id: refreshTokensTable.id })

  return result.length
}
