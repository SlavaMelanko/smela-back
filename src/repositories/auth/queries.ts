import { eq } from 'drizzle-orm'

import db, { authTable } from '@/db'

import type { AuthRecord } from './types'

export const findByUserId = async (userId: number): Promise<AuthRecord | undefined> => {
  const [foundAuth] = await db
    .select()
    .from(authTable)
    .where(eq(authTable.userId, userId))

  return foundAuth
}
