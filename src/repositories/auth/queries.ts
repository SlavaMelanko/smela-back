import { eq } from 'drizzle-orm'

import db, { authTable } from '@/db'

import type { AuthRecord, CreateAuthInput, UpdateAuthInput } from './types'

const createAuth = async (auth: CreateAuthInput): Promise<number> => {
  const [createdAuth] = await db
    .insert(authTable)
    .values(auth)
    .returning({ id: authTable.id })

  return createdAuth.id
}

const findByUserId = async (userId: number): Promise<AuthRecord | undefined> => {
  const [foundAuth] = await db
    .select()
    .from(authTable)
    .where(eq(authTable.userId, userId))

  return foundAuth
}

const updateAuth = async (userId: number, updates: UpdateAuthInput): Promise<void> => {
  await db
    .update(authTable)
    .set(updates)
    .where(eq(authTable.userId, userId))
}

export { createAuth, findByUserId, updateAuth }
