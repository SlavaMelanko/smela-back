import { eq } from 'drizzle-orm'

import { db } from '@/data/clients/db'
import { authTable, usersTable } from '@/data/schema'

export const cleanupTestData = async (email: string): Promise<void> => {
  await db.delete(usersTable).where(eq(usersTable.email, email))
}

export const createTestUser = async (userData: typeof usersTable.$inferInsert) => {
  const [user] = await db.insert(usersTable).values(userData).returning()

  return user
}

export const createTestAuth = async (authData: typeof authTable.$inferInsert) => {
  const [authRecord] = await db.insert(authTable).values(authData).returning()

  return authRecord
}

export const findUserByEmail = async (email: string) => {
  return db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  })
}
