import { and, eq, isNotNull, isNull, lt, or } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { RefreshToken } from './types'

import { db } from '../../clients'
import { refreshTokensTable } from '../../schema'

export const findByTokenHash = async (
  tokenHash: string,
  tx?: Database,
): Promise<RefreshToken | undefined> => {
  const executor = tx || db

  const [foundToken] = await executor
    .select()
    .from(refreshTokensTable)
    .where(eq(refreshTokensTable.tokenHash, tokenHash))

  return foundToken
}

export const findActiveByUserId = async (
  userId: number,
  tx?: Database,
): Promise<RefreshToken[]> => {
  const executor = tx || db

  const now = new Date()

  const tokens = await executor
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.userId, userId),
        isNull(refreshTokensTable.revokedAt),
        lt(refreshTokensTable.expiresAt, now),
      ),
    )
    .orderBy(refreshTokensTable.lastUsedAt)

  return tokens
}

export const deleteExpired = async (tx?: Database): Promise<number> => {
  const executor = tx || db

  const now = new Date()

  const result = await executor
    .delete(refreshTokensTable)
    .where(
      or(
        lt(refreshTokensTable.expiresAt, now),
        isNotNull(refreshTokensTable.revokedAt),
      ),
    )

  return result.rowCount || 0
}
