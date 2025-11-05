import { and, eq, isNull } from 'drizzle-orm'

import { AppError, ErrorCode } from '@/errors'

import type { Database } from '../../clients'
import type { CreateRefreshTokenInput, RefreshToken, UpdateRefreshTokenInput } from './types'

import { db } from '../../clients'
import { refreshTokensTable } from '../../schema'

export const createRefreshToken = async (
  input: CreateRefreshTokenInput,
  tx?: Database,
): Promise<RefreshToken> => {
  const executor = tx || db

  const [createdToken] = await executor
    .insert(refreshTokensTable)
    .values(input)
    .returning()

  if (!createdToken) {
    throw new AppError(ErrorCode.InternalError, 'Failed to create refresh token')
  }

  return createdToken
}

export const updateRefreshToken = async (
  id: number,
  updates: UpdateRefreshTokenInput,
  tx?: Database,
): Promise<RefreshToken> => {
  const executor = tx || db

  const [updatedToken] = await executor
    .update(refreshTokensTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(refreshTokensTable.id, id))
    .returning()

  if (!updatedToken) {
    throw new AppError(ErrorCode.InternalError, 'Failed to update refresh token')
  }

  return updatedToken
}

export const revokeById = async (id: number, tx?: Database): Promise<void> => {
  const executor = tx || db

  await executor
    .update(refreshTokensTable)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(refreshTokensTable.id, id))
}

export const revokeAllByUserId = async (userId: number, tx?: Database): Promise<void> => {
  const executor = tx || db

  await executor
    .update(refreshTokensTable)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(refreshTokensTable.userId, userId),
        isNull(refreshTokensTable.revokedAt),
      ),
    )
}
