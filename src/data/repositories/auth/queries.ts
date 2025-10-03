import { eq } from 'drizzle-orm'

import type { Transaction } from '@/data'

import { authTable, db } from '@/data'

import type { AuthRecord } from './types'

export const findByUserId = async (userId: number, tx?: Transaction): Promise<AuthRecord | undefined> => {
  const executor = tx || db

  const [foundAuth] = await executor
    .select()
    .from(authTable)
    .where(eq(authTable.userId, userId))

  return foundAuth
}
