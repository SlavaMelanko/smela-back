import { eq } from 'drizzle-orm'

import type { Transaction } from '../../clients'
import type { TokenRecord } from './types'

import { db } from '../../clients'
import { tokensTable } from '../../schema'

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
