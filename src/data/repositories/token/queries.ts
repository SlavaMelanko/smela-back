import { eq } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { Token } from './types'

import { db } from '../../clients'
import { tokensTable } from '../../schema'

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

  return foundToken
}
