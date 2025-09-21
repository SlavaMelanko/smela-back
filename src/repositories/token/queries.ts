import { and, eq, isNull } from 'drizzle-orm'

import type { Token } from '@/types'

import db, { tokensTable } from '@/db'
import { TokenStatus } from '@/types'

import type { CreateTokenInput, TokenRecord, UpdateTokenInput } from './types'

export const deprecateOldTokens = async (userId: number, token: Token) => {
  await db
    .update(tokensTable)
    .set({ status: TokenStatus.Deprecated })
    .where(
      and(
        eq(tokensTable.userId, userId),
        eq(tokensTable.type, token),
        isNull(tokensTable.usedAt),
        eq(tokensTable.status, TokenStatus.Pending),
      ),
    )
}

export const createToken = async (token: CreateTokenInput): Promise<number> => {
  const [createdToken] = await db
    .insert(tokensTable)
    .values({
      ...token,
      status: token.status || TokenStatus.Pending,
    })
    .returning({ id: tokensTable.id })

  return createdToken.id
}

export const findByToken = async (token: string): Promise<TokenRecord | undefined> => {
  const [foundToken] = await db
    .select()
    .from(tokensTable)
    .where(
      eq(tokensTable.token, token),
    )

  return foundToken
}

export const updateToken = async (
  tokenId: number,
  updates: UpdateTokenInput,
): Promise<void> => {
  await db
    .update(tokensTable)
    .set(updates)
    .where(eq(tokensTable.id, tokenId))
}
