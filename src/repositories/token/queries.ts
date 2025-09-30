import { eq } from 'drizzle-orm'

import db, { tokensTable } from '@/db'

import type { TokenRecord } from './types'

export const findByToken = async (token: string): Promise<TokenRecord | undefined> => {
  const [foundToken] = await db
    .select()
    .from(tokensTable)
    .where(
      eq(tokensTable.token, token),
    )

  return foundToken
}
