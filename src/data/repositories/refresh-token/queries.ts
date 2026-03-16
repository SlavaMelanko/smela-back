import { eq, max } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { RefreshToken } from './types'

import { db } from '../../clients'
import { refreshTokensTable } from '../../schema'

/**
 * Returns a grouped subquery with the last activity timestamp per user,
 * derived from the most recent refresh token creation.
 *
 * @example
 * const lastActive = lastActiveAtSubquery(executor)
 * executor.select({ lastActiveAt: lastActive.lastActiveAt })
 *   .from(usersTable)
 *   .leftJoin(lastActive, eq(usersTable.id, lastActive.userId))
 */
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
