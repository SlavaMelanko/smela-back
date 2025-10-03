import { and, eq, isNull } from 'drizzle-orm'

import type { Transaction } from '@/data'
import type { Token } from '@/types'

import { db, tokensTable } from '@/data'
import { TokenStatus } from '@/types'

import type { CreateTokenInput, UpdateTokenInput } from './types'

export const deprecateOldTokens = async (userId: number, token: Token, tx?: Transaction) => {
  const executor = tx || db

  await executor
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

export const createToken = async (token: CreateTokenInput, tx?: Transaction): Promise<number> => {
  const executor = tx || db

  const [createdToken] = await executor
    .insert(tokensTable)
    .values({
      ...token,
      status: token.status || TokenStatus.Pending,
    })
    .returning({ id: tokensTable.id })

  return createdToken.id
}

export const replaceToken = async (
  userId: number,
  token: CreateTokenInput,
  tx: Transaction,
): Promise<void> => {
  await deprecateOldTokens(userId, token.type, tx)
  await createToken(token, tx)
}

export const updateToken = async (
  tokenId: number,
  updates: UpdateTokenInput,
  tx?: Transaction,
): Promise<void> => {
  const executor = tx || db

  await executor
    .update(tokensTable)
    .set(updates)
    .where(eq(tokensTable.id, tokenId))
}
