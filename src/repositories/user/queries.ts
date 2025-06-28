import { eq } from 'drizzle-orm'

import db, { usersTable } from '@/db'

import type { CreateUserInput, User, UserRecord } from './types'

const findUserByEmail = async (email: string): Promise<UserRecord | undefined> => {
  const [foundUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))

  return foundUser
}

const createUser = async (user: CreateUserInput): Promise<User> => {
  const [createdUser] = await db
    .insert(usersTable)
    .values(user)
    .returning({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      role: usersTable.role,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
    } as const)

  return createdUser
}

export { createUser, findUserByEmail }
