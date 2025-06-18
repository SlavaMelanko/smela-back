import { eq } from 'drizzle-orm'

import db, { usersTable } from '@/db'

import type { CreateUserInput, User, UserRecord } from './types'

async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const [foundUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))

  return foundUser
}

async function createUser(user: CreateUserInput): Promise<User> {
  const [createdUser] = await db
    .insert(usersTable)
    .values(user)
    .returning({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
    } as const)

  return createdUser
}

export { createUser, findUserByEmail }
