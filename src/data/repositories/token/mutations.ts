import { and, eq, isNull } from 'drizzle-orm'

import type { TokenType } from '@/security/token'

import { TokenStatus } from '@/security/token'

import type { Database } from '../../clients'
import type { CreateTokenInput, UpdateTokenInput } from './types'

import { db } from '../../clients'
import { tokensTable } from '../../schema'

export const deprecateOldTokens = async (
  userId: string,
  tokenType: TokenType,
  tx?: Database,
) => {
  const executor = tx || db

  await executor
    .update(tokensTable)
    .set({ status: TokenStatus.Deprecated })
    .where(
      and(
        eq(tokensTable.userId, userId),
        eq(tokensTable.type, tokenType),
        isNull(tokensTable.usedAt),
        eq(tokensTable.status, TokenStatus.Pending),
      ),
    )
}

export const createToken = async (token: CreateTokenInput, tx?: Database): Promise<number> => {
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

export const issueToken = async (
  userId: string,
  token: CreateTokenInput,
  tx: Database,
): Promise<void> => {
  await deprecateOldTokens(userId, token.type, tx)
  await createToken(token, tx)
}

export const updateToken = async (
  tokenId: number,
  updates: UpdateTokenInput,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .update(tokensTable)
    .set(updates)
    .where(eq(tokensTable.id, tokenId))
}
