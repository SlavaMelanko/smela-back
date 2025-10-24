import { eq } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { CreateAuthInput, UpdateAuthInput } from './types'

import { db } from '../../clients'
import { authTable } from '../../schema'

export const createAuth = async (auth: CreateAuthInput, tx?: Database): Promise<number> => {
  const executor = tx || db

  const [createdAuth] = await executor
    .insert(authTable)
    .values(auth)
    .returning({ id: authTable.id })

  return createdAuth.id
}

export const updateAuth = async (
  userId: number,
  updates: UpdateAuthInput,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .update(authTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(authTable.userId, userId))
}
