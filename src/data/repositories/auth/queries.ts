import { eq } from 'drizzle-orm'

import type { Transaction } from '../../clients'
import type { AuthRecord } from './types'

import { db } from '../../clients'
import { authTable } from '../../schema'

export const findByUserId = async (userId: number, tx?: Transaction): Promise<AuthRecord | undefined> => {
  const executor = tx || db

  const [foundAuth] = await executor
    .select()
    .from(authTable)
    .where(eq(authTable.userId, userId))

  return foundAuth
}
