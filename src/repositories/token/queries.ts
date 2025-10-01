import { eq } from 'drizzle-orm'

import type { Transaction } from '@/db'

import db, { tokensTable } from '@/db'

import type { TokenRecord } from './types'

export const findByToken = async (token: string, tx?: Transaction): Promise<TokenRecord | undefined> => {
  const executor = tx || db

  const [foundToken] = await executor
    .select()
    .from(tokensTable)
    .where(
      eq(tokensTable.token, token),
    )

  return foundToken
}
