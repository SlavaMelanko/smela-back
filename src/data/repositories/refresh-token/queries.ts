import { and, count, eq, gt, isNull, max } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { RefreshToken } from './types'

import { db } from '../../clients'
import { refreshTokensTable } from '../../schema'

export const lastActiveAtSubquery = (executor: Database) =>
  executor
    .select({
      userId: refreshTokensTable.userId,
      lastActiveAt: max(refreshTokensTable.createdAt).as('last_active_at'),
    })
    .from(refreshTokensTable)
    .groupBy(refreshTokensTable.userId)
    .as('last_active')

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
  userId: string,
  tx?: Database,
): Promise<RefreshToken[]> => {
  const executor = tx || db

  return executor
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.userId, userId),
        isNull(refreshTokensTable.revokedAt),
        gt(refreshTokensTable.expiresAt, new Date()),
      ),
    )
}

export const countActiveByUserId = async (
  userId: string,
  tx?: Database,
): Promise<number> => {
  const executor = tx || db

  const [result] = await executor
    .select({ count: count() })
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.userId, userId),
        isNull(refreshTokensTable.revokedAt),
        gt(refreshTokensTable.expiresAt, new Date()),
      ),
    )

  return result?.count || 0
}
