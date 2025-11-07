import { and, eq, isNull, lt } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { CreateRefreshTokenInput, UpdateRefreshTokenInput } from './types'

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

export const updateRefreshToken = async (
  id: number,
  updates: UpdateRefreshTokenInput,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .update(refreshTokensTable)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(refreshTokensTable.id, id))
}

export const revokeRefreshToken = async (
  id: number,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .update(refreshTokensTable)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(refreshTokensTable.id, id))
}

export const revokeByTokenHash = async (
  tokenHash: string,
  tx?: Database,
): Promise<boolean> => {
  const executor = tx || db

  const result = await executor
    .update(refreshTokensTable)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(refreshTokensTable.tokenHash, tokenHash),
        isNull(refreshTokensTable.revokedAt),
      ),
    )
    .returning({ id: refreshTokensTable.id })

  return result.length > 0
}

export const revokeAllUserTokens = async (
  userId: number,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .update(refreshTokensTable)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(refreshTokensTable.userId, userId),
        isNull(refreshTokensTable.revokedAt),
      ),
    )
}

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

export const updateLastUsedAt = async (
  id: number,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .update(refreshTokensTable)
    .set({
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(refreshTokensTable.id, id))
}
