import { eq } from 'drizzle-orm'

import type { TokenStatus, TokenType } from '@/security/token'

import type { Database } from '../../clients'
import type { Token, TokenRecord } from './types'

import { db } from '../../clients'
import { tokensTable } from '../../schema'

export const toTypeSafeToken = (token: TokenRecord): Token => {
  return {
    ...token,
    type: token.type as TokenType,
    status: token.status as TokenStatus,
  }
}

export const findByToken = async (
  token: string,
  tx?: Database,
): Promise<Token | undefined> => {
  const executor = tx || db

  const [foundToken] = await executor
    .select()
    .from(tokensTable)
    .where(
      eq(tokensTable.token, token),
    )

  return foundToken ? toTypeSafeToken(foundToken) : undefined
}
