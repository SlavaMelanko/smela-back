import { eq } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { TokenRecord } from './types'

import { db } from '../../clients'
import { tokensTable } from '../../schema'

export const findByToken = async (
  token: string,
  tx?: Database,
): Promise<TokenRecord | undefined> => {
  const executor = tx || db

  const [foundToken] = await executor
    .select()
    .from(tokensTable)
    .where(
      eq(tokensTable.token, token),
    )

  return foundToken
}
