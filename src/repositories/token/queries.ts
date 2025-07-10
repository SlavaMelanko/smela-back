import { and, eq, isNull } from 'drizzle-orm'

import db, { tokensTable } from '@/db'
import { TokenStatus } from '@/types'

import type { CreateTokenInput, TokenRecord, UpdateTokenInput } from './types'

const createToken = async (token: CreateTokenInput): Promise<number> => {
  // Deprecate all existing unused tokens for the same user and type
  await db
    .update(tokensTable)
    .set({ status: TokenStatus.Deprecated })
    .where(
      and(
        eq(tokensTable.userId, token.userId),
        eq(tokensTable.type, token.type),
        isNull(tokensTable.usedAt),
        eq(tokensTable.status, TokenStatus.Pending),
      ),
    )

  // Create the new token
  const [createdToken] = await db
    .insert(tokensTable)
    .values({
      ...token,
      status: token.status || TokenStatus.Pending,
    })
    .returning({ id: tokensTable.id })

  return createdToken.id
}

const findByToken = async (token: string): Promise<TokenRecord | undefined> => {
  const [foundToken] = await db
    .select()
    .from(tokensTable)
    .where(
      eq(tokensTable.token, token),
    )

  return foundToken
}

const updateToken = async (
  tokenId: number,
  updates: UpdateTokenInput,
): Promise<void> => {
  await db
    .update(tokensTable)
    .set(updates)
    .where(eq(tokensTable.id, tokenId))
}

export {
  createToken,
  findByToken,
  updateToken,
}
