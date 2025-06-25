import { eq } from 'drizzle-orm'

import db, { authTable } from '@/db'

import type { AuthRecord, CreateAuthInput } from './types'

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

export { createAuth, findByUserId }
