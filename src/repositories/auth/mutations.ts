import { eq } from 'drizzle-orm'

import type { Transaction } from '@/db'

import db, { authTable } from '@/db'

import type { CreateAuthInput, UpdateAuthInput } from './types'

export const createAuth = async (auth: CreateAuthInput, tx?: Transaction): Promise<number> => {
  const executor = tx || db

  const [createdAuth] = await executor
    .insert(authTable)
    .values(auth)
    .returning({ id: authTable.id })

  return createdAuth.id
}

export const updateAuth = async (userId: number, updates: UpdateAuthInput, tx?: Transaction): Promise<void> => {
  const executor = tx || db
  await executor
    .update(authTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(authTable.userId, userId))
}
