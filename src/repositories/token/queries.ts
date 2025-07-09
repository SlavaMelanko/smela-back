import { and, desc, eq, gt, isNull } from 'drizzle-orm'

import type { SecureToken } from '@/types'

import db, { secureTokensTable } from '@/db'

import type { CreateTokenInput, TokenRecord, UpdateTokenInput } from './types'

const createToken = async (token: CreateTokenInput): Promise<number> => {
  const [createdToken] = await db
    .insert(secureTokensTable)
    .values(token)
    .returning({ id: secureTokensTable.id })

  return createdToken.id
}

const findByToken = async (token: string): Promise<TokenRecord | undefined> => {
  const [foundToken] = await db
    .select()
    .from(secureTokensTable)
    .where(
      and(
        eq(secureTokensTable.token, token),
        isNull(secureTokensTable.usedAt),
        gt(secureTokensTable.expiresAt, new Date()),
      ),
    )

  return foundToken
}

const findByUserAndType = async (
  userId: number,
  type: SecureToken,
  includeUsed = false,
): Promise<TokenRecord[]> => {
  const conditions = [
    eq(secureTokensTable.userId, userId),
    eq(secureTokensTable.type, type),
  ]

  if (!includeUsed) {
    conditions.push(isNull(secureTokensTable.usedAt))
  }

  const tokens = await db
    .select()
    .from(secureTokensTable)
    .where(and(...conditions))
    .orderBy(desc(secureTokensTable.createdAt))

  return tokens
}

const markAsUsed = async (tokenId: number): Promise<void> => {
  await db
    .update(secureTokensTable)
    .set({ usedAt: new Date() })
    .where(eq(secureTokensTable.id, tokenId))
}

const updateToken = async (
  tokenId: number,
  updates: UpdateTokenInput,
): Promise<void> => {
  await db
    .update(secureTokensTable)
    .set(updates)
    .where(eq(secureTokensTable.id, tokenId))
}

export {
  createToken,
  findByToken,
  findByUserAndType,
  markAsUsed,
  updateToken,
}
