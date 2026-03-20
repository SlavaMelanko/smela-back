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
 * const lastActiveSq = lastActiveSubquery(executor)
 * executor.select({ lastActive: lastActiveSq.lastActive })
 *   .from(usersTable)
 *   .leftJoin(lastActiveSq, eq(usersTable.id, lastActiveSq.userId))
 */
export const lastActiveSubquery = (executor: Database) =>
  executor
    .select({
      userId: refreshTokensTable.userId,
      lastActive: max(refreshTokensTable.createdAt).as('last_active'),
    })
    .from(refreshTokensTable)
    .groupBy(refreshTokensTable.userId)
    .as('last_active_subquery')

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
